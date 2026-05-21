DO $$ BEGIN
  CREATE TYPE "public"."comanda_status" AS ENUM('open', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE IF NOT EXISTS 'cartao';--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "address" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "max_delivery_km" integer;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "operating_hours" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"base_fee" integer DEFAULT 0 NOT NULL,
	"fee_per_km" integer DEFAULT 0 NOT NULL,
	"estimated_minutes" integer DEFAULT 45 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "delivery_settings_restaurant_id_unique" UNIQUE("restaurant_id")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"url" text NOT NULL,
	"events" text[] NOT NULL,
	"secret" varchar(64) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"event" varchar(64) NOT NULL,
	"payload" text NOT NULL,
	"status_code" integer,
	"response_body" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"error" text
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comandas" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"table_number" varchar(50) NOT NULL,
	"status" "comanda_status" DEFAULT 'open' NOT NULL,
	"payment_method" "payment_method",
	"total" integer DEFAULT 0 NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"closed_by" integer
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "comandas_restaurant_table_open_idx" ON "comandas" ("restaurant_id", "table_number") WHERE "status" = 'open';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_email" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "comanda_id" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "delivery_settings" ADD CONSTRAINT "delivery_settings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_subscription_id_webhook_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."webhook_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "comandas" ADD CONSTRAINT "comandas_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "comandas" ADD CONSTRAINT "comandas_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_comanda_id_comandas_id_fk" FOREIGN KEY ("comanda_id") REFERENCES "public"."comandas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
