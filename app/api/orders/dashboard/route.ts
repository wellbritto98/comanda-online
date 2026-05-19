import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listKanbanOrders } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const orders = await listKanbanOrders(session.restaurantId);
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
