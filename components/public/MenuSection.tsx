import { MenuItemCard } from "./MenuItemCard";

interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
}

interface MenuSectionProps {
  id: number;
  name: string;
  items: MenuItem[];
  onAddItem?: (item: MenuItem) => void;
}

export function MenuSection({ id, name, items, onAddItem }: MenuSectionProps) {
  return (
    <section id={`cat-${id}`} className="menu-section-anchor mb-12">
      <h2 className="mb-6 font-serif text-2xl font-bold text-stone-800">{name}</h2>
      <div className="grid grid-cols-1 gap-4">
        {items.map((item, index) => (
          <MenuItemCard
            key={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            imageUrl={item.imageUrl}
            index={index}
            onAdd={onAddItem ? () => onAddItem(item) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
