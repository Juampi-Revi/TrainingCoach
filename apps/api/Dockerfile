FROM node:20-alpine AS base
RUN corepack enable

# ── deps: install dependencies only (no source yet) ──────────────────────────
FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json       ./apps/api/
# --shamefully-hoist: flat node_modules (required for Docker — pnpm symlinks break otherwise)
# --ignore-scripts: skip postinstall (prisma generate) — no schema available yet
RUN pnpm install --frozen-lockfile --shamefully-hoist --ignore-scripts

# ── builder: generate Prisma client + build Next.js ──────────────────────────
FROM base AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY packages ./packages
COPY apps/api ./apps/api
ENV NEXT_TELEMETRY_DISABLED=1
RUN node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma
RUN cd apps/api && /repo/node_modules/.bin/next build

# ── runner: only built output + deps ─────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /repo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps    /repo/node_modules       ./node_modules
COPY --from=builder /repo/packages           ./packages
COPY --from=builder /repo/apps/api/.next     ./apps/api/.next
COPY --from=builder /repo/apps/api/package.json   ./apps/api/
COPY --from=builder /repo/apps/api/next.config.ts ./apps/api/
COPY --from=builder /repo/apps/api/prisma         ./apps/api/prisma
RUN node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma
EXPOSE 3003
CMD ["sh", "-c", "cd apps/api && PORT=3003 HOSTNAME=0.0.0.0 /repo/node_modules/.bin/next start"]
