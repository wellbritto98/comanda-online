export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { restaurants } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, session.restaurantId))
    .limit(1);

  return (
    <div className="relative isolate z-[1] flex min-h-screen bg-stone-50">
      <DashboardSidebar restaurantName={restaurant?.name ?? "Restaurante"} />
      <main className="flex-1 overflow-auto p-6 md:p-10">{children}</main>
    </div>
  );
}
