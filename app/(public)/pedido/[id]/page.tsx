import { PedidoPageClient } from "@/components/public/PedidoPageClient";

export const dynamic = "force-dynamic";

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const orderId = Number.parseInt(id, 10);

  if (Number.isNaN(orderId)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-stone-500">Pedido inválido.</p>
      </main>
    );
  }

  return <PedidoPageClient orderId={orderId} tokenFromUrl={token ?? null} />;
}
