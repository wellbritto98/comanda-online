import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { webhookSubscriptions } from "@/drizzle/schema";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { webhookSubscriptionSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.restaurantId, session.restaurantId));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = webhookSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const secret = randomBytes(32).toString("hex");

  const [created] = await db
    .insert(webhookSubscriptions)
    .values({
      restaurantId: session.restaurantId,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
      active: parsed.data.active ?? true,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
