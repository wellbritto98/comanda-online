# Comanda — Rastreamento de pedidos sem conta

> Implementado: localStorage + CPF + accessToken na API.

**Goal:** Cliente identifica e acompanha pedidos sem criar conta.

**Fluxos:**
- Após checkout → `/pedido/[id]?token=...` + salvo em localStorage
- `/meus-pedidos` — lista neste aparelho
- `/pedido/rastrear` — número do pedido + CPF
- `GET /api/orders/[id]?token=` — exige token (401 sem token)

Ver implementação em `lib/order-tracking-store.ts`, `app/api/orders/track/route.ts`.
