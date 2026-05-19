# Comanda Phase 3 — Pedidos (Delivery MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Permitir que o cliente monte um carrinho no cardápio delivery, finalize com dados de entrega e pagamento, persista via `POST /api/orders` e acompanhe status em `/pedido/[id]` com polling.

**Architecture:** RSC em `/menu/delivery` para dados do cardápio; Client Components para carrinho (Zustand) e checkout (`CartDrawer` + `OrderForm`). APIs Node.js com Drizzle em transação para `orders` + `order_items`. Adicionais (`addons`) **fora do MVP** — ver decisão abaixo.

**Tech Stack:** Next.js (Vinext), Drizzle, Postgres, Zustand, Zod, shadcn Sheet, Tailwind v4.

---

## Decisão: Adicionais (Task 0)

| Opção | Escolha |
|-------|---------|
| MVP com adicionais | Não |
| MVP item + quantidade apenas | **Sim** |

**Motivo:** reduz schema/UI na primeira entrega; `order_item_addons` entra em fase posterior alinhada ao globalspec Fase 2 completa.

---

### Task 1: Schema `orders` e `order_items`

**Files:**
- Modify: `drizzle/schema.ts`
- Run: `npm run db:push`

- [x] Campos `orders`: `restaurantId`, `type` (`delivery` \| `presencial`), `status` (`em_analise` \| `em_producao` \| `pronto` \| `entregue`), dados delivery, `total`, `notes`, timestamps
- [x] Campos `order_items`: `orderId`, `menuItemId`, `quantity`, `unitPrice`, `subtotal`

### Task 2: Validators e `lib/orders.ts`

**Files:**
- Modify: `lib/validators.ts`
- Create: `lib/orders.ts`

- [x] `createDeliveryOrderSchema` com itens do carrinho
- [x] `createDeliveryOrder()` — valida itens ativos, calcula total, insert transacional

### Task 3: API Routes

**Files:**
- Create: `app/api/orders/route.ts` (POST)
- Create: `app/api/orders/[id]/route.ts` (GET)

### Task 4: Carrinho e checkout (UI pública)

**Files:**
- Modify: `lib/cart-store.ts`
- Create: `components/public/CartDrawer.tsx`, `OrderForm.tsx`, `DeliveryMenuView.tsx`
- Modify: `components/public/MenuSection.tsx`, `app/menu/delivery/page.tsx`

- [x] Botão `+` adiciona ao Zustand
- [x] Sheet com lista, totais, CTA finalizar
- [x] Formulário → POST → redirect `/pedido/[id]`

### Task 5: Página de status do pedido

**Files:**
- Create: `app/pedido/[id]/page.tsx`

- [x] Polling 10s em `GET /api/orders/[id]`
- [x] Labels de status em pt-BR

### Task 6: Dashboard placeholder

**Files:**
- Create: `app/app/pedidos/page.tsx`
- Modify: `components/dashboard/DashboardSidebar.tsx`

### Task 7: Verificação

- [x] `npm run lint` + `npm run build` + `npm run build:vinext`
- [x] `npm run db:push` após schema
- [x] Smoke: adicionar item → checkout → ver status
