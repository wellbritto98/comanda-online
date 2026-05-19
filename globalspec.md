# Arquitetura — Sistema de Pedidos & Delivery para Restaurante

> Stack principal: **Vinext (Next.js via Vite)** · **TypeScript** · **PostgreSQL** · **Node.js (self-hosted)**

---

## 1. Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Público)                        │
│  Menu presencial (QR Code/Comanda)  │  Menu Delivery (Web)      │
└──────────────────┬──────────────────┴──────────────┬────────────┘
                   │ HTTP                             │ HTTP
┌──────────────────▼──────────────────────────────────▼────────────┐
│                    Nginx (reverse proxy)                          │
│              SSL termination · static assets                      │
└──────────────────────────────────────┬───────────────────────────┘
                                       │ proxy_pass :3000
┌──────────────────────────────────────▼───────────────────────────┐
│               Vinext App  — Node.js (PM2)  :3000                  │
│   /app  → Painel do Restaurante (autenticado)                     │
│   /      → Interface Pública (anônima)                            │
│   /api/* → API Routes (Node.js runtime)                           │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                       ┌───────────────▼───────────────┐
                       │   PostgreSQL  (local / VPS)    │
                       └───────────────────────────────┘
```

---

## 2. Estrutura de Pastas

```
root/
├── src/
│   ├── app/                        # Rotas Vinext (file-based routing)
│   │   ├── (public)/               # Layout público (sem auth)
│   │   │   ├── page.tsx            # Landing / seleção de modo
│   │   │   ├── menu/
│   │   │   │   ├── delivery/
│   │   │   │   │   └── page.tsx    # Cardápio + formulário de pedido delivery
│   │   │   │   └── presencial/
│   │   │   │       └── page.tsx    # Cardápio + input de número de comanda
│   │   │   └── pedido/
│   │   │       └── [id]/page.tsx   # Confirmação / status do pedido (polling)
│   │   ├── (dashboard)/            # Layout privado (auth obrigatório)
│   │   │   ├── layout.tsx          # Guard de autenticação
│   │   │   ├── pedidos/
│   │   │   │   └── page.tsx        # Kanban de pedidos
│   │   │   ├── cardapio/
│   │   │   │   └── page.tsx        # Gestor de cardápio
│   │   │   ├── delivery/
│   │   │   │   └── page.tsx        # Config de frete e prazo
│   │   │   ├── ajustes/
│   │   │   │   └── page.tsx        # Perfil do restaurante
│   │   │   └── relatorios/
│   │   │       └── page.tsx        # Relatórios
│   │   └── api/                    # API Routes (Edge Functions)
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   └── logout/route.ts
│   │       ├── orders/
│   │       │   ├── route.ts        # POST criar pedido
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET status
│   │       │       └── status/route.ts  # PATCH mover no kanban
│   │       ├── menu/
│   │       │   ├── route.ts        # GET cardápio público
│   │       │   ├── items/route.ts  # CRUD itens (auth)
│   │       │   └── categories/route.ts  # CRUD categorias (auth)
│   │       ├── settings/route.ts   # GET/PATCH configurações (auth)
│   │       └── webhooks/
│   │           └── route.ts        # Dispatcher de webhooks
│   ├── components/
│   │   ├── public/
│   │   │   ├── MenuGrid.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── OrderForm.tsx       # Nome, CPF, endereço, pagamento
│   │   │   └── CommandaInput.tsx
│   │   └── dashboard/
│   │       ├── KanbanBoard.tsx
│   │       ├── KanbanCard.tsx
│   │       ├── MenuManager.tsx
│   │       ├── CategoryForm.tsx
│   │       ├── ItemForm.tsx
│   │       └── SettingsForm.tsx
│   ├── lib/
│   │   ├── db.ts                   # Conexão PostgreSQL (drizzle-orm)
│   │   ├── auth.ts                 # JWT / sessão (jose ou lucia-auth)
│   │   ├── webhook.ts              # Dispatcher de webhooks
│   │   └── validators.ts           # Zod schemas
│   └── types/
│       └── index.ts
├── drizzle/
│   └── schema.ts                   # Schema do banco
├── vite.config.ts
├── ecosystem.config.js             # PM2 config
└── .env
```

---

## 3. Modelo de Dados

### 3.1 Tabelas principais

```sql
-- Restaurante (tenant único nesta versão)
restaurants
  id, name, description, logo_url,
  primary_color, secondary_color,
  address, lat, long,
  max_delivery_km, operating_hours,
  created_at

-- Auth
users
  id, restaurant_id, email,
  password_hash, role,
  created_at

-- Cardápio
categories
  id, restaurant_id, name, sort_order

menu_items
  id, restaurant_id, name, description,
  price, image_url, active,
  created_at

item_categories            -- N:N item ↔ categoria
  item_id, category_id

addons                     -- Adicionais de um item
  id, item_id, name, price, active

-- Pedidos
orders
  id, restaurant_id,
  type  ENUM('delivery','presencial'),
  status ENUM('em_analise','em_producao','pronto','entregue'),
  -- Delivery
  customer_name, customer_cpf,
  customer_address, payment_method,
  delivery_fee, estimated_minutes,
  -- Presencial
  comanda_number,
  total, notes,
  created_at, updated_at

order_items
  id, order_id, menu_item_id,
  quantity, unit_price, subtotal

order_item_addons
  id, order_item_id, addon_id,
  quantity, unit_price

-- Configurações de Delivery
delivery_settings
  id, restaurant_id,
  base_fee, fee_per_km,
  estimated_minutes, active

-- Webhooks registrados
webhook_subscriptions
  id, restaurant_id, url,
  events  TEXT[],   -- ex: ['order.created','order.status_changed']
  secret, active, created_at

webhook_logs
  id, subscription_id, event, payload,
  status_code, response_body,
  sent_at, error
```

---

## 4. Fluxos Principais

### 4.1 Pedido Delivery (cliente anônimo)

```
1. Cliente acessa /menu/delivery
2. Navega pelo cardápio (busca por categoria, adiciona ao carrinho)
3. Clica em "Finalizar pedido"
4. Preenche formulário:
     - Nome completo
     - CPF
     - Endereço completo (com CEP autocomplete via ViaCEP)
     - Forma de pagamento (dinheiro / cartão na entrega / Pix)
5. POST /api/orders  →  persiste pedido com status "em_analise"
6. Webhook disparado: evento order.created  →  restaurante notificado
7. Cliente redirecionado para /pedido/[id]  →  polling de status a cada 10s
```

### 4.2 Pedido Presencial (comanda)

```
1. Cliente acessa /menu/presencial  (geralmente via QR Code na mesa)
2. Navega pelo cardápio e monta o pedido
3. Informa número da comanda
4. POST /api/orders  →  type: "presencial", comanda_number: X
5. Webhook disparado: evento order.created
6. Confirmação na tela
```

### 4.3 Kanban (restaurante)

```
Colunas: Em análise → Em produção → Pronto p/ entrega → Entregue

Ao mover card:
  PATCH /api/orders/[id]/status  { status: "em_producao" }
  → Atualiza banco
  → Dispara webhook: order.status_changed
  → (opcional) Notifica cliente via polling / SSE
```

---

## 5. Sistema de Webhooks

### 5.1 Eventos suportados

| Evento | Quando dispara |
|--------|----------------|
| `order.created` | Novo pedido criado |
| `order.status_changed` | Status movido no kanban |
| `order.delivered` | Pedido marcado como entregue |
| `menu.item_updated` | Item do cardápio alterado |

### 5.2 Dispatcher (`src/lib/webhook.ts`)

```typescript
export async function dispatchWebhook(
  restaurantId: string,
  event: WebhookEvent,
  payload: object
) {
  const subscriptions = await db
    .select()
    .from(webhookSubscriptions)
    .where(
      and(
        eq(webhookSubscriptions.restaurantId, restaurantId),
        eq(webhookSubscriptions.active, true),
        arrayContains(webhookSubscriptions.events, [event])
      )
    );

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const body = JSON.stringify({ event, data: payload, timestamp: Date.now() });
      const signature = await sign(body, sub.secret); // HMAC-SHA256

      const res = await fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body,
      });

      await db.insert(webhookLogs).values({
        subscriptionId: sub.id,
        event,
        payload: body,
        statusCode: res.status,
        sentAt: new Date(),
      });
    })
  );
}
```

### 5.3 Verificação no receptor (exemplo)

```typescript
const sig = req.headers["x-webhook-signature"];
const expectedSig = await sign(rawBody, WEBHOOK_SECRET);
if (sig !== expectedSig) return res.status(401).end();
```

---

## 6. Autenticação (Painel do Restaurante)

- **Estratégia:** JWT stateless via cookie HttpOnly + Secure
- **Lib:** `jsonwebtoken` + `bcryptjs` (Node.js runtime completo)
- **Fluxo:**
  1. `POST /api/auth/login` → valida email + bcrypt(password) → emite JWT (exp: 8h) → seta cookie
  2. Middleware de rota no layout `(dashboard)/layout.tsx` → verifica JWT → redireciona `/login` se inválido
  3. `POST /api/auth/logout` → limpa cookie

---

## 7. Tecnologias & Dependências

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Framework | Vinext (Next.js + Vite) | Stack definida, Vite > Turbopack |
| Runtime | **Node.js 20+** via **PM2** | Self-hosted, processo gerenciado |
| Reverse Proxy | **Nginx** | SSL, static files, proxy para :3000 |
| Banco | **PostgreSQL** (local ou VPS separada) | Robusto, sem dependência de SaaS |
| ORM | **Drizzle ORM** | Leve, migrations simples, ótimo DX |
| Auth | **jsonwebtoken** + **bcryptjs** | Node.js nativo, sem restrições de Edge |
| Validação | **Zod** | Schemas compartilhados front/back |
| UI | **Tailwind CSS** + **shadcn/ui** | Rápido, acessível |
| Kanban | **@dnd-kit/core** | Drag-and-drop headless |
| Estado | **Zustand** | Carrinho + estado global leve |
| CEP | **ViaCEP** (fetch público) | Autocomplete de endereço |
| Deploy | VPS própria (Ubuntu + Nginx + PM2) | Controle total, sem vendor lock-in |

---

## 8. Comunicação em Tempo Real — SSE

Unidirecional (servidor → cliente), nativo no Node.js, sem biblioteca extra.
Usado em dois contextos: **status do pedido para o cliente** e **kanban ao vivo para o restaurante**.

### 8.1 Arquitetura do canal SSE

```
Cliente público             Painel do restaurante
/pedido/[id]                /app/pedidos (kanban)
     │                             │
     │  GET /api/orders/[id]/stream│  GET /api/sse/restaurant
     │  Accept: text/event-stream  │  Accept: text/event-stream
     ▼                             ▼
┌──────────────────────────────────────────────────────┐
│              SSEManager  (singleton Node.js)          │
│                                                      │
│  clients: Map<                                       │
│    channelId: string,                                │
│    Set<{ res: ServerResponse, id: string }>          │
│  >                                                   │
│                                                      │
│  publish(channel, event, data)  →  itera o Set       │
└──────────────────────────────────────────────────────┘
```

Dois canais distintos:
- `order:{orderId}` — escutado pelo cliente que fez o pedido
- `restaurant:{restaurantId}` — escutado pelo painel do restaurante

### 8.2 SSEManager (`src/lib/sse-manager.ts`)

```typescript
type SSEClient = {
  id: string;
  res: import("http").ServerResponse;
};

class SSEManager {
  private channels = new Map<string, Set<SSEClient>>();

  subscribe(channel: string, client: SSEClient) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(client);
  }

  unsubscribe(channel: string, clientId: string) {
    const ch = this.channels.get(channel);
    if (!ch) return;
    for (const client of ch) {
      if (client.id === clientId) {
        ch.delete(client);
        break;
      }
    }
    if (ch.size === 0) this.channels.delete(channel);
  }

  publish(channel: string, event: string, data: object) {
    const ch = this.channels.get(channel);
    if (!ch) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of ch) {
      client.res.write(payload);
    }
  }
}

// Singleton — uma única instância por processo Node.js
export const sseManager = new SSEManager();
```

### 8.3 API Route — cliente público (`src/app/api/orders/[id]/stream/route.ts`)

```typescript
import { sseManager } from "@/lib/sse-manager";
import { db } from "@/lib/db";
import { orders } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
  });
  if (!order) return new Response("Not found", { status: 404 });

  const clientId = randomUUID();
  const channel = `order:${params.id}`;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Envia status atual imediatamente ao conectar
      const initial = `event: status\ndata: ${JSON.stringify({ status: order.status })}\n\n`;
      controller.enqueue(encoder.encode(initial));

      // Keep-alive a cada 25s (evita timeout do Nginx/browser)
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 25_000);

      const res = {
        id: clientId,
        res: {
          write: (chunk: string) => controller.enqueue(encoder.encode(chunk)),
        } as any,
      };

      sseManager.subscribe(channel, res);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        sseManager.unsubscribe(channel, clientId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // instrui o Nginx a não bufferizar
    },
  });
}
```

### 8.4 API Route — painel do restaurante (`src/app/api/sse/restaurant/route.ts`)

```typescript
// Mesmo padrão, canal diferente
// Escuta todos os eventos do restaurante: novos pedidos, mudanças de status

const channel = `restaurant:${restaurantId}`; // restaurantId vem do JWT no cookie
```

Eventos publicados nesse canal:
- `order.created` — novo card aparece no kanban
- `order.status_changed` — card se move de coluna automaticamente

### 8.5 Publicando eventos (onde o status muda)

```typescript
// src/app/api/orders/[id]/status/route.ts  (PATCH)
import { sseManager } from "@/lib/sse-manager";

export async function PATCH(req: NextRequest, { params }) {
  const { status } = await req.json();

  await db.update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, params.id));

  const updatedOrder = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
  });

  // Notifica o cliente que fez o pedido
  sseManager.publish(`order:${params.id}`, "status", { status });

  // Notifica o painel do restaurante
  sseManager.publish(
    `restaurant:${updatedOrder!.restaurantId}`,
    "order.status_changed",
    { orderId: params.id, status }
  );

  // Dispara webhook registrado
  await dispatchWebhook(updatedOrder!.restaurantId, "order.status_changed", updatedOrder);

  return Response.json({ ok: true });
}
```

### 8.6 Hook no cliente React (`src/hooks/useOrderStatus.ts`)

```typescript
import { useEffect, useState } from "react";

type OrderStatus = "em_analise" | "em_producao" | "pronto" | "entregue";

export function useOrderStatus(orderId: string, initial: OrderStatus) {
  const [status, setStatus] = useState<OrderStatus>(initial);

  useEffect(() => {
    const es = new EventSource(`/api/orders/${orderId}/stream`);

    es.addEventListener("status", (e) => {
      const { status } = JSON.parse(e.data);
      setStatus(status);
    });

    es.onerror = () => {
      // EventSource reconecta automaticamente — não precisa de lógica extra
      console.warn("SSE desconectado, reconectando...");
    };

    return () => es.close();
  }, [orderId]);

  return status;
}
```

### 8.7 Hook no painel — kanban ao vivo (`src/hooks/useKanbanSSE.ts`)

```typescript
import { useEffect } from "react";
import { useKanbanStore } from "@/stores/kanban";

export function useKanbanSSE() {
  const { addOrder, moveOrder } = useKanbanStore();

  useEffect(() => {
    const es = new EventSource("/api/sse/restaurant");

    es.addEventListener("order.created", (e) => {
      addOrder(JSON.parse(e.data));
    });

    es.addEventListener("order.status_changed", (e) => {
      const { orderId, status } = JSON.parse(e.data);
      moveOrder(orderId, status);
    });

    return () => es.close();
  }, []);
}
```

### 8.8 Considerações de produção

| Ponto | Detalhe |
|-------|---------|
| **Nginx buffering** | Obrigatório `proxy_buffering off` e `X-Accel-Buffering: no` no header |
| **Timeout** | `proxy_read_timeout 3600s` no Nginx; heartbeat a cada 25s mantém a conexão |
| **Reconexão** | `EventSource` reconecta automaticamente após queda — comportamento nativo do browser |
| **Escala** | SSEManager é in-memory; se escalar para múltiplos processos PM2, substituir por pub/sub via Redis ou PostgreSQL LISTEN/NOTIFY |
| **Limite de conexões** | Browsers limitam a 6 conexões HTTP/1.1 por domínio; com HTTP/2 (Nginx) esse limite sobe para ~100 |

## 9. Infraestrutura Self-Hosted

```
VPS (Ubuntu 22.04)
├── Node.js 20 LTS
├── PM2                    # gerenciador de processos (restart automático, logs)
├── Nginx                  # reverse proxy na porta 80/443
│   └── certbot (Let's Encrypt) para SSL gratuito
└── PostgreSQL 16          # pode ser no mesmo servidor ou VPS separada
```

### nginx.conf (bloco essencial)

```nginx
server {
    listen 443 ssl;
    server_name seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        # necessário para SSE
        proxy_buffering    off;
        proxy_read_timeout 3600s;
    }
}
```

### ecosystem.config.js (PM2)

```javascript
module.exports = {
  apps: [{
    name: 'restaurante-app',
    script: 'node_modules/.bin/vinext',
    args: 'start',
    instances: 1,          // ou 'max' para cluster mode
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    }
  }]
};
```

---

## 10. Variáveis de Ambiente

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
WEBHOOK_SIGNING_SECRET=...
VIACEP_BASE_URL=https://viacep.com.br/ws
NEXT_PUBLIC_APP_URL=https://seurestaurante.com
```

---

## 11. Roadmap de Implementação

| Fase | Entregáveis |
|------|-------------|
| **1 — Base** | Schema DB · Auth · Layout público e dashboard |
| **2 — Cardápio** | CRUD categorias, itens e adicionais · Exibição pública |
| **3 — Pedidos** | Formulário delivery · Comanda · POST /api/orders |
| **4 — Kanban** | Board drag-and-drop · PATCH status |
| **5 — Webhooks** | Dispatcher · Logs · UI de gerenciamento de inscrições |
| **6 — Config** | Ajustes de delivery · Perfil do restaurante |
| **7 — Relatórios** | Pedidos por período · Itens mais vendidos |