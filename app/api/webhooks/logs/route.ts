import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { webhookLogs, webhookSubscriptions } from "@/drizzle/schema";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? 50),
    100,
  );

  const rows = await db
    .select({
      id: webhookLogs.id,
      event: webhookLogs.event,
      statusCode: webhookLogs.statusCode,
      sentAt: webhookLogs.sentAt,
      error: webhookLogs.error,
      subscriptionId: webhookLogs.subscriptionId,
      url: webhookSubscriptions.url,
    })
    .from(webhookLogs)
    .innerJoin(
      webhookSubscriptions,
      eq(webhookLogs.subscriptionId, webhookSubscriptions.id),
    )
    .where(eq(webhookSubscriptions.restaurantId, session.restaurantId))
    .orderBy(desc(webhookLogs.sentAt))
    .limit(limit);

  return NextResponse.json({ logs: rows });
}
