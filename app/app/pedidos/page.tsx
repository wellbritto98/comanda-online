import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { getSession } from "@/lib/auth";
import { todayDateString } from "@/lib/day-filter";
import { listKanbanOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const session = await getSession();
  const restaurantId = session?.restaurantId ?? 0;

  const today = todayDateString();

  let initialOrders: Awaited<ReturnType<typeof listKanbanOrders>> = [];
  try {
    initialOrders = await listKanbanOrders(restaurantId, today);
  } catch {
    initialOrders = [];
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-6 shrink-0">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Pedidos</h1>
        <p className="mt-2 text-stone-500">
          Gerencie o fluxo da cozinha e entregas em tempo quase real.
        </p>
      </header>
      <KanbanBoard initialOrders={initialOrders} initialDate={today} />
    </div>
  );
}
