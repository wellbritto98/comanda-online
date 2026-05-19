"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: { id: number; name: string; sortOrder: number };
  onSuccess: () => void;
}

export function CategoryForm({
  open,
  onOpenChange,
  initial,
  onSuccess,
}: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body = {
      name,
      sortOrder: Number(sortOrder) || 0,
      ...(initial ? { id: initial.id } : {}),
    };

    const res = await fetch("/api/menu/categories", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar");
      return;
    }

    onOpenChange(false);
    onSuccess();
    if (!initial) {
      setName("");
      setSortOrder("0");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {initial ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="cat-order">Ordem</Label>
            <Input
              id="cat-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="mt-1 rounded-xl"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
