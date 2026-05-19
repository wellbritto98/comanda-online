import { Plus } from "lucide-react";

interface MenuItemCardProps {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  index?: number;
  onAdd?: () => void;
}

export function MenuItemCard({
  name,
  description,
  price,
  imageUrl,
  index = 0,
  onAdd,
}: MenuItemCardProps) {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price / 100);

  return (
    <article
      className="animate-fade-up flex gap-4 rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-transform hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-24 w-24 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 text-xs">
          Sem foto
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold leading-tight text-stone-800">
            {name}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-stone-500">
              {description}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-stone-900">{formattedPrice}</span>
          <button
            type="button"
            onClick={onAdd}
            className="rounded-full bg-primary p-2 text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            aria-label={`Adicionar ${name}`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
