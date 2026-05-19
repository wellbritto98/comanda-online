"use client";

const STORAGE_KEY = "comanda-tracked-orders";

export interface TrackedOrder {
  orderId: number;
  accessToken: string;
  createdAt: string;
  status: string;
  totalCents: number;
  customerName: string | null;
}

const listeners = new Set<() => void>();

let cachedSnapshot: TrackedOrder[] = [];
let cachedRaw = "";

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStorage(): TrackedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrackedOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(orders: TrackedOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  emitChange();
}

function buildSnapshot(): TrackedOrder[] {
  return readStorage().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function getSnapshot(): TrackedOrder[] {
  const raw = typeof window === "undefined" ? "" : localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = buildSnapshot();
  return cachedSnapshot;
}

export function subscribeTrackedOrders(listener: () => void) {
  return subscribe(listener);
}

export function getTrackedOrdersSnapshot() {
  return getSnapshot();
}

export function listTrackedOrders(): TrackedOrder[] {
  return getSnapshot();
}

export function getTrackedOrderToken(orderId: number): string | null {
  const found = getSnapshot().find((o) => o.orderId === orderId);
  return found?.accessToken ?? null;
}

export function addTrackedOrder(entry: TrackedOrder) {
  const orders = readStorage().filter((o) => o.orderId !== entry.orderId);
  orders.unshift(entry);
  writeStorage(orders);
}

export function updateTrackedOrderStatus(orderId: number, status: string) {
  const orders = readStorage();
  const idx = orders.findIndex((o) => o.orderId === orderId);
  if (idx === -1) return;
  if (orders[idx].status === status) return;
  orders[idx] = { ...orders[idx], status };
  writeStorage(orders);
}

export function removeTrackedOrder(orderId: number) {
  writeStorage(readStorage().filter((o) => o.orderId !== orderId));
}
