import { MyOrdersList } from "@/components/public/MyOrdersList";

export default function MeusPedidosPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-primary">
        Seus pedidos
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900">
        Meus pedidos
      </h1>
      <p className="mt-2 text-stone-500">
        Pedidos feitos neste navegador. Para recuperar em outro aparelho, use número
        do pedido + CPF.
      </p>
      <div className="mt-8">
        <MyOrdersList />
      </div>
    </main>
  );
}
