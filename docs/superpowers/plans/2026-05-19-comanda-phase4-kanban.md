# Comanda Phase 4 — Kanban Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel kanban em `/app/pedidos` com drag-and-drop e `PATCH /api/orders/[id]/status`.

**Architecture:** RSC carrega pedidos iniciais; Client Component com @dnd-kit para colunas; APIs autenticadas via `requireAuth`; polling 15s para novos pedidos.

**Tech Stack:** Vinext, Drizzle, Zod, @dnd-kit/core + sortable, Tailwind v4.

---

### Task 1: Dependências e validators

**Files:**
- Modify: `package.json`
- Modify: `lib/validators.ts`

- [x] Instalar `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [x] `updateOrderStatusSchema` com enum dos 4 status

### Task 2: lib/orders — listagem e update

**Files:**
- Modify: `lib/orders.ts`

- [x] `KanbanOrder` type + `listKanbanOrders(restaurantId)`
- [x] `updateOrderStatus(orderId, restaurantId, status)`

### Task 3: API Routes

**Files:**
- Create: `app/api/orders/dashboard/route.ts`
- Create: `app/api/orders/[id]/status/route.ts`

- [x] GET dashboard (auth)
- [x] PATCH status (auth)

### Task 4: Componentes Kanban

**Files:**
- Create: `components/dashboard/KanbanCard.tsx`
- Create: `components/dashboard/KanbanBoard.tsx`
- Modify: `app/app/pedidos/page.tsx`

- [x] DnD entre colunas
- [x] Optimistic update + rollback em erro

### Task 5: Verificação

- [x] `npm run lint` + `npm run build`
