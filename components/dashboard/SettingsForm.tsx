"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/cart-store";

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D95F3B");
  const [secondaryColor, setSecondaryColor] = useState("#5F8575");

  const [baseFee, setBaseFee] = useState(0);
  const [feePerKm, setFeePerKm] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [deliveryActive, setDeliveryActive] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.restaurant) {
          setName(data.restaurant.name ?? "");
          setDescription(data.restaurant.description ?? "");
          setLogoUrl(data.restaurant.logoUrl ?? "");
          setAddress(data.restaurant.address ?? "");
          setPrimaryColor(data.restaurant.primaryColor ?? "#D95F3B");
          setSecondaryColor(data.restaurant.secondaryColor ?? "#5F8575");
        }
        if (data.delivery) {
          setBaseFee(data.delivery.baseFee ?? 0);
          setFeePerKm(data.delivery.feePerKm ?? 0);
          setEstimatedMinutes(data.delivery.estimatedMinutes ?? 45);
          setDeliveryActive(data.delivery.active ?? true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant: {
            name,
            description,
            logoUrl: logoUrl || "",
            address,
            primaryColor,
            secondaryColor,
          },
          delivery: {
            baseFee,
            feePerKm,
            estimatedMinutes,
            active: deliveryActive,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Erro ao salvar");
        return;
      }
      setMessage("Configurações salvas.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-stone-500">Carregando…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl font-bold text-stone-900">
          Perfil do restaurante
        </h2>
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">URL do logo</Label>
          <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Cor primária</Label>
            <Input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Cor secundária</Label>
            <Input
              id="secondaryColor"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl font-bold text-stone-900">Delivery</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={deliveryActive}
            onChange={(e) => setDeliveryActive(e.target.checked)}
          />
          Delivery ativo
        </label>
        <div className="space-y-2">
          <Label htmlFor="baseFee">Taxa base (centavos)</Label>
          <Input
            id="baseFee"
            type="number"
            min={0}
            value={baseFee}
            onChange={(e) => setBaseFee(Number(e.target.value))}
          />
          <p className="text-xs text-stone-500">Ex.: {formatBRL(baseFee)}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feePerKm">Taxa por km (centavos)</Label>
          <Input
            id="feePerKm"
            type="number"
            min={0}
            value={feePerKm}
            onChange={(e) => setFeePerKm(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedMinutes">Prazo estimado (min)</Label>
          <Input
            id="estimatedMinutes"
            type="number"
            min={1}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
          />
        </div>
      </section>

      {message && <p className="text-sm text-stone-600">{message}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "Salvando…" : "Salvar configurações"}
      </Button>
    </form>
  );
}
