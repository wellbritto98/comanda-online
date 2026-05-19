"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OrderForm } from "@/components/public/OrderForm";
import { formatBRL, useCartStore } from "@/lib/cart-store";

interface CartDrawerProps {
  restaurantId: number;
}

export function CartDrawer({ restaurantId }: CartDrawerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalCents = useCartStore((s) => s.totalCents);
  const itemCount = useCartStore((s) => s.itemCount);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setStep("cart");
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/80 bg-[#FAFAF8]/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div className="text-sm text-stone-600">
            {itemCount() > 0 ? (
              <>
                <span className="font-bold text-stone-900">{itemCount()}</span>{" "}
                {itemCount() === 1 ? "item" : "itens"} ·{" "}
                <span className="font-bold text-primary">{formatBRL(totalCents())}</span>
              </>
            ) : (
              "Seu carrinho está vazio"
            )}
          </div>
          <Button
            type="button"
            disabled={items.length === 0}
            onClick={() => setOpen(true)}
            className="gap-2 rounded-full px-6"
          >
            <ShoppingBag className="h-4 w-4" />
            Ver carrinho
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="font-serif text-xl">
              {step === "cart" ? "Seu pedido" : "Finalizar pedido"}
            </SheetTitle>
            <SheetDescription>
              {step === "cart"
                ? "Revise os itens antes de continuar"
                : "Preencha seus dados para entrega"}
            </SheetDescription>
          </SheetHeader>

          {step === "cart" ? (
            <div className="flex flex-col gap-4 px-1 pb-6">
              {items.length === 0 ? (
                <p className="text-center text-stone-500 py-8">Nenhum item no carrinho</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <li
                      key={item.menuItemId}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-stone-900 truncate">{item.name}</p>
                        <p className="text-sm text-stone-500">
                          {formatBRL(item.price)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            updateQuantity(item.menuItemId, item.quantity - 1)
                          }
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            updateQuantity(item.menuItemId, item.quantity + 1)
                          }
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.menuItemId)}
                        className="text-xs text-stone-400 hover:text-red-600 ml-1"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {items.length > 0 && (
                <>
                  <div className="flex justify-between border-t border-stone-200 pt-4 text-base font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatBRL(totalCents())}</span>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => setStep("checkout")}
                  >
                    Finalizar pedido
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="px-1 pb-6">
              <Button
                type="button"
                variant="ghost"
                className="mb-4 -ml-2 text-stone-500"
                onClick={() => setStep("cart")}
              >
                ← Voltar ao carrinho
              </Button>
              <OrderForm
                restaurantId={restaurantId}
                onSuccess={() => {
                  setOpen(false);
                  setStep("cart");
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
