"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/cart-store";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

type Summary = {
  totalOrders: number;
  totalRevenue: number;
  byStatus: { status: string; count: number; revenue: number }[];
};

type TopItem = {
  menuItemId: number;
  name: string;
  quantity: number;
  revenue: number;
};

function periodDates(days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function ReportsView() {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const { from, to } = periodDates(days);
      const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const [sumRes, topRes] = await Promise.all([
        fetch(`/api/reports/orders?${qs}`),
        fetch(`/api/reports/top-items?${qs}&limit=10`),
      ]);
      if (cancelled) return;
      if (sumRes.ok) setSummary(await sumRes.json());
      if (topRes.ok) {
        const data = await topRes.json();
        setTopItems(data.items ?? []);
      }
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {[7, 30].map((d) => (
          <Button
            key={d}
            type="button"
            variant={days === d ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(d)}
          >
            Últimos {d} dias
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-stone-500">Carregando…</p>
      ) : (
        <>
          {summary && (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-card p-4">
                <p className="text-sm text-stone-500">Pedidos</p>
                <p className="font-serif text-3xl font-bold text-stone-900">
                  {summary.totalOrders}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-card p-4">
                <p className="text-sm text-stone-500">Receita</p>
                <p className="font-serif text-3xl font-bold text-primary">
                  {formatBRL(summary.totalRevenue)}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-card p-4 sm:col-span-2 lg:col-span-1">
                <p className="mb-2 text-sm font-medium text-stone-700">Por status</p>
                <ul className="space-y-1 text-sm text-stone-600">
                  {summary.byStatus.map((row) => (
                    <li key={row.status} className="flex justify-between">
                      <span>
                        {ORDER_STATUS_LABELS[row.status] ?? row.status}
                      </span>
                      <span>{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 font-serif text-xl font-bold text-stone-900">
              Itens mais vendidos
            </h2>
            {topItems.length === 0 ? (
              <p className="text-stone-500">Sem vendas no período.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-left text-stone-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Item</th>
                      <th className="px-4 py-3 font-medium">Qtd</th>
                      <th className="px-4 py-3 font-medium">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item) => (
                      <tr key={item.menuItemId} className="border-t border-stone-100">
                        <td className="px-4 py-3 text-stone-900">{item.name}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{formatBRL(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
