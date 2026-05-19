import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  itemCategories,
  menuItems,
  restaurants,
} from "@/drizzle/schema";

export async function getPublicMenu(restaurantId?: number) {
  try {
  const [restaurant] = restaurantId
    ? await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1)
    : await db.select().from(restaurants).limit(1);

  if (!restaurant) {
    return { restaurant: null, categories: [] };
  }

  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurant.id))
    .orderBy(asc(categories.sortOrder));

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurant.id));

  const links = await db.select().from(itemCategories);

  const categoriesWithItems = cats.map((cat) => ({
    ...cat,
    items: items
      .filter(
        (item) =>
          item.active &&
          links.some((l) => l.itemId === item.id && l.categoryId === cat.id),
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        active: item.active,
      })),
  }));

  return {
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      logoUrl: restaurant.logoUrl,
    },
    categories: categoriesWithItems.filter((c) => c.items.length > 0),
  };
  } catch {
    return { restaurant: null, categories: [] };
  }
}

export async function getDashboardMenu(restaurantId: number) {
  try {
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurantId))
    .orderBy(asc(categories.sortOrder));

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurantId));

  const links = await db.select().from(itemCategories);

  return {
    categories: cats,
    items: items.map((item) => ({
      ...item,
      categoryIds: links
        .filter((l) => l.itemId === item.id)
        .map((l) => l.categoryId),
    })),
  };
  } catch {
    return { categories: [], items: [] };
  }
}
