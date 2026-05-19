import { NextRequest, NextResponse } from "next/server";
import { createDeliveryOrder, createPresencialOrder } from "@/lib/orders";
import {
  createDeliveryOrderSchema,
  createPresencialOrderSchema,
} from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderType = body?.type === "presencial" ? "presencial" : "delivery";

    if (orderType === "presencial") {
      const parsed = createPresencialOrderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
          { status: 400 },
        );
      }
      const result = await createPresencialOrder(parsed.data);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result, { status: 201 });
    }

    const parsed = createDeliveryOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const result = await createDeliveryOrder(parsed.data);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
