"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
}

interface CategoryNavProps {
  categories: Category[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const [activeId, setActiveId] = useState<number | null>(
    categories[0]?.id ?? null,
  );

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id.replace("cat-", "");
          setActiveId(Number(id));
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  return (
    <nav
      className="sticky top-14 z-30 -mx-4 mb-8 border-b border-stone-200/80 bg-[#FAFAF8]/95 py-3 shadow-sm backdrop-blur-md"
      aria-label="Categorias do cardápio"
    >
      <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 pb-0.5 scrollbar-none">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`#cat-${cat.id}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
              activeId === cat.id
                ? "bg-primary text-white shadow-md"
                : "bg-white text-stone-600 hover:bg-stone-100",
            )}
          >
            {cat.name}
          </a>
        ))}
      </div>
    </nav>
  );
}
