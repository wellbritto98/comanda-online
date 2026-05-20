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

interface OpenSession {
  id: number;
  tableNumber: string;
  partialTotal: number;
  roundCount: number;
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
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount);
  const totalCents = useCartStore((s) => s.totalCents);

  const [tableNumber, setTableNumber] = useState("");
  const [tableConfirmed, setTableConfirmed] = useState(false);
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);
  const [success, setSuccess] = useState<{
    orderId: number;
    comandaId: number;
  } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function confirmTable() {
    const trimmed = tableNumber.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(
        `/api/comandas/public?tableNumber=${encodeURIComponent(trimmed)}&restaurantId=${restaurant.id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setOpenSession(data.session ?? null);
      }
    } catch {
      /* ignore — mesa sem sessão ainda */
    }
    setTableConfirmed(true);
  }

  async function refreshSession() {
    if (!tableNumber.trim()) return;
    try {
      const res = await fetch(
        `/api/comandas/public?tableNumber=${encodeURIComponent(tableNumber.trim())}&restaurantId=${restaurant.id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setOpenSession(data.session ?? null);
      }
    } catch {
      /* ignore */
    }
  }

  if (success) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Pedido enviado!
        </h1>
        <p className="mt-4 text-stone-600">
          Pedido <span className="font-semibold">#{success.orderId}</span> registrado
          na{" "}
          <span className="font-semibold">Mesa {tableNumber}</span> · Comanda{" "}
          <span className="font-semibold">#{success.comandaId}</span>.
        </p>
        <Button
          className="mt-8"
          onClick={() => {
            setSuccess(null);
            void refreshSession();
          }}
        >
          Continuar pedindo
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

      {!tableConfirmed ? (
        <section className="mx-auto max-w-md px-4 py-8">
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Número da mesa
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Informe o número da sua mesa para continuar.
          </p>
          <div className="mt-6 space-y-2">
            <Label htmlFor="mesa">Mesa</Label>
            <Input
              id="mesa"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Ex.: 5"
              required
            />
          </div>
          <Button
            className="mt-4 w-full"
            disabled={!tableNumber.trim()}
            onClick={() => void confirmTable()}
          >
            Continuar
          </Button>
        </section>
      ) : (
        <>
          <div className="sticky top-14 z-20 border-b border-stone-200 bg-[#FAFAF8] px-4 py-2 text-center text-sm text-stone-600">
            Mesa <span className="font-semibold text-stone-900">{tableNumber}</span>
            {openSession && (
              <>
                {" "}
                · Comanda{" "}
                <span className="font-semibold text-stone-900">#{openSession.id}</span>
                {" "}
                · Conta em aberto{" "}
                <span className="font-semibold text-primary">
                  {formatBRL(openSession.partialTotal)}
                </span>
              </>
            )}
            <button
              type="button"
              className="ml-2 text-primary underline"
              onClick={() => {
                if (
                  openSession &&
                  openSession.roundCount > 0 &&
                  !window.confirm(
                    "Trocar de mesa? Seus próximos pedidos irão para outra mesa.",
                  )
                ) {
                  return;
                }
                setTableConfirmed(false);
                setOpenSession(null);
              }}
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

          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-[#FAFAF8] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <Button
                type="button"
                className="w-full gap-2"
                disabled={items.length === 0}
                onClick={() => setSheetOpen(true)}
              >
                <ShoppingBag className="h-4 w-4" />
                Ver pedido ({itemCount()}) · {formatBRL(totalCents())}
              </Button>
              <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Enviar para a cozinha</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <PresencialOrderForm
                    restaurantId={restaurant.id}
                    tableNumber={tableNumber}
                    onSuccess={(orderId, comandaId) => {
                      setSheetOpen(false);
                      setSuccess({ orderId, comandaId });
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
