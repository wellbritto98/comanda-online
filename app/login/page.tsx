import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/app/cardapio");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Painel do restaurante
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900">
            Comanda Online
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre para gerenciar seu cardápio
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">
            Voltar ao cardápio
          </Link>
        </p>
      </div>
    </div>
  );
}
