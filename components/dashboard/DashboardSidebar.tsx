"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  LogOut,
  Receipt,
  Settings,
  UtensilsCrossed,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  restaurantName: string;
}

const NAV = [
  { href: "/app/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/app/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/app/comandas", label: "Comandas", icon: Receipt },
  { href: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/app/ajustes", label: "Ajustes", icon: Settings },
  { href: "/app/webhooks", label: "Webhooks", icon: Webhook },
] as const;

export function DashboardSidebar({ restaurantName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
      <div className="mb-8 px-2">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          Painel
        </p>
        <h2 className="mt-1 font-serif text-xl font-bold text-stone-900">
          {restaurantName}
        </h2>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "text-stone-600 hover:bg-stone-100",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="mt-auto justify-start gap-3 rounded-xl text-stone-600"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </aside>
  );
}
