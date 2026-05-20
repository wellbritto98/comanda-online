import { NextRequest, NextResponse } from "next/server";
import { getOpenComandaByTable } from "@/lib/comandas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const tableNumber = request.nextUrl.searchParams.get("tableNumber");
  const restaurantId = Number.parseInt(
    request.nextUrl.searchParams.get("restaurantId") ?? "",
    10,
  );

  if (!tableNumber?.trim()) {
    return NextResponse.json({ error: "tableNumber obrigatório" }, { status: 400 });
  }
  if (Number.isNaN(restaurantId) || restaurantId < 1) {
    return NextResponse.json({ error: "restaurantId inválido" }, { status: 400 });
  }

  try {
    const session = await getOpenComandaByTable(restaurantId, tableNumber);
    if (!session) {
      return NextResponse.json({ session: null });
    }
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
