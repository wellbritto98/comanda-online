import { WebhookManager } from "@/components/dashboard/WebhookManager";

export default function WebhooksPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Webhooks</h1>
        <p className="mt-2 text-stone-500">
          Notifique sistemas externos quando pedidos forem criados ou atualizados.
        </p>
      </header>
      <WebhookManager />
    </div>
  );
}
