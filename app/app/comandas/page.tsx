import { ComandasManager } from "@/components/dashboard/ComandasManager";

export const dynamic = "force-dynamic";

export default function ComandasPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-6 shrink-0">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Comandas</h1>
        <p className="mt-2 text-stone-500">
          Contas abertas por mesa. Feche a conta e registre o pagamento no caixa.
        </p>
      </header>
      <ComandasManager />
    </div>
  );
}
