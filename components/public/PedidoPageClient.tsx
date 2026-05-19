"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrderStatusView } from "@/components/public/OrderStatusView";
import { getTrackedOrderToken } from "@/lib/order-tracking-store";
import { useClientValue } from "@/lib/use-sync-external-store-shim";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PedidoPageClientProps {
  orderId: number;
  tokenFromUrl: string | null;
}

export function PedidoPageClient({ orderId, tokenFromUrl }: PedidoPageClientProps) {
  const token = useClientValue(
    () => tokenFromUrl ?? getTrackedOrderToken(orderId),
    tokenFromUrl,
  );

  const [order, setOrder] = useState<{
    id: number;
    status: string;
    total: number;
    estimatedMinutes: number | null;
    customerName: string | null;
    items: { name: string; quantity: number; subtotal: number }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const accessToken = token;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/orders/${orderId}?token=${encodeURIComponent(accessToken)}`,
        );
        if (!res.ok) {
          if (!cancelled) {
            setError(
              res.status === 401
                ? "Acesso negado. Use o link completo ou rastreie com CPF."
                : "Pedido não encontrado.",
            );
            setOrder(null);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setError("Erro ao carregar pedido.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Acompanhar pedido #{orderId}
        </h1>
        <p className="mt-3 text-stone-500">
          Para ver este pedido, use o link que você recebeu ao finalizar ou rastreie
          com número do pedido e CPF.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/pedido/rastrear?orderId=${orderId}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")}
          >
            Rastrear com CPF
          </Link>
          <Link
            href="/meus-pedidos"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full rounded-full")}
          >
            Meus pedidos neste aparelho
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center text-stone-500">
        Carregando pedido…
      </div>
    );
  }

  if (error || !order || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-red-600">{error ?? "Pedido não encontrado."}</p>
        <Link
          href="/pedido/rastrear"
          className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex rounded-full")}
        >
          Rastrear pedido
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <OrderStatusView
        orderId={order.id}
        accessToken={token}
        initial={{
          id: order.id,
          status: order.status,
          total: order.total,
          estimatedMinutes: order.estimatedMinutes,
          customerName: order.customerName,
          items: order.items,
        }}
      />
    </main>
  );
}
