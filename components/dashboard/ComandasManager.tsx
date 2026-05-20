"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatBRL } from "@/lib/cart-store";
import { todayDateString } from "@/lib/day-filter";
import {
  ORDER_STATUS_LABELS,
  PRESENCIAL_PAYMENT_METHODS,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { DayFilter } from "@/components/dashboard/DayFilter";

type OpenComanda = {
  id: number;
  tableNumber: string;
  openedAt: string;
  roundCount: number;
  partialTotal: number;
  pendingOrdersCount: number;
  isStale: boolean;
};

type ComandaRound = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number; subtotal: number }[];
};

type ComandaDetail = OpenComanda & {
  status: "open" | "closed";
  rounds: ComandaRound[];
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ComandasManager() {
  const [comandas, setComandas] = useState<OpenComanda[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ComandaDetail | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [confirmPending, setConfirmPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async (id: number) => {
    const res = await fetch(`/api/comandas/${id}`);
    if (res.ok) {
      setDetail(await res.json());
    }
  }, []);

  function handleDateChange(date: string) {
    setSelectedDate(date);
    setSelectedId(null);
    setDetail(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(
        `/api/comandas/open?date=${encodeURIComponent(selectedDate)}`,
      );
      if (!cancelled && res.ok) {
        const data = await res.json();
        setComandas(data.comandas ?? []);
      }
    }

    void load();

    if (typeof EventSource === "undefined") {
      return () => {
        cancelled = true;
      };
    }

    const es = new EventSource("/api/sse/restaurant");
    const refresh = () => {
      void load();
      if (selectedId) void loadDetail(selectedId);
    };
    es.addEventListener("comanda.opened", refresh);
    es.addEventListener("comanda.closed", () => {
      refresh();
      setSelectedId(null);
      setDetail(null);
    });
    es.addEventListener("order.created", refresh);

    return () => {
      cancelled = true;
      es.close();
    };
  }, [loadDetail, selectedDate, selectedId]);

  async function openDetail(id: number) {
    setSelectedId(id);
    setError(null);
    await loadDetail(id);
  }

  function handleCloseClick() {
    if (!detail) return;
    if (detail.pendingOrdersCount > 0) {
      setConfirmPending(true);
    } else {
      setCloseOpen(true);
    }
  }

  async function handleCloseConfirm(force = false) {
    if (!detail) return;
    if (detail.pendingOrdersCount > 0 && !force) {
      setConfirmPending(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comandas/${detail.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao fechar conta");
        return;
      }
      setCloseOpen(false);
      setConfirmPending(false);
      setSelectedId(null);
      setDetail(null);
      const listRes = await fetch(
        `/api/comandas/open?date=${encodeURIComponent(selectedDate)}`,
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        setComandas(listData.comandas ?? []);
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <DayFilter value={selectedDate} onChange={handleDateChange} />

      {comandas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-12 text-center text-stone-500">
          Nenhuma comanda aberta neste dia.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comandas.map((comanda) => (
            <button
              key={comanda.id}
              type="button"
              onClick={() => openDetail(comanda.id)}
              className={cn(
                "rounded-2xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md",
                comanda.isStale
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-stone-200",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-lg font-bold text-stone-900">
                    Mesa {comanda.tableNumber}
                  </p>
                  <p className="text-xs text-stone-500">Comanda #{comanda.id}</p>
                </div>
                <span className="rounded-lg bg-primary/10 px-2 py-1 text-sm font-bold text-primary">
                  {formatBRL(comanda.partialTotal)}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-stone-500">
                <Receipt className="h-3 w-3" />
                {comanda.roundCount}{" "}
                {comanda.roundCount === 1 ? "rodada" : "rodadas"}
                {comanda.pendingOrdersCount > 0 && (
                  <span className="ml-1 text-amber-700">
                    · {comanda.pendingOrdersCount} pendente
                    {comanda.pendingOrdersCount > 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-stone-400">
                <Clock className="h-3 w-3" />
                Aberta às {formatTime(comanda.openedAt)}
                {comanda.isStale && " · +24h"}
              </p>
            </button>
          ))}
        </div>
      )}

      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setDetail(null);
            setError(null);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl">
                  Mesa {detail.tableNumber}
                </SheetTitle>
                <p className="text-sm text-stone-500">
                  Comanda #{detail.id} · {detail.roundCount}{" "}
                  {detail.roundCount === 1 ? "rodada" : "rodadas"}
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {detail.rounds.map((round) => (
                  <article
                    key={round.id}
                    className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-stone-900">Pedido #{round.id}</p>
                        <p className="text-xs text-stone-500">
                          {formatTime(round.createdAt)} ·{" "}
                          {ORDER_STATUS_LABELS[round.status] ?? round.status}
                        </p>
                      </div>
                      <span className="text-sm font-bold">{formatBRL(round.total)}</span>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-xs text-stone-600">
                      {round.items.map((item, i) => (
                        <li key={`${round.id}-${i}`}>
                          {item.quantity}× {item.name}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}

                <div className="flex justify-between border-t border-stone-200 pt-4 text-lg font-bold">
                  <span>Total da conta</span>
                  <span className="text-primary">{formatBRL(detail.partialTotal)}</span>
                </div>

                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <Button className="w-full" onClick={handleCloseClick}>
                  Fechar conta
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={confirmPending} onOpenChange={setConfirmPending}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedidos ainda em andamento</DialogTitle>
            <DialogDescription>
              Ainda há {detail?.pendingOrdersCount ?? 0} pedido(s) que não foram marcados
              como entregues. Deseja fechar a conta mesmo assim?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmPending(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setConfirmPending(false);
                setCloseOpen(true);
              }}
            >
              Continuar fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar conta — Mesa {detail?.tableNumber}</DialogTitle>
            <DialogDescription>
              Total: {formatBRL(detail?.partialTotal ?? 0)} · Comanda #{detail?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm font-medium text-stone-700">Forma de pagamento</p>
            <div className="flex flex-col gap-2">
              {PRESENCIAL_PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                    paymentMethod === method.value
                      ? "border-primary bg-primary/5"
                      : "border-stone-200",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCloseOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={loading} onClick={() => void handleCloseConfirm(true)}>
              {loading ? "Fechando…" : "Confirmar fechamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
