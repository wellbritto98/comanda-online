import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function migrate() {
  console.log("Adding access_token column if missing…");

  await db.execute(sql`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS access_token VARCHAR(64);
  `);

  await db.execute(sql`
    UPDATE orders
    SET access_token = gen_random_uuid()::text
    WHERE access_token IS NULL;
  `);

  await db.execute(sql`
    ALTER TABLE orders
    ALTER COLUMN access_token SET NOT NULL;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE orders ADD CONSTRAINT orders_access_token_unique UNIQUE (access_token);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
