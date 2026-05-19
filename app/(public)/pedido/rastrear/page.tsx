import { Suspense } from "react";
import { TrackOrderForm } from "@/components/public/TrackOrderForm";

export default function RastrearPedidoPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-primary">
        Rastreamento
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900">
        Encontrar meu pedido
      </h1>
      <p className="mt-2 text-stone-500">
        Informe o número do pedido e o CPF usado no checkout. Não é necessário criar
        conta.
      </p>
      <div className="mt-8 rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <Suspense fallback={<p className="text-stone-500">Carregando…</p>}>
          <TrackOrderForm />
        </Suspense>
      </div>
    </main>
  );
}
