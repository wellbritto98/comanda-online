import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getComandaById } from "@/lib/comandas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const comandaId = Number.parseInt(id, 10);
  if (Number.isNaN(comandaId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const comanda = await getComandaById(comandaId, session.restaurantId);
    if (!comanda) {
      return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      ...comanda,
      openedAt: comanda.openedAt.toISOString(),
      rounds: comanda.rounds.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
