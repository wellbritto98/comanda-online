import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { getOrderById } from "@/lib/orders";
import { sseManager } from "@/lib/sse-manager";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const orderId = Number.parseInt(id, 10);
  if (Number.isNaN(orderId)) {
    return new Response("ID inválido", { status: 400 });
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new Response("Token obrigatório", { status: 401 });
  }

  const order = await getOrderById(orderId, token);
  if (!order) {
    return new Response("Pedido não encontrado", { status: 404 });
  }

  const clientId = randomUUID();
  const channel = `order:${orderId}`;
  const encoder = new TextEncoder();

  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let cleanedUp = false;
  let cleanupFn: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        if (heartbeat) clearInterval(heartbeat);
        sseManager.unsubscribe(channel, clientId);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      cleanupFn = cleanup;

      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      send(
        `event: status\ndata: ${JSON.stringify({ status: order.status })}\n\n`,
      );

      heartbeat = setInterval(() => {
        send(": heartbeat\n\n");
      }, 25_000);

      sseManager.subscribe(channel, { id: clientId, send });

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanupFn?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
