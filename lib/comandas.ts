import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { comandas, menuItems, orderItems, orders } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { getDayBounds, parseDateFilter } from "@/lib/day-filter";
import type { OrderLine } from "@/lib/orders";
import { sseManager } from "@/lib/sse-manager";
import { dispatchWebhook } from "@/lib/webhook";
import type { CloseComandaInput } from "@/lib/validators";

const STALE_MS = 24 * 60 * 60 * 1000;

export type ComandaRound = {
  id: number;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderLine[];
};

export type OpenComandaSummary = {
  id: number;
  tableNumber: string;
  openedAt: Date;
  roundCount: number;
  partialTotal: number;
  pendingOrdersCount: number;
  isStale: boolean;
};

export type ComandaDetail = OpenComandaSummary & {
  status: "open" | "closed";
  rounds: ComandaRound[];
};

export type PublicComandaSession = {
  id: number;
  tableNumber: string;
  partialTotal: number;
  roundCount: number;
};

function normalizeTableNumber(tableNumber: string) {
  return tableNumber.trim();
}

function notifyComandaOpened(restaurantId: number, comandaId: number, tableNumber: string) {
  sseManager.publish(`restaurant:${restaurantId}`, "comanda.opened", {
    comandaId,
    tableNumber,
  });
}

function notifyComandaClosed(
  restaurantId: number,
  comandaId: number,
  tableNumber: string,
  total: number,
) {
  sseManager.publish(`restaurant:${restaurantId}`, "comanda.closed", {
    comandaId,
    tableNumber,
    total,
  });
}

async function fetchRoundsForComanda(comandaId: number): Promise<ComandaRound[]> {
  const orderRows = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.comandaId, comandaId))
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const allLines = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      menuItemId: orderItems.menuItemId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      subtotal: orderItems.subtotal,
      name: menuItems.name,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(inArray(orderItems.orderId, orderIds));

  const linesByOrder = new Map<number, OrderLine[]>();
  for (const line of allLines) {
    const { orderId, ...rest } = line;
    const bucket = linesByOrder.get(orderId) ?? [];
    bucket.push(rest);
    linesByOrder.set(orderId, bucket);
  }

  return orderRows.map((row) => ({
    ...row,
    items: linesByOrder.get(row.id) ?? [],
  }));
}

async function summarizeComanda(
  comanda: typeof comandas.$inferSelect,
  rounds: ComandaRound[],
): Promise<OpenComandaSummary> {
  const partialTotal = rounds.reduce((sum, r) => sum + r.total, 0);
  const pendingOrdersCount = rounds.filter((r) => r.status !== "entregue").length;
  const isStale = Date.now() - comanda.openedAt.getTime() > STALE_MS;

  return {
    id: comanda.id,
    tableNumber: comanda.tableNumber,
    openedAt: comanda.openedAt,
    roundCount: rounds.length,
    partialTotal,
    pendingOrdersCount,
    isStale,
  };
}

export async function findOrOpenComanda(restaurantId: number, tableNumber: string) {
  const normalized = normalizeTableNumber(tableNumber);
  if (!normalized) {
    return { error: "Número da mesa é obrigatório" as const };
  }

  const [existing] = await db
    .select()
    .from(comandas)
    .where(
      and(
        eq(comandas.restaurantId, restaurantId),
        eq(comandas.tableNumber, normalized),
        eq(comandas.status, "open"),
      ),
    )
    .limit(1);

  if (existing) return { comanda: existing, created: false };

  const [created] = await db
    .insert(comandas)
    .values({
      restaurantId,
      tableNumber: normalized,
      status: "open",
    })
    .returning();

  void dispatchWebhook(restaurantId, "comanda.opened", {
    id: created.id,
    tableNumber: created.tableNumber,
    openedAt: created.openedAt,
  });
  notifyComandaOpened(restaurantId, created.id, created.tableNumber);

  return { comanda: created, created: true };
}

export async function getOpenComandaByTable(
  restaurantId: number,
  tableNumber: string,
): Promise<PublicComandaSession | null> {
  const normalized = normalizeTableNumber(tableNumber);
  if (!normalized) return null;

  const [comanda] = await db
    .select()
    .from(comandas)
    .where(
      and(
        eq(comandas.restaurantId, restaurantId),
        eq(comandas.tableNumber, normalized),
        eq(comandas.status, "open"),
      ),
    )
    .limit(1);

  if (!comanda) return null;

  const rounds = await fetchRoundsForComanda(comanda.id);
  const partialTotal = rounds.reduce((sum, r) => sum + r.total, 0);

  return {
    id: comanda.id,
    tableNumber: comanda.tableNumber,
    partialTotal,
    roundCount: rounds.length,
  };
}

export async function listOpenComandas(
  restaurantId: number,
  date?: string,
): Promise<OpenComandaSummary[]> {
  const { start, end } = getDayBounds(parseDateFilter(date));

  const openRows = await db
    .select()
    .from(comandas)
    .where(
      and(
        eq(comandas.restaurantId, restaurantId),
        eq(comandas.status, "open"),
        gte(comandas.openedAt, start),
        lt(comandas.openedAt, end),
      ),
    )
    .orderBy(desc(comandas.openedAt));

  const summaries: OpenComandaSummary[] = [];
  for (const comanda of openRows) {
    const rounds = await fetchRoundsForComanda(comanda.id);
    summaries.push(await summarizeComanda(comanda, rounds));
  }
  return summaries;
}

export async function getComandaById(
  comandaId: number,
  restaurantId: number,
): Promise<ComandaDetail | null> {
  const [comanda] = await db
    .select()
    .from(comandas)
    .where(and(eq(comandas.id, comandaId), eq(comandas.restaurantId, restaurantId)))
    .limit(1);

  if (!comanda) return null;

  const rounds = await fetchRoundsForComanda(comanda.id);
  const summary = await summarizeComanda(comanda, rounds);

  return {
    ...summary,
    status: comanda.status,
    rounds,
  };
}

export async function closeComanda(
  comandaId: number,
  restaurantId: number,
  userId: number,
  input: CloseComandaInput,
) {
  const [comanda] = await db
    .select()
    .from(comandas)
    .where(
      and(
        eq(comandas.id, comandaId),
        eq(comandas.restaurantId, restaurantId),
        eq(comandas.status, "open"),
      ),
    )
    .limit(1);

  if (!comanda) return { error: "Comanda não encontrada ou já fechada" as const };

  const rounds = await fetchRoundsForComanda(comanda.id);
  const partialTotal = rounds.reduce((sum, r) => sum + r.total, 0);
  const pendingOrdersCount = rounds.filter((r) => r.status !== "entregue").length;

  const [closed] = await db
    .update(comandas)
    .set({
      status: "closed",
      paymentMethod: input.paymentMethod,
      total: partialTotal,
      closedAt: new Date(),
      closedBy: userId,
    })
    .where(eq(comandas.id, comandaId))
    .returning();

  void dispatchWebhook(restaurantId, "comanda.closed", {
    id: closed.id,
    tableNumber: closed.tableNumber,
    total: closed.total,
    paymentMethod: closed.paymentMethod,
    pendingOrdersCount,
  });
  notifyComandaClosed(restaurantId, closed.id, closed.tableNumber, closed.total);

  return {
    comanda: closed,
    pendingOrdersCount,
    total: partialTotal,
  };
}
