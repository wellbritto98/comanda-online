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

interface Category {
  id: number;
  name: string;
}

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  initial?: {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    active: boolean;
    categoryIds: number[];
  };
  onSuccess: () => void;
}

export function ItemForm(props: ItemFormProps) {
  const { open, onOpenChange, initial } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {initial ? "Editar item" : "Novo item"}
          </DialogTitle>
        </DialogHeader>
        {open ? (
          <ItemFormFields key={initial?.id ?? "new"} {...props} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ItemFormFields({
  categories,
  initial,
  onOpenChange,
  onSuccess,
}: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(
    initial ? String(initial.price / 100) : "",
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [categoryIds, setCategoryIds] = useState<number[]>(
    initial?.categoryIds ?? (categories[0] ? [categories[0].id] : []),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleCategory(id: number) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
    if (Number.isNaN(priceCents) || priceCents <= 0) {
      setError("Preço inválido");
      setLoading(false);
      return;
    }

    if (categoryIds.length === 0) {
      setError("Selecione ao menos uma categoria");
      setLoading(false);
      return;
    }

    const body = {
      name,
      description: description || undefined,
      price: priceCents,
      imageUrl: imageUrl || "",
      active,
      categoryIds,
      ...(initial ? { id: initial.id } : {}),
    };

    const res = await fetch("/api/menu/items", {
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
  }

  return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item-name">Nome</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="item-desc">Descrição</Label>
            <Input
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item-price">Preço (R$)</Label>
              <Input
                id="item-price"
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-1 rounded-xl"
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="item-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="item-active">Ativo no cardápio</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="item-image">URL da imagem</Label>
            <Input
              id="item-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label>Categorias</Label>
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
  );
}
