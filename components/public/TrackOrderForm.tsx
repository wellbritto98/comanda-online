"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addTrackedOrder } from "@/lib/order-tracking-store";

export function TrackOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") ?? "";

  const [orderId, setOrderId] = useState(initialOrderId);
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, cpf }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Pedido não encontrado ou dados incorretos");
        return;
      }

      addTrackedOrder({
        orderId: data.id,
        accessToken: data.accessToken,
        createdAt: data.createdAt ?? new Date().toISOString(),
        status: data.status,
        totalCents: data.total,
        customerName: data.customerName,
      });

      router.push(
        `/pedido/${data.id}?token=${encodeURIComponent(data.accessToken)}`,
      );
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="orderId">Número do pedido</Label>
        <Input
          id="orderId"
          type="number"
          inputMode="numeric"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          required
          placeholder="Ex.: 42"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          required
          placeholder="000.000.000-00"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Buscando…" : "Rastrear pedido"}
      </Button>
    </form>
  );
}
