"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL, useCartStore } from "@/lib/cart-store";

interface PresencialOrderFormProps {
  restaurantId: number;
  tableNumber: string;
  onSuccess: (orderId: number, comandaId: number) => void;
}

export function PresencialOrderForm({
  restaurantId,
  tableNumber,
  onSuccess,
}: PresencialOrderFormProps) {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const totalCents = useCartStore((s) => s.totalCents);

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "presencial",
          restaurantId,
          tableNumber,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          notes: notes || undefined,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar pedido");
        return;
      }

      clear();
      onSuccess(data.order.id, data.order.comandaId);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
        Mesa <span className="font-bold text-stone-900">{tableNumber}</span> ·{" "}
        {formatBRL(totalCents())}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="presencialPhone">Celular (opcional)</Label>
          <Input
            id="presencialPhone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="presencialEmail">E-mail (opcional)</Label>
          <Input
            id="presencialEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="presencialNotes">Observações (opcional)</Label>
        <Input
          id="presencialNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading || items.length === 0} className="w-full">
        {loading ? "Enviando…" : "Enviar para a cozinha"}
      </Button>
    </form>
  );
}
