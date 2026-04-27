FROM node:20-alpine AS base
RUN corepack enable

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json       ./apps/web/
RUN pnpm install --frozen-lockfile --shamefully-hoist --ignore-scripts

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY packages ./packages
COPY apps/web ./apps/web
# NEXT_PUBLIC_API_URL is baked in at build time
ARG NEXT_PUBLIC_API_URL=https://api.yourcoachfit.com/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && /repo/node_modules/.bin/next build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps    /repo/node_modules       ./node_modules
COPY --from=builder /repo/packages           ./packages
COPY --from=builder /repo/apps/web/.next     ./apps/web/.next
COPY --from=builder /repo/apps/web/package.json   ./apps/web/
COPY --from=builder /repo/apps/web/next.config.ts ./apps/web/
EXPOSE 3001
CMD ["sh", "-c", "cd apps/web && PORT=3001 HOSTNAME=0.0.0.0 /repo/node_modules/.bin/next start"]
