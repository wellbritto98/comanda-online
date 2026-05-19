import { ReportsView } from "@/components/dashboard/ReportsView";

export default function RelatoriosPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Relatórios</h1>
        <p className="mt-2 text-stone-500">
          Pedidos e itens mais vendidos por período.
        </p>
      </header>
      <ReportsView />
    </div>
  );
}
