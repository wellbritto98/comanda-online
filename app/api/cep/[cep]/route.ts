import { NextRequest, NextResponse } from "next/server";
import { fetchAddressByCep } from "@/lib/viacep";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ cep: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { cep } = await context.params;
  const data = await fetchAddressByCep(cep);
  if (!data) {
    return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
  }
  return NextResponse.json(data);
}
