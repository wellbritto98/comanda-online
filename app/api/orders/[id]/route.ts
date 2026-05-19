import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";

export const runtime = "nodejs";

function serializeOrder(order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>) {
  return {
    id: order.id,
    status: order.status,
    type: order.type,
    total: order.total,
    estimatedMinutes: order.estimatedMinutes,
    customerName: order.customerName,
    createdAt: order.createdAt,
    items: order.items,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const orderId = Number.parseInt(id, 10);
  if (Number.isNaN(orderId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token de acesso obrigatório" }, { status: 401 });
  }

  try {
    const order = await getOrderById(orderId, token);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json(serializeOrder(order));
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
