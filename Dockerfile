# Override at build time:
# docker compose build --build-arg NODE_IMAGE=docker.arvancloud.ir/node:22-slim
ARG NODE_IMAGE=node:22-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
ENV NODE_OPTIONS="--max_old_space_size=1536"
RUN npm ci --no-audit --no-fund

ARG NODE_IMAGE=node:22-slim
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=https://api.coffevista.ir
ARG NEXT_PUBLIC_APP_URL=https://cafevista.ir
ARG NEXT_PUBLIC_APP_VERSION=2.6.0
ARG JWT_SECRET=build-time-jwt-secret-change-me-123456
ARG ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
ARG CSRF_SECRET=build-time-csrf-secret-change-me-123456

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION} \
    JWT_SECRET=${JWT_SECRET} \
    ENCRYPTION_KEY=${ENCRYPTION_KEY} \
    CSRF_SECRET=${CSRF_SECRET}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

ARG NODE_IMAGE=node:22-slim
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=https://api.coffevista.ir
ARG NEXT_PUBLIC_APP_URL=https://cafevista.ir
ARG NEXT_PUBLIC_APP_VERSION=2.6.0

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
