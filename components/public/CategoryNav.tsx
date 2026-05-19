"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Altura do PublicNavbar (h-14) */
const TOP_OFFSET_PX = 56;

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
  const [isPinned, setIsPinned] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPinned(!entry.isIntersecting),
      { root: null, rootMargin: `-${TOP_OFFSET_PX}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => setNavHeight(nav.offsetHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

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

  const pills = (
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
  );

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <nav
        ref={navRef}
        className={cn(
          "z-30 border-b border-stone-200/80 bg-[#FAFAF8]/95 py-3 backdrop-blur-md transition-shadow",
          isPinned
            ? "fixed left-0 right-0 shadow-sm"
            : "relative -mx-4 mb-8",
        )}
        style={isPinned ? { top: TOP_OFFSET_PX } : undefined}
        aria-label="Categorias do cardápio"
      >
        {pills}
      </nav>
      {isPinned && navHeight > 0 && (
        <div className="mb-8" style={{ height: navHeight }} aria-hidden />
      )}
    </>
  );
}
