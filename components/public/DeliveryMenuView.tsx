"use client";

import { CategoryNav } from "@/components/public/CategoryNav";
import { CartDrawer } from "@/components/public/CartDrawer";
import { Header } from "@/components/public/Header";
import { MenuSection } from "@/components/public/MenuSection";
import { useCartStore } from "@/lib/cart-store";

interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
}

interface Category {
  id: number;
  name: string;
  items: MenuItem[];
}

interface DeliveryMenuViewProps {
  restaurant: {
    id: number;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
  };
  categories: Category[];
}

export function DeliveryMenuView({ restaurant, categories }: DeliveryMenuViewProps) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <>
      <Header
        name={restaurant.name}
        description={restaurant.description}
        logoUrl={restaurant.logoUrl}
      />
      {categories.length > 0 && (
        <CategoryNav
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}
      {categories.map((category) => (
        <MenuSection
          key={category.id}
          id={category.id}
          name={category.name}
          items={category.items}
          onAddItem={(item) =>
            addItem({
              menuItemId: item.id,
              name: item.name,
              price: item.price,
            })
          }
        />
      ))}
      {categories.length === 0 && (
        <p className="text-center text-stone-500">Nenhum item no cardápio ainda.</p>
      )}
      <CartDrawer restaurantId={restaurant.id} />
    </>
  );
}
