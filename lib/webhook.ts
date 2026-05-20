import { createHmac } from "crypto";
import { and, eq } from "drizzle-orm";
import { webhookLogs, webhookSubscriptions } from "@/drizzle/schema";
import { db } from "@/lib/db";

export type WebhookEvent =
  | "order.created"
  | "order.status_changed"
  | "order.delivered"
  | "comanda.opened"
  | "comanda.closed"
  | "menu.item_updated";

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function dispatchWebhook(
  restaurantId: number,
  event: WebhookEvent,
  payload: object,
) {
  const subscriptions = await db
    .select()
    .from(webhookSubscriptions)
    .where(
      and(
        eq(webhookSubscriptions.restaurantId, restaurantId),
        eq(webhookSubscriptions.active, true),
      ),
    );

  const matching = subscriptions.filter((sub) => sub.events.includes(event));
  if (matching.length === 0) return;

  const body = JSON.stringify({
    event,
    data: payload,
    timestamp: Date.now(),
  });

  await Promise.allSettled(
    matching.map(async (sub) => {
      const signature = sign(body, sub.secret);
      try {
        const res = await fetch(sub.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
          },
          body,
        });
        const responseBody = await res.text().catch(() => "");
        await db.insert(webhookLogs).values({
          subscriptionId: sub.id,
          event,
          payload: body,
          statusCode: res.status,
          responseBody: responseBody.slice(0, 2000),
          error: res.ok ? null : `HTTP ${res.status}`,
        });
      } catch (err) {
        await db.insert(webhookLogs).values({
          subscriptionId: sub.id,
          event,
          payload: body,
          statusCode: null,
          responseBody: null,
          error: err instanceof Error ? err.message : "Erro ao enviar",
        });
      }
    }),
  );
}

export function buildOrderWebhookPayload(order: {
  id: number;
  type: string;
  status: string;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  comandaNumber: string | null;
  paymentMethod: string | null;
}) {
  return {
    id: order.id,
    type: order.type,
    status: order.status,
    total: order.total,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerAddress: order.customerAddress,
    comandaNumber: order.comandaNumber,
    paymentMethod: order.paymentMethod,
  };
}
