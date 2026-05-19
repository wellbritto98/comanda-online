import { MenuManager } from "@/components/dashboard/MenuManager";
import { getDashboardMenu } from "@/lib/menu";
import { getSession } from "@/lib/auth";

export default async function CardapioPage() {
  const session = await getSession();
  if (!session) return null;

  const { categories, items } = await getDashboardMenu(session.restaurantId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Gerenciar cardápio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Adicione categorias e itens que aparecerão no cardápio público.
        </p>
      </div>
      <MenuManager categories={categories} items={items} />
    </div>
  );
}
