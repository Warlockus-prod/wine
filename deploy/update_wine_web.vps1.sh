#!/usr/bin/env bash
# Deploy BOTH Vinovigator sites on VPS1 (46.225.11.249).
#
# VPS1 also hosts the live wineassistance.pl chat (flask_wine + the shared
# nginx_server container). This script touches NEITHER: it only builds our
# image and runs our own containers bound to 172.17.0.1:4300/:4301, which are
# unreachable from the internet until an nginx server block is added for them.
# Never add `default_server` to that block and never name its file so it sorts
# before default.conf — that file IS the chat's vhost and also catches every
# unmatched Host.
#
# Usage: bash /opt/repos/wine_web_wn/update_wine_web.sh
set -euo pipefail

# ── Domains ───────────────────────────────────────────────────────────────
# Change these two at cutover to the client's subdomains, then re-run.
# SITE_URL is the canonical origin of each deployment (runtime, no rebuild).
# FULL_SITE_URL is where the tutorial site sends everything it does not serve.
SITE_URL_FULL="${SITE_URL_FULL:-https://wine2.icoffio.com}"
SITE_URL_TUTORIAL="${SITE_URL_TUTORIAL:-https://wine.icoffio.com}"

REPO=/opt/repos/wine_web_wn
ENV_FILE="$REPO/.env.local"
NET=wine_web_wn_net

cd "$REPO"
git fetch origin
git checkout main
git pull --ff-only origin main

if [[ -f "$ENV_FILE" ]]; then
  ENV_ARG=(--env-file "$ENV_FILE")
else
  echo "WARN: $ENV_FILE missing — /api/chat and DB-backed routes will fail."
  ENV_ARG=()
fi

# NEXT_PUBLIC_* must be inlined at BUILD time (they end up in the client
# bundle), so they are passed as build args, not just runtime env.
BUILD_ARGS=()
if [[ -f "$ENV_FILE" ]]; then
  while IFS= read -r line; do
    case "$line" in
      NEXT_PUBLIC_*=*) BUILD_ARGS+=(--build-arg "$line") ;;
    esac
  done < "$ENV_FILE"
fi

docker build -f Dockerfile.vps ${BUILD_ARGS[@]+"${BUILD_ARGS[@]}"} -t wine_web_wn:latest .
docker network create "$NET" >/dev/null 2>&1 || true

if [[ -d "$REPO/drizzle/migrations" && -n "$(ls -A "$REPO/drizzle/migrations" 2>/dev/null)" ]]; then
  echo "Running drizzle migrations..."
  docker run --rm --network "$NET" "${ENV_ARG[@]}" \
    --entrypoint sh wine_web_wn:latest \
    -c "node node_modules/drizzle-kit/bin.cjs migrate"
  echo "Seeding restaurants/dishes/wines/pairings..."
  docker run --rm --network "$NET" "${ENV_ARG[@]}" \
    --entrypoint node wine_web_wn:latest \
    node_modules/tsx/dist/cli.mjs scripts/db-seed.mts
fi

docker rm -f wine_web_wn_app >/dev/null 2>&1 || true
docker run -d \
  --name wine_web_wn_app \
  --restart unless-stopped \
  --network "$NET" \
  -p 172.17.0.1:4300:3000 \
  "${ENV_ARG[@]}" \
  -e SITE_MODE=full \
  -e SITE_URL="$SITE_URL_FULL" \
  wine_web_wn:latest

docker rm -f wine_web_wn_samouczek >/dev/null 2>&1 || true
docker run -d \
  --name wine_web_wn_samouczek \
  --restart unless-stopped \
  --network "$NET" \
  -p 172.17.0.1:4301:3000 \
  "${ENV_ARG[@]}" \
  -e SITE_MODE=samouczek \
  -e SITE_URL="$SITE_URL_TUTORIAL" \
  -e FULL_SITE_URL="$SITE_URL_FULL" \
  wine_web_wn:latest

echo "Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)  (full :4300 · samouczek :4301)"
echo "  full     → $SITE_URL_FULL"
echo "  tutorial → $SITE_URL_TUTORIAL"

# ── Post-deploy security assertion ────────────────────────────────────────
# The admin gate FAILS OPEN by design: api-acl.ts treats anything other than
# AUTH_GATE_ADMIN=1 as "pilot mode" and lets every write through. A dropped or
# mistyped env var therefore reopens /admin and the whole write API silently —
# which is exactly how it sat open on production until 2026-09-01. Assert it
# here so a deploy cannot quietly undo the fix.
for port in 4300 4301; do
  # Wait for the freshly created container to accept connections first — an
  # unreachable port answers 000, which is not "open" and must not be read as
  # a failure of the gate.
  code=000
  for _ in $(seq 1 30); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://172.17.0.1:${port}/api/admin/chat-analytics" || true)
    [ -n "$code" ] && [ "$code" != "000" ] && break
    sleep 2
  done
  if [[ "$code" != "401" ]]; then
    echo "‼️  ОПАСНО: :${port}/api/admin/chat-analytics вернул ${code}, ожидался 401."
    echo "   Админ-гейт открыт. Проверь AUTH_GATE_ADMIN=1 в .env.local и пересоздай контейнеры."
    exit 1
  fi
done
echo "  ✓ админ-гейт закрыт на обоих портах (401)"
