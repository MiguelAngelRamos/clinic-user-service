# ============================================================
#  clinic-user-service — Dockerfile multi-stage
#  Stage 1: deps     — instala dependencias
#  Stage 2: builder  — compila TypeScript → JavaScript
#  Stage 3: runner   — imagen final mínima
# ============================================================

# ---- Stage 1: deps ------------------------------------------
FROM node:22.11.0-alpine3.20 AS deps

# Build tools para módulos nativos si los hubiera en el futuro
RUN apk add --no-cache libc6-compat

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copiar manifiestos primero — aprovechar cache de Docker
COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-store-user,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Stage 2: builder ---------------------------------------
FROM node:22.11.0-alpine3.20 AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# Solo dependencias de producción en el runner
RUN --mount=type=cache,id=pnpm-store-user,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ---- Stage 3: runner ----------------------------------------
FROM node:22.11.0-alpine3.20 AS runner

# dumb-init como PID 1 — graceful shutdown y cosecha de zombies
RUN apk add --no-cache dumb-init libc6-compat

WORKDIR /app

USER node

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3002
ENV HOME=/app

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/users/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
