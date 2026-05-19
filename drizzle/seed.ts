import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  categories,
  deliverySettings,
  itemCategories,
  menuItems,
  restaurants,
  users,
} from "@/drizzle/schema";

async function seed() {
  console.log("Seeding database...");

  const existing = await db.select().from(restaurants).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping.");
    process.exit(0);
  }

  const [restaurant] = await db
    .insert(restaurants)
    .values({
      name: "Cantina Orgânica",
      description: "Sabores artesanais para você.",
      logoUrl: null,
      primaryColor: "#D95F3B",
      secondaryColor: "#5F8575",
    })
    .returning();

  const passwordHash = await bcrypt.hash("admin123", 10);

  await db.insert(deliverySettings).values({
    restaurantId: restaurant.id,
    baseFee: 0,
    feePerKm: 0,
    estimatedMinutes: 45,
    active: true,
  });

  await db.insert(users).values({
    restaurantId: restaurant.id,
    email: "admin@cantina.com",
    passwordHash,
    role: "admin",
  });

  const [catEntradas] = await db
    .insert(categories)
    .values({
      restaurantId: restaurant.id,
      name: "Entradas",
      sortOrder: 0,
    })
    .returning();

  const [catPrincipais] = await db
    .insert(categories)
    .values({
      restaurantId: restaurant.id,
      name: "Pratos Principais",
      sortOrder: 1,
    })
    .returning();

  const [catSobremesas] = await db
    .insert(categories)
    .values({
      restaurantId: restaurant.id,
      name: "Sobremesas",
      sortOrder: 2,
    })
    .returning();

  const itemsData = [
    {
      name: "Bruschetta de Tomate",
      description:
        "Pão italiano tostado, tomates confitados, manjericão e alho.",
      price: 2800,
      imageUrl:
        "https://images.unsplash.com/photo-1572695157366-848086327da3?w=400&q=80",
      categoryId: catEntradas.id,
    },
    {
      name: "Carpaccio de Abóbora",
      description: "Lâminas finas de abóbora, queijo de cabra e mel.",
      price: 3200,
      categoryId: catEntradas.id,
    },
    {
      name: "Risoto de Cogumelos",
      description:
        "Arroz arbório, mix de cogumelos frescos, parmesão e azeite trufado.",
      price: 6500,
      imageUrl:
        "https://images.unsplash.com/photo-1633337474564-1d9488a081cc?w=400&q=80",
      categoryId: catPrincipais.id,
    },
    {
      name: "Filé ao Molho Madeira",
      description: "Filé mignon grelhado com molho madeira e batatas rústicas.",
      price: 7800,
      imageUrl:
        "https://images.unsplash.com/photo-1546833999-b9c260a0d07d?w=400&q=80",
      categoryId: catPrincipais.id,
    },
    {
      name: "Salmão Grelhado",
      description: "Salmão com crosta de ervas, legumes salteados e limão siciliano.",
      price: 7200,
      categoryId: catPrincipais.id,
    },
    {
      name: "Panna Cotta de Frutas Vermelhas",
      description: "Creme italiano com calda de frutas vermelhas frescas.",
      price: 2400,
      imageUrl:
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80",
      categoryId: catSobremesas.id,
    },
    {
      name: "Brownie com Sorvete",
      description: "Brownie quentinho com sorvete de baunilha artesanal.",
      price: 2200,
      categoryId: catSobremesas.id,
    },
  ];

  for (const { categoryId, ...item } of itemsData) {
    const [created] = await db
      .insert(menuItems)
      .values({
        restaurantId: restaurant.id,
        ...item,
        active: true,
      })
      .returning();

    await db.insert(itemCategories).values({
      itemId: created.id,
      categoryId,
    });
  }

  console.log("Seed completed successfully.");
  console.log("Login: admin@cantina.com / admin123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  console.error(
    "Ensure PostgreSQL is running and DATABASE_URL is set correctly.",
  );
  process.exit(1);
});
