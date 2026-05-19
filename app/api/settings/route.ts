import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getDeliverySettings,
  getRestaurantSettings,
  updateDeliverySettings,
  updateRestaurantSettings,
} from "@/lib/settings";
import {
  deliverySettingsSchema,
  restaurantSettingsSchema,
} from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const restaurant = await getRestaurantSettings(session.restaurantId);
  const delivery = await getDeliverySettings(session.restaurantId);

  return NextResponse.json({ restaurant, delivery });
}

export async function PATCH(request: NextRequest) {
  const session = requireAuth(request);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { restaurant: restaurantInput, delivery: deliveryInput } = body as {
    restaurant?: unknown;
    delivery?: unknown;
  };

  if (restaurantInput) {
    const parsed = restaurantSettingsSchema.safeParse(restaurantInput);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }
    await updateRestaurantSettings(session.restaurantId, parsed.data);
  }

  if (deliveryInput) {
    const parsed = deliverySettingsSchema.safeParse(deliveryInput);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }
    await updateDeliverySettings(session.restaurantId, parsed.data);
  }

  const restaurant = await getRestaurantSettings(session.restaurantId);
  const delivery = await getDeliverySettings(session.restaurantId);

  return NextResponse.json({ restaurant, delivery });
}
