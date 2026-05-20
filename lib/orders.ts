import { randomUUID } from "crypto";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { menuItems, orderItems, orders } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { findOrOpenComanda } from "@/lib/comandas";
import { getDayBounds, parseDateFilter } from "@/lib/day-filter";
import { getDeliverySettings } from "@/lib/settings";
import { sseManager } from "@/lib/sse-manager";
import {
  buildOrderWebhookPayload,
  dispatchWebhook,
} from "@/lib/webhook";
import type {
  CreateDeliveryOrderInput,
  CreatePresencialOrderInput,
  UpdateOrderStatusInput,
} from "@/lib/validators";

export const TRACK_ORDER_ERROR = "Pedido não encontrado ou dados incorretos";

function notifyOrderCreated(
  restaurantId: number,
  orderId: number,
  status: string,
) {
  sseManager.publish(`restaurant:${restaurantId}`, "order.created", {
    orderId,
    status,
  });
}

function notifyOrderStatusChange(
  orderId: number,
  restaurantId: number,
  status: string,
) {
  sseManager.publish(`order:${orderId}`, "status", { status });
  sseManager.publish(`restaurant:${restaurantId}`, "order.status_changed", {
    orderId,
    status,
  });
}

export function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export type OrderLine = {
  id: number;
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  name: string;
  orderId?: number;
};

export type PublicOrder = {
  id: number;
  status: string;
  type: string;
  total: number;
  estimatedMinutes: number | null;
  customerName: string | null;
  createdAt: Date;
  accessToken: string;
  items: OrderLine[];
};

export type KanbanOrder = {
  id: number;
  type: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  comandaId: number | null;
  comandaNumber: string | null;
  tableNumber: string | null;
  paymentMethod: string | null;
  customerAddress: string | null;
  notes: string | null;
  total: number;
  itemCount: number;
  items: OrderLine[];
  createdAt: Date;
};

function toPublicOrder(
  order: typeof orders.$inferSelect,
  items: OrderLine[],
): PublicOrder {
  return {
    id: order.id,
    status: order.status,
    type: order.type,
    total: order.total,
    estimatedMinutes: order.estimatedMinutes,
    customerName: order.customerName,
    createdAt: order.createdAt,
    accessToken: order.accessToken,
    items,
  };
}

const orderLineSelect = {
  id: orderItems.id,
  orderId: orderItems.orderId,
  menuItemId: orderItems.menuItemId,
  quantity: orderItems.quantity,
  unitPrice: orderItems.unitPrice,
  subtotal: orderItems.subtotal,
  name: menuItems.name,
};

async function fetchOrderLines(orderId: number): Promise<OrderLine[]> {
  const rows = await db
    .select(orderLineSelect)
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));
  return rows.map(({ orderId: _orderId, ...line }) => {
    void _orderId;
    return line;
  });
}

async function fetchOrderLinesForOrders(orderIds: number[]): Promise<OrderLine[]> {
  if (orderIds.length === 0) return [];

  return db
    .select(orderLineSelect)
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(inArray(orderItems.orderId, orderIds));
}

async function resolveLineItems(
  restaurantId: number,
  items: { menuItemId: number; quantity: number }[],
) {
  const itemIds = items.map((i) => i.menuItemId);

  const dbItems = await db
    .select()
    .from(menuItems)
    .where(
      and(
        eq(menuItems.restaurantId, restaurantId),
        eq(menuItems.active, true),
        inArray(menuItems.id, itemIds),
      ),
    );

  if (dbItems.length !== itemIds.length) {
    return { error: "Um ou mais itens não estão disponíveis" as const };
  }

  const itemMap = new Map(dbItems.map((i) => [i.id, i]));

  const lineItems = items.map((line) => {
    const item = itemMap.get(line.menuItemId)!;
    const subtotal = item.price * line.quantity;
    return {
      menuItemId: line.menuItemId,
      quantity: line.quantity,
      unitPrice: item.price,
      subtotal,
      name: item.name,
    };
  });

  return { lineItems };
}

export async function createDeliveryOrder(input: CreateDeliveryOrderInput) {
  const resolved = await resolveLineItems(input.restaurantId, input.items);
  if ("error" in resolved) return resolved;

  const { lineItems } = resolved;
  const settings = await getDeliverySettings(input.restaurantId);
  const deliveryFee = settings.active ? settings.baseFee : 0;
  const estimatedMinutes = settings.active ? settings.estimatedMinutes : 45;

  const itemsTotal = lineItems.reduce((sum, l) => sum + l.subtotal, 0);
  const total = itemsTotal + deliveryFee;
  const accessToken = randomUUID();

  const [order] = await db
    .insert(orders)
    .values({
      restaurantId: input.restaurantId,
      type: "delivery",
      status: "em_analise",
      customerName: input.customerName,
      customerCpf: input.customerCpf,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      customerAddress: input.customerAddress,
      paymentMethod: input.paymentMethod,
      deliveryFee,
      estimatedMinutes,
      total,
      notes: input.notes ?? null,
      accessToken,
    })
    .returning();

  await db.insert(orderItems).values(
    lineItems.map((line) => ({
      orderId: order.id,
      menuItemId: line.menuItemId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
    })),
  );

  void dispatchWebhook(
    input.restaurantId,
    "order.created",
    buildOrderWebhookPayload(order),
  );
  notifyOrderCreated(input.restaurantId, order.id, order.status);

  return {
    order: {
      id: order.id,
      status: order.status,
      total: order.total,
      estimatedMinutes: order.estimatedMinutes,
      accessToken: order.accessToken,
      customerName: order.customerName,
      createdAt: order.createdAt,
    },
    items: lineItems,
  };
}

export async function createPresencialOrder(input: CreatePresencialOrderInput) {
  const resolved = await resolveLineItems(input.restaurantId, input.items);
  if ("error" in resolved) return resolved;

  const session = await findOrOpenComanda(input.restaurantId, input.tableNumber);
  if ("error" in session) return session;

  const { comanda } = session;
  const { lineItems } = resolved;
  const total = lineItems.reduce((sum, l) => sum + l.subtotal, 0);
  const accessToken = randomUUID();

  const [order] = await db
    .insert(orders)
    .values({
      restaurantId: input.restaurantId,
      type: "presencial",
      status: "em_analise",
      comandaId: comanda.id,
      comandaNumber: comanda.tableNumber,
      customerPhone: input.customerPhone ?? null,
      customerEmail: input.customerEmail ?? null,
      deliveryFee: 0,
      total,
      notes: input.notes ?? null,
      accessToken,
    })
    .returning();

  await db.insert(orderItems).values(
    lineItems.map((line) => ({
      orderId: order.id,
      menuItemId: line.menuItemId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
    })),
  );

  void dispatchWebhook(
    input.restaurantId,
    "order.created",
    buildOrderWebhookPayload(order),
  );
  notifyOrderCreated(input.restaurantId, order.id, order.status);

  return {
    order: {
      id: order.id,
      status: order.status,
      total: order.total,
      accessToken: order.accessToken,
      comandaId: comanda.id,
      tableNumber: comanda.tableNumber,
      createdAt: order.createdAt,
    },
    items: lineItems,
  };
}

export async function getOrderById(orderId: number, accessToken: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.accessToken, accessToken)))
    .limit(1);

  if (!order) return null;

  const lines = await fetchOrderLines(orderId);
  return toPublicOrder(order, lines);
}

export async function listKanbanOrders(
  restaurantId: number,
  date?: string,
): Promise<KanbanOrder[]> {
  const { start, end } = getDayBounds(parseDateFilter(date));

  const orderRows = await db
    .select({
      id: orders.id,
      type: orders.type,
      status: orders.status,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      customerEmail: orders.customerEmail,
      comandaId: orders.comandaId,
      comandaNumber: orders.comandaNumber,
      paymentMethod: orders.paymentMethod,
      customerAddress: orders.customerAddress,
      notes: orders.notes,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        gte(orders.createdAt, start),
        lt(orders.createdAt, end),
      ),
    )
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const allLines = await fetchOrderLinesForOrders(orderIds);

  const linesByOrderId = new Map<number, OrderLine[]>();
  for (const line of allLines) {
    const orderId = line.orderId!;
    const { orderId: _orderId, ...rest } = line;
    void _orderId;
    const bucket = linesByOrderId.get(orderId) ?? [];
    bucket.push(rest);
    linesByOrderId.set(orderId, bucket);
  }

  return orderRows.map((row) => {
    const items = linesByOrderId.get(row.id) ?? [];
    return {
      ...row,
      tableNumber: row.comandaNumber,
      items,
      itemCount: items.length,
    };
  });
}

export async function updateOrderStatus(
  orderId: number,
  restaurantId: number,
  input: UpdateOrderStatusInput,
) {
  const [updated] = await db
    .update(orders)
    .set({ status: input.status, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.restaurantId, restaurantId)))
    .returning();

  if (!updated) return null;

  void dispatchWebhook(
    restaurantId,
    "order.status_changed",
    buildOrderWebhookPayload(updated),
  );

  if (input.status === "entregue") {
    void dispatchWebhook(
      restaurantId,
      "order.delivered",
      buildOrderWebhookPayload(updated),
    );
  }

  notifyOrderStatusChange(orderId, restaurantId, updated.status);

  return updated;
}

export async function trackOrderByCpf(orderId: number, cpf: string) {
  const normalized = normalizeCpf(cpf);
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order || order.customerCpf !== normalized) {
    return { error: TRACK_ORDER_ERROR };
  }

  const lines = await fetchOrderLines(orderId);
  return { order: toPublicOrder(order, lines) };
}
