import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sseManager } from "@/lib/sse-manager";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return new Response("Não autorizado", { status: 401 });
  }

  const clientId = randomUUID();
  const channel = `restaurant:${session.restaurantId}`;
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

      send(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

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
