import { NextRequest, NextResponse } from "next/server";
import { trackOrderByCpf } from "@/lib/orders";
import { trackOrderSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = trackOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const result = await trackOrderByCpf(parsed.data.orderId, parsed.data.cpf);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    const { order } = result;
    return NextResponse.json({
      id: order.id,
      status: order.status,
      type: order.type,
      total: order.total,
      estimatedMinutes: order.estimatedMinutes,
      customerName: order.customerName,
      createdAt: order.createdAt,
      accessToken: order.accessToken,
      items: order.items,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
