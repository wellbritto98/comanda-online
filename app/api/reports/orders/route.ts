import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrdersSummary } from "@/lib/reports";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");

  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Datas inválidas" }, { status: 400 });
  }

  const summary = await getOrdersSummary(session.restaurantId, from, to);
  return NextResponse.json(summary);
}
