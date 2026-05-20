import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { closeComanda, getComandaById } from "@/lib/comandas";
import { closeComandaSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const comandaId = Number.parseInt(id, 10);
  if (Number.isNaN(comandaId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = closeComandaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const detail = await getComandaById(comandaId, session.restaurantId);
  if (!detail) {
    return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
  }

  try {
    const result = await closeComanda(
      comandaId,
      session.restaurantId,
      session.userId,
      parsed.data,
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      id: result.comanda.id,
      tableNumber: result.comanda.tableNumber,
      total: result.total,
      paymentMethod: result.comanda.paymentMethod,
      pendingOrdersCount: result.pendingOrdersCount,
      closedAt: result.comanda.closedAt?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
