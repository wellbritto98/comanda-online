import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { webhookSubscriptions } from "@/drizzle/schema";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookSubscriptionSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const subId = Number(id);
  if (!Number.isFinite(subId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = webhookSubscriptionSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(webhookSubscriptions)
    .set({
      ...(parsed.data.url !== undefined && { url: parsed.data.url }),
      ...(parsed.data.events !== undefined && { events: parsed.data.events }),
      ...(parsed.data.active !== undefined && { active: parsed.data.active }),
    })
    .where(
      and(
        eq(webhookSubscriptions.id, subId),
        eq(webhookSubscriptions.restaurantId, session.restaurantId),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const subId = Number(id);
  if (!Number.isFinite(subId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(webhookSubscriptions)
    .where(
      and(
        eq(webhookSubscriptions.id, subId),
        eq(webhookSubscriptions.restaurantId, session.restaurantId),
      ),
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
