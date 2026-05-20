"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { formatBRL } from "@/lib/cart-store";
import type { KanbanOrder } from "@/lib/orders";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_ITEMS = 3;

interface KanbanCardProps {
  order: KanbanOrder;
  isDragging?: boolean;
}

interface KanbanCardContentProps {
  order: KanbanOrder;
  isDragging?: boolean;
  overlay?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
}

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function OrderItemsList({ items }: { items: KanbanOrder["items"] }) {
  if (items.length === 0) {
    return (
      <p className="text-xs italic text-stone-400">Sem itens registrados</p>
    );
  }

  const showOverflow = items.length > 4;
  const visible = showOverflow ? items.slice(0, MAX_VISIBLE_ITEMS) : items;
  const overflowCount = items.length - MAX_VISIBLE_ITEMS;

  return (
    <ul className="space-y-0.5 text-xs text-stone-600">
      {visible.map((item) => (
        <li key={item.id}>
          {item.quantity}× {item.name}
        </li>
      ))}
      {showOverflow && (
        <li className="font-medium text-stone-500">+{overflowCount} itens</li>
      )}
    </ul>
  );
}

export function KanbanCardContent({
  order,
  isDragging,
  overlay,
  dragHandleProps,
  setNodeRef,
  style,
}: KanbanCardContentProps) {
  const title =
    order.type === "presencial"
      ? `Mesa ${order.tableNumber ?? order.comandaNumber ?? "—"}`
      : (order.customerName ?? "Cliente");

  const subtitle =
    order.type === "presencial" && order.comandaId
      ? `Comanda #${order.comandaId}`
      : null;

  const paymentLabel = order.paymentMethod
    ? (PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod)
    : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-stone-200 bg-card p-3 shadow-sm transition-shadow",
        overlay && "shadow-lg ring-1 ring-stone-200",
        isDragging && "opacity-40 shadow-md ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-stone-400 hover:text-stone-600 active:cursor-grabbing"
          aria-label="Arrastar pedido"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight text-stone-900">{title}</p>
              <p className="text-xs text-stone-500">
                {subtitle ? `${subtitle} · ` : ""}#{order.id}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
              {formatBRL(order.total)}
            </span>
          </div>

          <p className="mt-1 inline-flex items-center gap-1 text-xs text-stone-500">
            <Clock className="h-3 w-3" />
            {formatTime(order.createdAt)}
          </p>

          {(order.customerPhone || order.customerEmail) && (
            <div className="mt-2 space-y-0.5 text-xs">
              {order.customerPhone && (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-1 text-stone-600 hover:text-primary"
                >
                  <Phone className="h-3 w-3 shrink-0" />
                  {order.customerPhone}
                </a>
              )}
              {order.customerEmail && (
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="flex items-center gap-1 text-stone-600 hover:text-primary"
                >
                  <Mail className="h-3 w-3 shrink-0" />
                  {order.customerEmail}
                </a>
              )}
            </div>
          )}

          <div className="mt-2 border-t border-stone-100 pt-2">
            <OrderItemsList items={order.items} />
          </div>

          {order.notes?.trim() && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-950">
              <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span>
                <span className="font-semibold">Obs:</span> {order.notes.trim()}
              </span>
            </p>
          )}

          {order.type === "delivery" && order.customerAddress && (
            <p className="mt-2 flex items-start gap-1 line-clamp-2 text-xs text-stone-500">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              {order.customerAddress}
            </p>
          )}

          {paymentLabel && (
            <p className="mt-1 text-xs text-stone-500">{paymentLabel}</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function KanbanCard({ order, isDragging }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: order.id,
    data: { order, status: order.status },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <KanbanCardContent
      order={order}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      style={style}
      dragHandleProps={{ ...listeners, ...attributes }}
    />
  );
}

export function KanbanCardOverlay({ order }: { order: KanbanOrder }) {
  return <KanbanCardContent order={order} overlay />;
}
