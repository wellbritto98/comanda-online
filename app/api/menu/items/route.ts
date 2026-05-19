import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { itemCategories, menuItems } from "@/drizzle/schema";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { menuItemSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, session.restaurantId));

  const itemIds = items.map((i) => i.id);
  const links =
    itemIds.length > 0
      ? await db
          .select()
          .from(itemCategories)
          .where(inArray(itemCategories.itemId, itemIds))
      : [];

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      categoryIds: links
        .filter((l) => l.itemId === item.id)
        .map((l) => l.categoryId),
    })),
  );
}

export async function POST(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const { categoryIds, imageUrl, ...itemData } = parsed.data;

    const [created] = await db
      .insert(menuItems)
      .values({
        restaurantId: session.restaurantId,
        name: itemData.name,
        description: itemData.description ?? null,
        price: itemData.price,
        imageUrl: imageUrl || null,
        active: itemData.active ?? true,
      })
      .returning();

    await db.insert(itemCategories).values(
      categoryIds.map((categoryId) => ({
        itemId: created.id,
        categoryId,
      })),
    );

    return NextResponse.json({ ...created, categoryIds }, { status: 201 });
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
    const { id, categoryIds, ...data } = body as {
      id: number;
      categoryIds?: number[];
    } & Record<string, unknown>;

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);

    if (!existing || existing.restaurantId !== session.restaurantId) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    const updateData: Partial<typeof existing> = {};
    if (typeof data.name === "string") updateData.name = data.name;
    if (typeof data.description === "string") updateData.description = data.description;
    if (typeof data.price === "number") updateData.price = data.price;
    if (typeof data.imageUrl === "string") updateData.imageUrl = data.imageUrl || null;
    if (typeof data.active === "boolean") updateData.active = data.active;

    const [updated] = await db
      .update(menuItems)
      .set(updateData)
      .where(eq(menuItems.id, id))
      .returning();

    if (categoryIds && categoryIds.length > 0) {
      await db.delete(itemCategories).where(eq(itemCategories.itemId, id));
      await db.insert(itemCategories).values(
        categoryIds.map((categoryId) => ({ itemId: id, categoryId })),
      );
    }

    return NextResponse.json({
      ...updated,
      categoryIds: categoryIds ?? [],
    });
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
    .delete(menuItems)
    .where(eq(menuItems.id, id))
    .returning();

  if (!deleted || deleted.restaurantId !== session.restaurantId) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
