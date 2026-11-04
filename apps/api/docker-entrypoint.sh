#!/bin/sh
set -e

if [ -n "${ASSISTANT_BETA_EMAILS:-}" ]; then
  echo "[assistant] ASSISTANT_BETA_EMAILS is set"
else
  echo "[assistant] ASSISTANT_BETA_EMAILS is missing"
fi

if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "[assistant] OPENAI_API_KEY is set"
else
  echo "[assistant] OPENAI_API_KEY is missing"
fi

# Snapshot the real container env before Next starts. Next inlines process.env at
# `next build`, so Dockploy runtime vars never reach the compiled server bundle.
node -e "require('fs').writeFileSync('/tmp/tcr-runtime-env.json', JSON.stringify(process.env))"

cd /repo/apps/api
/repo/node_modules/.bin/prisma migrate deploy
export PORT=3003
export HOSTNAME=0.0.0.0
exec /repo/node_modules/.bin/next start
