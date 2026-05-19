# Comanda Phase 1 & 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement database schema, aesthetic layout (Warm & Organic), public menu interface, and basic dashboard structure.

**Architecture:** Next.js App Router, Drizzle ORM (PostgreSQL), Custom JWT Auth, Tailwind CSS v4, Server Components for data fetching.

**Tech Stack:** Next.js (Vinext), Drizzle, Postgres, Tailwind v4, jsonwebtoken, bcryptjs, zod.

---

### Task 1: Project Setup & Dependencies

**Files:**
- Modify: `package.json`

- [x] **Step 1: Install core backend & auth dependencies**

```bash
npm install drizzle-orm postgres jsonwebtoken bcryptjs zod zustand lucide-react
npm install -D drizzle-kit @types/jsonwebtoken @types/bcryptjs @types/pg
```

- [x] **Step 2: Commit installation**

```bash
git add package.json package-lock.json
git commit -m "chore: install database, auth, and state dependencies"
```

### Task 2: Database Schema & Connection (Drizzle)

**Files:**
- Create: `src/drizzle/schema.ts`
- Create: `src/lib/db.ts`

- [x] **Step 1: Write Drizzle Schema**

Create `src/drizzle/schema.ts`:
```typescript
import { pgTable, text, serial, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  categoryId: integer("category_id").references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // stored in cents
  imageUrl: text("image_url"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- [x] **Step 2: Write Database Connection**

Create `src/lib/db.ts`:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/comanda";
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

- [x] **Step 3: Commit schema**

```bash
git add src/drizzle/schema.ts src/lib/db.ts
git commit -m "feat: setup database schema and connection"
```

### Task 3: Warm & Organic Aesthetic Configuration

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (assuming standard setup)

- [x] **Step 1: Configure Fonts in Layout**

Modify `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Playfair_Display, Nunito } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
});

const nunito = Nunito({ 
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Comanda Online",
  description: "Delivery and Menu Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${nunito.variable}`}>
      <body className="font-sans antialiased bg-[#FAFAF8] text-stone-900">
        {children}
      </body>
    </html>
  );
}
```

- [x] **Step 2: Add Tailwind Base & Variables**

Modify `src/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-primary: #D95F3B; /* Terracotta */
  --color-primary-hover: #C55331;
  --color-success: #5F8575; /* Sage Green */
  --color-background: #FAFAF8; /* Cream */
  --font-sans: var(--font-nunito);
  --font-serif: var(--font-playfair);
}
```

- [x] **Step 3: Commit aesthetic configuration**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "style: apply warm and organic typography and colors"
```

### Task 4: Public Menu Page

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/public/MenuItemCard.tsx`

- [x] **Step 1: Create the Menu Item Component**

Create `src/components/public/MenuItemCard.tsx`:
```tsx
import React from 'react';
import { Plus } from 'lucide-react';

interface MenuItemProps {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export function MenuItemCard({ name, description, price, imageUrl }: MenuItemProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price / 100);

  return (
    <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex gap-4 transition-transform hover:-translate-y-1">
      {imageUrl && (
        <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-stone-100">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif font-bold text-lg text-stone-800 leading-tight">{name}</h3>
          <p className="text-stone-500 text-sm mt-1 line-clamp-2">{description}</p>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="font-bold text-stone-900">{formattedPrice}</span>
          <button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white p-2 rounded-full transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Build the Public Menu Feed**

Modify `src/app/page.tsx`:
```tsx
import { MenuItemCard } from "@/components/public/MenuItemCard";
// In a real execution, we would fetch from db.ts here.
// For layout testing, we use mock data.

const MOCK_ITEMS = [
  { id: 1, name: "Risoto de Cogumelos", description: "Arroz arbório, mix de cogumelos frescos, parmesão e azeite trufado.", price: 6500, imageUrl: "https://images.unsplash.com/photo-1633337474564-1d9488a081cc?w=400&q=80" },
  { id: 2, name: "Bruschetta de Tomate", description: "Pão italiano tostado, tomates confitados, manjericão e alho.", price: 2800 },
];

export default function PublicMenu() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <header className="text-center mb-10">
        <h1 className="font-serif text-4xl font-black text-stone-900">Cantina Orgânica</h1>
        <p className="text-stone-500 mt-2">Sabores artesanais para você.</p>
      </header>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-bold text-stone-800 mb-6">Pratos Principais</h2>
        <div className="grid grid-cols-1 gap-4">
          {MOCK_ITEMS.map((item) => (
            <MenuItemCard 
              key={item.id}
              name={item.name}
              description={item.description}
              price={item.price}
              imageUrl={item.imageUrl}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [x] **Step 3: Commit public menu**

```bash
git add src/app/page.tsx src/components/public/MenuItemCard.tsx
git commit -m "feat: implement public menu interface with warm aesthetic"
```