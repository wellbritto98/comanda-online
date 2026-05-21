# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:vinext

# Executa migrações Drizzle antes do app subir (docker compose → service migrate)
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json drizzle.config.ts tsconfig.json ./
COPY drizzle ./drizzle
COPY lib ./lib
ENV NODE_ENV=production
CMD ["npx", "drizzle-kit", "migrate"]

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/dist/standalone ./
USER nextjs
EXPOSE 3000
ENV PORT=3000
# vinext usa HOST (não HOSTNAME como Next.js standalone)
ENV HOST=0.0.0.0
CMD ["node", "server.js"]
