"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webhookEventValues } from "@/lib/validators";

type Subscription = {
  id: number;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
};

type LogRow = {
  id: number;
  event: string;
  statusCode: number | null;
  sentAt: string;
  error: string | null;
  url: string;
};

export function WebhookManager() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["order.created", "order.status_changed"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [subsRes, logsRes] = await Promise.all([
      fetch("/api/webhooks"),
      fetch("/api/webhooks/logs?limit=20"),
    ]);
    if (subsRes.ok) setSubs(await subsRes.json());
    if (logsRes.ok) {
      const data = await logsRes.json();
      setLogs(data.logs ?? []);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const [subsRes, logsRes] = await Promise.all([
        fetch("/api/webhooks"),
        fetch("/api/webhooks/logs?limit=20"),
      ]);
      if (cancelled) return;
      if (subsRes.ok) setSubs(await subsRes.json());
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs ?? []);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleEvent(event: string) {
    setEvents((current) =>
      current.includes(event)
        ? current.filter((e) => e !== event)
        : [...current, event],
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar");
        return;
      }
      setUrl("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(sub: Subscription) {
    await fetch(`/api/webhooks/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !sub.active }),
    });
    await load();
  }

  async function removeSub(id: number) {
    if (!confirm("Remover esta inscrição?")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleCreate} className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl font-bold text-stone-900">Nova inscrição</h2>
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">URL de destino</Label>
          <Input
            id="webhookUrl"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://..."
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Eventos</legend>
          <div className="flex flex-wrap gap-2">
            {webhookEventValues.map((ev) => (
              <label
                key={ev}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={events.includes(ev)}
                  onChange={() => toggleEvent(ev)}
                />
                {ev}
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading || events.length === 0}>
          {loading ? "Salvando…" : "Adicionar webhook"}
        </Button>
      </form>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-stone-900">Inscrições</h2>
        {subs.length === 0 ? (
          <p className="text-stone-500">Nenhum webhook configurado.</p>
        ) : (
          <ul className="space-y-3">
            {subs.map((sub) => (
              <li
                key={sub.id}
                className="rounded-xl border border-stone-200 bg-card p-4 text-sm"
              >
                <p className="font-medium break-all text-stone-900">{sub.url}</p>
                <p className="mt-1 text-stone-500">{sub.events.join(", ")}</p>
                <p className="mt-2 font-mono text-xs text-stone-400">
                  Secret: {sub.secret.slice(0, 12)}…
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(sub)}
                  >
                    {sub.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSub(sub.id)}
                  >
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-stone-900">Logs recentes</h2>
        {logs.length === 0 ? (
          <p className="text-stone-500">Sem envios registrados.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2"
              >
                <span className="font-medium">{log.event}</span> → {log.url} ·{" "}
                {log.statusCode ?? "—"}{" "}
                {log.error && (
                  <span className="text-red-600">({log.error})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
