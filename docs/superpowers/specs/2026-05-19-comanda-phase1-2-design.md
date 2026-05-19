# Comanda Online - Phase 1 & 2 Design Spec

## Overview
A public-facing digital menu and administrative dashboard for a restaurant delivery and table-service system. This specification covers Phase 1 (Database & Auth foundation) and Phase 2 (Public Menu and Basic Dashboard), utilizing a "Warm & Organic" aesthetic.

## Aesthetic Direction: Warm & Organic
The visual design avoids generic dashboards and adopts an inviting, appetizing aesthetic suitable for a restaurant.

*   **Colors**: 
    *   Background: Cream/off-white (`bg-stone-50` or `bg-[#FAFAF8]`).
    *   Primary/Accent: Terracotta/burnt orange (`bg-orange-600` or `bg-[#D95F3B]`).
    *   Secondary/Success: Sage green (`bg-emerald-600` or `bg-[#5F8575]`).
    *   Text: Deep espresso or charcoal (`text-stone-900`) instead of pure black.
*   **Typography**:
    *   Headers (Categories, Restaurant Name): A distinctive serif font (e.g., *Playfair Display*, *Lora*, or similar Google Font).
    *   Body (Descriptions, Prices, UI elements): A clean, soft sans-serif (e.g., *Nunito*, *Outfit*, or *Quicksand*).
*   **Shapes & Styling**:
    *   Generous border radii on cards and images (`rounded-2xl` or `rounded-3xl`).
    *   Soft, diffuse drop shadows for a tactile feel.
    *   `shadcn/ui` components will be customized heavily via Tailwind config and CSS variables to match these shapes and colors.
*   **Motion**: 
    *   Smooth scrolling for navigation.
    *   Subtle hover transitions on interactive elements (buttons, cards).

## Architecture & Tech Stack
*   **Framework**: Next.js App Router via Vinext (`C:\Users\Wellington\Documents\projetos\comanda\comanda-online`).
*   **Database**: PostgreSQL.
*   **ORM**: Drizzle ORM (`src/drizzle/schema.ts`).
*   **Authentication**: Custom JWT stateless auth via HttpOnly cookies (`jsonwebtoken` + `bcryptjs`), implemented in Node.js compatible Edge Functions/API Routes.
*   **Styling**: Tailwind CSS v4 + customized `shadcn/ui`.
*   **State Management**: `zustand` (for shopping cart in future phases, initial setup in Phase 2).
*   **Validation**: `zod` for schemas shared between frontend forms and backend API.

## Core Workflows & Components

### 1. Database Foundation (Phase 1)
Implement the Drizzle schema encompassing:
*   `restaurants`: Core tenant info (name, colors, logo).
*   `users`: Auth credentials (email, hashed password).
*   `categories`: Menu categories (name, sort order).
*   `menu_items`: Food items (name, description, price, image, active status).
*   `item_categories`: M:N mapping.

### 2. Authentication & Protected Routes (Phase 1)
*   **POST `/api/auth/login`**: Validates credentials against `users` table, sets JWT cookie.
*   **Middleware/Layout Guard**: `(dashboard)/layout.tsx` verifies the JWT cookie. Unauthenticated users are redirected to `/login`.

### 3. Public Menu Experience: "Continuous Flow" (Phase 2)
*   **Route**: `/menu/delivery` (or root `/` acting as public menu).
*   **Layout**: Single-page continuous scroll.
*   **Components**:
    *   `Header`: Restaurant logo and name (Serif).
    *   `CategoryNav`: Sticky, horizontal scrolling navigation bar. Automatically highlights the active category based on scroll position (Scroll-spy).
    *   `MenuSection`: Wraps a category title (Serif) and a grid of items.
    *   `MenuItemCard`: Rounded card featuring an image, title, description (truncated if necessary), price, and a terracotta `+` button.
*   **Data Fetching**: React Server Components (RSC) fetch categories and items from the database on initial render.

### 4. Administrative Dashboard (Phase 2)
*   **Route**: `/app/cardapio`
*   **Layout**: Simple sidebar navigation.
*   **Components**:
    *   `MenuManager`: Interface to list, add, edit, and delete categories and items.
    *   Uses `shadcn/ui` components (Data Table, Dialog, Form, Input, Button) heavily styled to be cleaner but functional.
    *   Forms validated with `react-hook-form` + `@hookform/resolvers/zod`.

## Error Handling
*   **API**: Standardized error responses (400 for validation, 401 for auth, 500 for server).
*   **UI**: Form validation errors displayed inline. Global error boundaries to prevent app crashes on DB connection failure.