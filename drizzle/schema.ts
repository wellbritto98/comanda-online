import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const orderTypeEnum = pgEnum("order_type", ["delivery", "presencial"]);
export const orderStatusEnum = pgEnum("order_status", [
  "em_analise",
  "em_producao",
  "pronto",
  "entregue",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "dinheiro",
  "cartao_entrega",
  "pix",
]);

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }),
  secondaryColor: varchar("secondary_color", { length: 7 }),
  address: text("address"),
  maxDeliveryKm: integer("max_delivery_km"),
  operatingHours: text("operating_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliverySettings = pgTable("delivery_settings", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .references(() => restaurants.id)
    .notNull()
    .unique(),
  baseFee: integer("base_fee").default(0).notNull(),
  feePerKm: integer("fee_per_km").default(0).notNull(),
  estimatedMinutes: integer("estimated_minutes").default(45).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .references(() => restaurants.id)
    .notNull(),
  url: text("url").notNull(),
  events: text("events").array().notNull(),
  secret: varchar("secret", { length: 64 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id")
    .references(() => webhookSubscriptions.id, { onDelete: "cascade" })
    .notNull(),
  event: varchar("event", { length: 64 }).notNull(),
  payload: text("payload").notNull(),
  statusCode: integer("status_code"),
  responseBody: text("response_body"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  error: text("error"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .references(() => restaurants.id)
    .notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .references(() => restaurants.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .references(() => restaurants.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const itemCategories = pgTable(
  "item_categories",
  {
    itemId: integer("item_id")
      .references(() => menuItems.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: integer("category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.categoryId] })],
);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .references(() => restaurants.id)
    .notNull(),
  type: orderTypeEnum("type").notNull(),
  status: orderStatusEnum("status").default("em_analise").notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  customerCpf: varchar("customer_cpf", { length: 14 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerAddress: text("customer_address"),
  paymentMethod: paymentMethodEnum("payment_method"),
  deliveryFee: integer("delivery_fee").default(0).notNull(),
  estimatedMinutes: integer("estimated_minutes"),
  comandaNumber: varchar("comanda_number", { length: 50 }),
  total: integer("total").notNull(),
  notes: text("notes"),
  accessToken: varchar("access_token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  menuItemId: integer("menu_item_id")
    .references(() => menuItems.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  subtotal: integer("subtotal").notNull(),
});
