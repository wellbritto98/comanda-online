import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { categories } from "@/drizzle/schema";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, session.restaurantId))
    .orderBy(asc(categories.sortOrder));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(categories)
      .values({
        restaurantId: session.restaurantId,
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder ?? 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body as { id: number; name?: string; sortOrder?: number };

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const parsed = categorySchema.partial().safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(categories)
      .set(parsed.data)
      .where(eq(categories.id, id))
      .returning();

    if (!updated || updated.restaurantId !== session.restaurantId) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();

  if (!deleted || deleted.restaurantId !== session.restaurantId) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
