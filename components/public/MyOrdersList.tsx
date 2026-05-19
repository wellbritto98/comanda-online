"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/cart-store";
import {
  getTrackedOrdersSnapshot,
  removeTrackedOrder,
  subscribeTrackedOrders,
  type TrackedOrder,
  updateTrackedOrderStatus,
} from "@/lib/order-tracking-store";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useTrackedOrders() {
  return useSyncExternalStore(
    subscribeTrackedOrders,
    getTrackedOrdersSnapshot,
    () => [] as TrackedOrder[],
  );
}

export function MyOrdersList() {
  const localOrders = useTrackedOrders();
  const [displayOrders, setDisplayOrders] = useState<TrackedOrder[] | null>(null);
  const [syncKey, setSyncKey] = useState(0);

  const orders = displayOrders ?? localOrders;

  const bumpList = useCallback(() => {
    setDisplayOrders(null);
    setSyncKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const local = getTrackedOrdersSnapshot();
      if (local.length === 0) {
        if (!cancelled) setDisplayOrders([]);
        return;
      }

      const updated = await Promise.all(
        local.map(async (o) => {
          try {
            const res = await fetch(
              `/api/orders/${o.orderId}?token=${encodeURIComponent(o.accessToken)}`,
            );
            if (res.ok) {
              const data = await res.json();
              updateTrackedOrderStatus(o.orderId, data.status);
              return { ...o, status: data.status as string };
            }
          } catch {
            /* keep local */
          }
          return o;
        }),
      );
      if (!cancelled) setDisplayOrders(updated);
    })();

    return () => {
      cancelled = true;
    };
  }, [syncKey]);

  function handleRemove(orderId: number) {
    removeTrackedOrder(orderId);
    bumpList();
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
        <p className="text-stone-600">Nenhum pedido salvo neste aparelho.</p>
        <p className="mt-2 text-sm text-stone-500">
          Após fazer um pedido delivery, ele aparecerá aqui automaticamente.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/menu/delivery"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
          >
            Ver cardápio
          </Link>
          <Link
            href="/pedido/rastrear"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
          >
            Rastrear com CPF
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li
          key={order.orderId}
          className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-serif text-lg font-bold text-stone-900">
              Pedido #{order.orderId}
            </p>
            <p className="text-sm text-stone-500">
              {ORDER_STATUS_LABELS[order.status] ?? order.status} ·{" "}
              {formatBRL(order.totalCents)}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {new Date(order.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/pedido/${order.orderId}?token=${encodeURIComponent(order.accessToken)}`}
              className={cn(buttonVariants(), "flex-1 sm:flex-none rounded-full")}
            >
              Acompanhar
            </Link>
            <button
              type="button"
              onClick={() => handleRemove(order.orderId)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-red-600"
              aria-label="Remover da lista"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
