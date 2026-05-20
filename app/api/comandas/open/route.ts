import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listOpenComandas } from "@/lib/comandas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const comandas = await listOpenComandas(session.restaurantId, date);
    return NextResponse.json({
      comandas: comandas.map((c) => ({
        ...c,
        openedAt: c.openedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
