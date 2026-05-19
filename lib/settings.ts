import { eq } from "drizzle-orm";
import { deliverySettings, restaurants } from "@/drizzle/schema";
import { db } from "@/lib/db";
import type {
  DeliverySettingsInput,
  RestaurantSettingsInput,
} from "@/lib/validators";

export async function getRestaurantSettings(restaurantId: number) {
  const [row] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);
  return row ?? null;
}

export async function updateRestaurantSettings(
  restaurantId: number,
  input: RestaurantSettingsInput,
) {
  const [updated] = await db
    .update(restaurants)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.logoUrl !== undefined && {
        logoUrl: input.logoUrl || null,
      }),
      ...(input.primaryColor !== undefined && { primaryColor: input.primaryColor }),
      ...(input.secondaryColor !== undefined && {
        secondaryColor: input.secondaryColor,
      }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.maxDeliveryKm !== undefined && {
        maxDeliveryKm: input.maxDeliveryKm,
      }),
      ...(input.operatingHours !== undefined && {
        operatingHours: input.operatingHours,
      }),
    })
    .where(eq(restaurants.id, restaurantId))
    .returning();
  return updated ?? null;
}

export async function getDeliverySettings(restaurantId: number) {
  const [row] = await db
    .select()
    .from(deliverySettings)
    .where(eq(deliverySettings.restaurantId, restaurantId))
    .limit(1);

  if (row) return row;

  const [created] = await db
    .insert(deliverySettings)
    .values({ restaurantId })
    .returning();
  return created;
}

export async function updateDeliverySettings(
  restaurantId: number,
  input: DeliverySettingsInput,
) {
  await getDeliverySettings(restaurantId);
  const [updated] = await db
    .update(deliverySettings)
    .set({
      ...(input.baseFee !== undefined && { baseFee: input.baseFee }),
      ...(input.feePerKm !== undefined && { feePerKm: input.feePerKm }),
      ...(input.estimatedMinutes !== undefined && {
        estimatedMinutes: input.estimatedMinutes,
      }),
      ...(input.active !== undefined && { active: input.active }),
    })
    .where(eq(deliverySettings.restaurantId, restaurantId))
    .returning();
  return updated ?? null;
}
