const RESTAURANT_TZ = "America/Sao_Paulo";

/** YYYY-MM-DD no fuso do restaurante (America/Sao_Paulo). */
export function todayDateString(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: RESTAURANT_TZ });
}

export function parseDateFilter(input?: string | null) {
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return todayDateString();
}

/** Intervalo [start, end) para pedidos/comandas do dia calendário. */
export function getDayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00-03:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end, date: dateStr };
}

export function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
