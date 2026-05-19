"use client";

import { useState } from "react";
import { CategoryNav } from "@/components/public/CategoryNav";
import { Header } from "@/components/public/Header";
import { MenuSection } from "@/components/public/MenuSection";
import { PresencialOrderForm } from "@/components/public/PresencialOrderForm";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatBRL } from "@/lib/cart-store";
import { ShoppingBag } from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
}

interface Category {
  id: number;
  name: string;
  items: MenuItem[];
}

interface PresencialMenuViewProps {
  restaurant: {
    id: number;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
  };
  categories: Category[];
}

export function PresencialMenuView({
  restaurant,
  categories,
}: PresencialMenuViewProps) {
  const addItem = useCartStore((s) => s.addItem);
  const itemCount = useCartStore((s) => s.itemCount);
  const totalCents = useCartStore((s) => s.totalCents);

  const [comandaNumber, setComandaNumber] = useState("");
  const [comandaConfirmed, setComandaConfirmed] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (successOrderId) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Pedido enviado!
        </h1>
        <p className="mt-4 text-stone-600">
          Seu pedido <span className="font-semibold">#{successOrderId}</span> foi
          registrado na comanda{" "}
          <span className="font-semibold">{comandaNumber}</span>.
        </p>
        <Button
          className="mt-8"
          onClick={() => {
            setSuccessOrderId(null);
            setComandaConfirmed(false);
            setComandaNumber("");
          }}
        >
          Fazer novo pedido
        </Button>
      </main>
    );
  }

  return (
    <>
      <Header
        name={restaurant.name}
        description={restaurant.description ?? "Pedido na mesa"}
        logoUrl={restaurant.logoUrl}
      />

      {!comandaConfirmed ? (
        <section className="mx-auto max-w-md px-4 py-8">
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Número da comanda
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Informe o número da comanda na sua mesa para continuar.
          </p>
          <div className="mt-6 space-y-2">
            <Label htmlFor="comanda">Comanda</Label>
            <Input
              id="comanda"
              value={comandaNumber}
              onChange={(e) => setComandaNumber(e.target.value)}
              placeholder="Ex.: 12"
              required
            />
          </div>
          <Button
            className="mt-4 w-full"
            disabled={!comandaNumber.trim()}
            onClick={() => setComandaConfirmed(true)}
          >
            Continuar
          </Button>
        </section>
      ) : (
        <>
          <div className="sticky top-14 z-20 border-b border-stone-200 bg-[#FAFAF8] px-4 py-2 text-center text-sm text-stone-600">
            Comanda <span className="font-semibold text-stone-900">{comandaNumber}</span>
            <button
              type="button"
              className="ml-2 text-primary underline"
              onClick={() => setComandaConfirmed(false)}
            >
              alterar
            </button>
          </div>
          {categories.length > 0 && (
            <CategoryNav
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            />
          )}
          {categories.map((category) => (
            <MenuSection
              key={category.id}
              id={category.id}
              name={category.name}
              items={category.items}
              onAddItem={(item) =>
                addItem({
                  menuItemId: item.id,
                  name: item.name,
                  price: item.price,
                })
              }
            />
          ))}
          {categories.length === 0 && (
            <p className="text-center text-stone-500">Nenhum item no cardápio.</p>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-[#FAFAF8] px-4 py-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <Button
                type="button"
                className="w-full gap-2"
                disabled={itemCount() === 0}
                onClick={() => setSheetOpen(true)}
              >
                <ShoppingBag className="h-4 w-4" />
                Ver pedido ({itemCount()}) · {formatBRL(totalCents())}
              </Button>
              <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Finalizar pedido</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <PresencialOrderForm
                    restaurantId={restaurant.id}
                    comandaNumber={comandaNumber}
                    onSuccess={(id) => {
                      setSheetOpen(false);
                      setSuccessOrderId(id);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </>
      )}
    </>
  );
}
