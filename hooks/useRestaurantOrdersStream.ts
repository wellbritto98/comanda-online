"use client";

import { useEffect, useRef } from "react";
import type { OrderStatusKey } from "@/lib/order-status";

export type RestaurantOrderStatusEvent = {
  orderId: number;
  status: OrderStatusKey;
};

export function useRestaurantOrdersStream(handlers: {
  onStatusChanged: (event: RestaurantOrderStatusEvent) => void;
  onOrderCreated: () => void;
}) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (typeof EventSource === "undefined") return;

    const es = new EventSource("/api/sse/restaurant");

    es.addEventListener("order.status_changed", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as {
          orderId: number;
          status: string;
        };
        handlersRef.current.onStatusChanged({
          orderId: data.orderId,
          status: data.status as OrderStatusKey,
        });
      } catch {
        /* ignore */
      }
    });

    es.addEventListener("order.created", () => {
      handlersRef.current.onOrderCreated();
    });

    return () => es.close();
  }, []);
}
