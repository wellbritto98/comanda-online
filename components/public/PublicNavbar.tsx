"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Search, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/menu/delivery", label: "Delivery", icon: UtensilsCrossed },
  { href: "/menu/presencial", label: "Mesa", icon: UtensilsCrossed },
  { href: "/meus-pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/pedido/rastrear", label: "Rastrear", icon: Search },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/menu/delivery") {
    return pathname === "/menu/delivery";
  }
  if (href === "/menu/presencial") {
    return pathname === "/menu/presencial";
  }
  if (href === "/meus-pedidos") {
    return (
      pathname === "/meus-pedidos" ||
      (pathname.startsWith("/pedido/") && pathname !== "/pedido/rastrear")
    );
  }
  if (href === "/pedido/rastrear") {
    return pathname === "/pedido/rastrear";
  }
  return pathname === href;
}

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#FAFAF8]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-serif text-lg font-bold tracking-tight text-stone-900 hover:text-primary transition-colors shrink-0"
        >
          Comanda
        </Link>

        <nav
          className="flex items-center gap-1 sm:gap-2"
          aria-label="Navegação do cliente"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
