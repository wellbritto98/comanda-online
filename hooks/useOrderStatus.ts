"use client";

import { useCallback, useEffect, useRef } from "react";
import { updateTrackedOrderStatus } from "@/lib/order-tracking-store";

export interface OrderSyncData {
  id: number;
  status: string;
  total: number;
  estimatedMinutes: number | null;
  customerName: string | null;
  items: { name: string; quantity: number; subtotal: number }[];
}

const POLL_MS = 5_000;
const POLL_FALLBACK_MS = 30_000;
const POLL_SAFETY_MS = 60_000;

export function useOrderStatus(
  orderId: number,
  accessToken: string,
  onUpdate: (data: OrderSyncData) => void,
) {
  const onUpdateRef = useRef(onUpdate);
  const statusRef = useRef<string | null>(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const fetchOrder = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(
        `/api/orders/${orderId}?token=${encodeURIComponent(accessToken)}`,
      );
      if (!res.ok) return statusRef.current;
      const data = (await res.json()) as OrderSyncData;
      statusRef.current = data.status;
      onUpdateRef.current(data);
      updateTrackedOrderStatus(orderId, data.status);
      return data.status;
    } catch {
      return statusRef.current;
    }
  }, [orderId, accessToken]);

  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const stopPolling = () => {
      if (pollId) {
        clearInterval(pollId);
        pollId = null;
      }
    };

    const startPolling = (intervalMs: number) => {
      stopPolling();
      pollId = setInterval(async () => {
        const status = await fetchOrder();
        if (status === "entregue") stopPolling();
      }, intervalMs);
    };

    const connectSse = () => {
      const url = `/api/orders/${orderId}/stream?token=${encodeURIComponent(accessToken)}`;
      es = new EventSource(url);

      es.addEventListener("status", (event) => {
        try {
          const { status } = JSON.parse((event as MessageEvent).data) as {
            status: string;
          };
          if (!status || status === statusRef.current) return;
          statusRef.current = status;
          updateTrackedOrderStatus(orderId, status);
          void fetchOrder();
        } catch {
          /* ignore malformed event */
        }
      });

      es.onopen = () => {
        startPolling(POLL_SAFETY_MS);
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (!cancelled) startPolling(POLL_FALLBACK_MS);
      };
    };

    void fetchOrder().then((status) => {
      if (cancelled || status === "entregue") return;

      if (typeof EventSource !== "undefined") {
        connectSse();
      } else {
        startPolling(POLL_MS);
      }
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchOrder();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      es?.close();
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [orderId, accessToken, fetchOrder]);
}
