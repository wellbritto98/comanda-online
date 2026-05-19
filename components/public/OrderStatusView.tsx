"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { formatBRL } from "@/lib/cart-store";
import { addTrackedOrder } from "@/lib/order-tracking-store";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { OrderStatusTimeline } from "@/components/public/OrderStatusTimeline";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOrderStatus, type OrderSyncData } from "@/hooks/useOrderStatus";

interface OrderItem {
  name: string;
  quantity: number;
  subtotal: number;
}

interface OrderData {
  id: number;
  status: string;
  total: number;
  estimatedMinutes: number | null;
  customerName: string | null;
  items: OrderItem[];
}

interface OrderStatusViewProps {
  orderId: number;
  accessToken: string;
  initial: OrderData;
}

export function OrderStatusView({
  orderId,
  accessToken,
  initial,
}: OrderStatusViewProps) {
  const [order, setOrder] = useState(initial);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    addTrackedOrder({
      orderId,
      accessToken,
      createdAt: new Date().toISOString(),
      status: initial.status,
      totalCents: initial.total,
      customerName: initial.customerName,
    });
  }, [orderId, accessToken, initial.status, initial.total, initial.customerName]);

  const handleOrderUpdate = useCallback((data: OrderSyncData) => {
    setOrder((prev) => ({ ...prev, ...data }));
  }, []);

  useOrderStatus(orderId, accessToken, handleOrderUpdate);

  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const trackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pedido/${orderId}?token=${encodeURIComponent(accessToken)}`
      : "";

  async function copyLink() {
    if (!trackUrl) return;
    await navigator.clipboard.writeText(trackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="animate-fade-up space-y-8">
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-primary">
          Pedido #{order.id}
        </p>
        <h1 className="mt-2 text-center font-serif text-3xl font-bold text-stone-900">
          {statusLabel}
        </h1>
        {order.estimatedMinutes && order.status !== "entregue" && (
          <p className="mt-2 text-center text-stone-500">
            Previsão: ~{order.estimatedMinutes} minutos
          </p>
        )}
        <div className="mt-6">
          <OrderStatusTimeline currentStatus={order.status} />
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <h2 className="font-serif text-sm font-bold text-stone-800">
          Guarde para acompanhar depois
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Número do pedido: <strong className="text-stone-900">#{order.id}</strong>
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Você também pode recuperar com número do pedido + CPF em outro aparelho.
        </p>
        {trackUrl && (
          <button
            type="button"
            onClick={copyLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                Link copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar link do pedido
              </>
            )}
          </button>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-serif text-xl font-bold text-stone-800">Itens</h2>
        <ul className="space-y-2">
          {order.items.map((item, i) => (
            <li
              key={`${item.name}-${i}`}
              className="flex justify-between rounded-xl bg-stone-50 px-4 py-3 text-sm"
            >
              <span>
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium">{formatBRL(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-stone-200 pt-4 font-bold">
          <span>Total</span>
          <span className="text-primary">{formatBRL(order.total)}</span>
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <Link
          href="/meus-pedidos"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
        >
          Meus pedidos neste aparelho
        </Link>
        <Link
          href="/pedido/rastrear"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full")}
        >
          Rastrear com CPF
        </Link>
        <Link
          href="/menu/delivery"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full text-stone-500")}
        >
          Voltar ao cardápio
        </Link>
      </div>
    </div>
  );
}
