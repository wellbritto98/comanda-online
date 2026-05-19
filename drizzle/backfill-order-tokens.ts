import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/drizzle/schema";

async function backfill() {
  const rows = await db
    .select({ id: orders.id, accessToken: orders.accessToken })
    .from(orders);

  let count = 0;
  for (const row of rows) {
    if (!row.accessToken) {
      await db
        .update(orders)
        .set({ accessToken: randomUUID() })
        .where(eq(orders.id, row.id));
      count++;
    }
  }

  console.log(`Backfill complete: ${count} order(s) updated.`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
