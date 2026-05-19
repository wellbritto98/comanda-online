# Comanda — Fase 4: Kanban de Pedidos (Design)

## Contexto

Fases 1–2 (base + cardápio) e Fase 3 parcial (delivery, carrinho, POST orders, rastreamento) estão entregues. O painel `/app/pedidos` ainda é placeholder.

## Objetivo

Permitir que o restaurante visualize pedidos em colunas por status e mova cards via drag-and-drop, persistindo com `PATCH /api/orders/[id]/status`.

## Escopo MVP

| Incluído | Fora do escopo (fases futuras) |
|----------|--------------------------------|
| 4 colunas: em_analise → em_producao → pronto → entregue | SSE em tempo real |
| Drag-and-drop (@dnd-kit) | Webhooks ao mudar status |
| GET pedidos autenticado | Menu presencial |
| PATCH status autenticado | Filtros avançados / relatórios |
| Polling 15s no painel | Adicionais no pedido |

## API

- `GET /api/orders/dashboard` — lista pedidos do `restaurantId` da sessão (ativos + entregues nas últimas 24h).
- `PATCH /api/orders/[id]/status` — body `{ status }`, validação Zod, escopo por restaurante.

## UI

- `KanbanBoard` + `KanbanCard` em `components/dashboard/`.
- Página `/app/pedidos` com dados iniciais via RSC + cliente para DnD e refresh.
- Estética alinhada ao painel existente (stone/primary, cards arredondados).

## Decisões

1. **Sem validação de transição** — qualquer status pode ir para qualquer coluna (flexibilidade operacional).
2. **Polling 15s** em vez de SSE nesta fase (menor complexidade; cliente já usa polling 10s).
3. **Webhooks** ficam para Fase 5.
