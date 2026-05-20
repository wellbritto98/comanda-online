"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KanbanCard, KanbanCardOverlay } from "@/components/dashboard/KanbanCard";
import { DayFilter } from "@/components/dashboard/DayFilter";
import type { KanbanOrder } from "@/lib/orders";
import { todayDateString } from "@/lib/day-filter";
import {
  ORDER_STATUS_STEPS,
  type OrderStatusKey,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { useRestaurantOrdersStream } from "@/hooks/useRestaurantOrdersStream";

const POLL_SAFETY_MS = 60_000;

function groupByStatus(orders: KanbanOrder[]) {
  const groups: Record<OrderStatusKey, KanbanOrder[]> = {
    em_analise: [],
    em_producao: [],
    pronto: [],
    entregue: [],
  };

  for (const order of orders) {
    const key = order.status as OrderStatusKey;
    if (groups[key]) {
      groups[key].push(order);
    }
  }

  return groups;
}

function KanbanColumn({
  status,
  label,
  orders,
  activeId,
}: {
  status: OrderStatusKey;
  label: string;
  orders: KanbanOrder[];
  activeId: number | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className="flex min-w-[260px] flex-1 flex-col">
      <header className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold text-stone-800">{label}</h2>
        <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600">
          {orders.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-2xl border border-dashed p-2 transition-colors",
          isOver
            ? "border-primary bg-orange-50"
            : "border-stone-200 bg-stone-100",
        )}
      >
        {orders.length === 0 ? (
          <p className="py-8 text-center text-xs text-stone-400">Nenhum pedido</p>
        ) : (
          orders.map((order) => (
            <KanbanCard
              key={order.id}
              order={order}
              isDragging={activeId === order.id}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface KanbanBoardProps {
  initialOrders: KanbanOrder[];
  initialDate?: string;
}

export function KanbanBoard({ initialOrders, initialDate }: KanbanBoardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedDate, setSelectedDate] = useState(initialDate ?? todayDateString());
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const grouped = useMemo(() => groupByStatus(orders), [orders]);
  const activeOrder = activeId
    ? orders.find((o) => o.id === activeId) ?? null
    : null;

  const refresh = useCallback(async (date = selectedDate) => {
    try {
      const res = await fetch(
        `/api/orders/dashboard?date=${encodeURIComponent(date)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { orders: KanbanOrder[] };
      setOrders(
        data.orders.map((o) => ({
          ...o,
          createdAt: new Date(o.createdAt),
        })),
      );
    } catch {
      /* polling silencioso */
    }
  }, [selectedDate]);

  function handleDateChange(date: string) {
    setSelectedDate(date);
    void refresh(date);
  }

  useRestaurantOrdersStream({
    onStatusChanged: ({ orderId, status }) => {
      setOrders((current) =>
        current.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    },
    onOrderCreated: () => {
      void refresh();
    },
  });

  useEffect(() => {
    const id = window.setInterval(refresh, POLL_SAFETY_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  async function moveOrder(orderId: number, newStatus: OrderStatusKey) {
    const previous = orders;
    setOrders((current) =>
      current.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o,
      ),
    );
    setIsUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setOrders(previous);
        const body = await res.json().catch(() => ({}));
        setError(
          typeof body.error === "string"
            ? body.error
            : "Não foi possível atualizar o pedido",
        );
        return;
      }
    } catch {
      setOrders(previous);
      setError("Erro de conexão ao atualizar o pedido");
    } finally {
      setIsUpdating(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = Number(active.id);
    const newStatus = String(over.id) as OrderStatusKey;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;
    if (!ORDER_STATUS_STEPS.some((s) => s.key === newStatus)) return;

    void moveOrder(orderId, newStatus);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DayFilter value={selectedDate} onChange={handleDateChange} />
        {isUpdating && (
          <span className="text-xs text-primary">Salvando…</span>
        )}
      </div>
      <p className="text-sm text-stone-500">
        Arraste os cards entre as colunas para atualizar o status.
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ORDER_STATUS_STEPS.map((step) => (
            <KanbanColumn
              key={step.key}
              status={step.key}
              label={step.label}
              orders={grouped[step.key]}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? <KanbanCardOverlay order={activeOrder} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
