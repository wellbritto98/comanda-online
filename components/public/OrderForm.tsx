"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL, useCartStore } from "@/lib/cart-store";
import { addTrackedOrder } from "@/lib/order-tracking-store";
import { formatAddressFromCep } from "@/lib/viacep";

interface OrderFormProps {
  restaurantId: number;
  onSuccess?: () => void;
}

export function OrderForm({ restaurantId, onSuccess }: OrderFormProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const totalCents = useCartStore((s) => s.totalCents);

  const [customerName, setCustomerName] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cep, setCep] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "dinheiro" | "cartao_entrega" | "pix"
  >("pix");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    const t = setTimeout(() => {
      setCepLoading(true);
      fetch(`/api/cep/${digits}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setCustomerAddress(formatAddressFromCep(data, streetNumber));
        })
        .catch(() => undefined)
        .finally(() => setCepLoading(false));
    }, 400);

    return () => clearTimeout(t);
  }, [cep, streetNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          customerName,
          customerCpf,
          customerPhone,
          customerEmail,
          customerAddress,
          paymentMethod,
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
      onSuccess?.();

      const { order } = data;
      addTrackedOrder({
        orderId: order.id,
        accessToken: order.accessToken,
        createdAt: order.createdAt ?? new Date().toISOString(),
        status: order.status,
        totalCents: order.total,
        customerName: order.customerName ?? null,
      });

      router.push(
        `/pedido/${order.id}?token=${encodeURIComponent(order.accessToken)}`,
      );
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
        Total do pedido:{" "}
        <span className="font-bold text-stone-900">{formatBRL(totalCents())}</span>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerName">Nome completo</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
          placeholder="Seu nome"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Celular / WhatsApp</Label>
          <Input
            id="customerPhone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">E-mail</Label>
          <Input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            placeholder="voce@email.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerCpf">CPF</Label>
        <Input
          id="customerCpf"
          value={customerCpf}
          onChange={(e) => setCustomerCpf(e.target.value)}
          required
          placeholder="000.000.000-00"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="00000-000"
          />
          {cepLoading && (
            <p className="text-xs text-stone-400">Buscando endereço…</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="streetNumber">Número</Label>
          <Input
            id="streetNumber"
            value={streetNumber}
            onChange={(e) => setStreetNumber(e.target.value)}
            placeholder="123"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerAddress">Endereço de entrega</Label>
        <textarea
          id="customerAddress"
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
          required
          rows={3}
          placeholder="Rua, número, bairro, cidade — CEP"
          className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Forma de pagamento</Label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) =>
            setPaymentMethod(
              e.target.value as "dinheiro" | "cartao_entrega" | "pix",
            )
          }
          className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="pix">Pix</option>
          <option value="cartao_entrega">Cartão na entrega</option>
          <option value="dinheiro">Dinheiro</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: sem cebola"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading || items.length === 0} className="w-full">
        {loading ? "Enviando…" : "Confirmar pedido"}
      </Button>
    </form>
  );
}
