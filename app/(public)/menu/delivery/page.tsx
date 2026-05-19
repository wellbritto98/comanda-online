export const dynamic = "force-dynamic";

import { DeliveryMenuView } from "@/components/public/DeliveryMenuView";
import { getPublicMenu } from "@/lib/menu";

export default async function DeliveryMenuPage() {
  const { restaurant, categories } = await getPublicMenu();

  if (!restaurant) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-bold text-stone-800">
          Cardápio indisponível
        </h1>
        <p className="mt-2 text-stone-500">
          Configure o banco de dados e execute o seed para ver o cardápio.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl overflow-visible px-4 py-8 pb-32">
      <DeliveryMenuView restaurant={restaurant} categories={categories} />
    </main>
  );
}
