import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, #D95F3B, transparent)",
        }}
        aria-hidden
      />
      <p className="relative text-sm font-medium uppercase tracking-widest text-primary">
        Comanda Online
      </p>
      <h1 className="relative mt-4 max-w-lg font-serif text-5xl font-black leading-tight text-stone-900 md:text-6xl">
        Sabores que chegam até você
      </h1>
      <p className="relative mt-4 max-w-md text-lg text-stone-500">
        Peça delivery ou explore nosso cardápio digital com ingredientes frescos e
        receitas artesanais.
      </p>
      <div className="relative mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Link
          href="/menu/delivery"
          className={cn(
            buttonVariants({ size: "lg" }),
            "rounded-full bg-primary px-8 text-primary-foreground hover:bg-[var(--color-primary-hover)]",
          )}
        >
          Ver cardápio delivery
        </Link>
        <Link
          href="/menu/presencial"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8")}
        >
          Pedir na mesa
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8")}
        >
          Área do restaurante
        </Link>
      </div>
    </main>
  );
}
