FROM node:20-slim AS builder
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

COPY package.json package-lock.json .npmrc ./
ENV NODE_OPTIONS="--max_old_space_size=1536"

# Fix .npmrc: Next.js needs optional dependencies for its SWC compiler!
RUN sed -i '/optional=false/d' .npmrc

# ==========================================
# Automated Smart Mirror Fallback Script
# ==========================================
RUN set -e; \
    MIRRORS="\
      https://package-mirror.liara.ir/repository/npm/ \
      https://mirror-npm.runflare.com/ \
      https://mirror-abrha.net/repository/npm/ \
      https://npm.devneeds.ir/ \
      https://mirrors.tencent.com/npm/ \
      https://mirrors.huaweicloud.com/repository/npm/ \
      https://registry.npmmirror.com/ \
      https://registry.npmjs.org/ \
    "; \
    SUCCESS=0; \
    cp package-lock.json package-lock.json.bak; \
    for MIRROR in $MIRRORS; do \
        echo "=========================================="; \
        echo "🚀 Testing NPM Mirror: $MIRROR"; \
        echo "=========================================="; \
        cp package-lock.json.bak package-lock.json; \
        sed -i "s|https://registry.npmjs.org/|$MIRROR|g; s|https://registry.npmmirror.com/|$MIRROR|g; s|https://package-mirror.liara.ir/repository/npm/|$MIRROR|g" package-lock.json; \
        if npm ci --no-audit --no-fund --registry=$MIRROR --fetch-timeout=30000 --fetch-retries=1; then \
            if [ -f "node_modules/.bin/next" ]; then \
                echo "✅ SUCCESS: Installed all packages and verified Next.js executable using $MIRROR"; \
                SUCCESS=1; \
                break; \
            else \
                echo "❌ WARNING: $MIRROR installed successfully but Next.js executable (.bin/next) is MISSING! Skipping fake package..."; \
            fi; \
        else \
            echo "❌ FAILED: $MIRROR is blocked, rate-limited or slow. Switching to next..."; \
        fi; \
        rm -rf node_modules; \
    done; \
    if [ $SUCCESS -eq 0 ]; then \
        echo "🚨 CRITICAL ERROR: All 8 mirrors failed or provided corrupted packages!"; \
        exit 1; \
    fi

COPY . .

# Run standard npm build script which executes local next directly without fetching network
RUN npm run build

FROM node:20-slim AS runner
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
