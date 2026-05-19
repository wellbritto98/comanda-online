import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { menuItems, orderItems, orders } from "@/drizzle/schema";
import { db } from "@/lib/db";

export async function getOrdersSummary(
  restaurantId: number,
  from: Date,
  to: Date,
) {
  const rows = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to),
      ),
    )
    .groupBy(orders.status);

  const totalOrders = rows.reduce((s, r) => s + Number(r.count), 0);
  const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totalOrders,
    totalRevenue,
    byStatus: rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
      revenue: Number(r.revenue),
    })),
  };
}

export async function getTopItems(
  restaurantId: number,
  from: Date,
  to: Date,
  limit = 10,
) {
  const rows = await db
    .select({
      menuItemId: orderItems.menuItemId,
      name: menuItems.name,
      quantity: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<number>`sum(${orderItems.subtotal})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(
      and(
        eq(orders.restaurantId, restaurantId),
        gte(orders.createdAt, from),
        lte(orders.createdAt, to),
      ),
    )
    .groupBy(orderItems.menuItemId, menuItems.name)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(limit);

  return rows.map((r) => ({
    menuItemId: r.menuItemId,
    name: r.name,
    quantity: Number(r.quantity),
    revenue: Number(r.revenue),
  }));
}
