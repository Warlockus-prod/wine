#!/usr/bin/env bash
set -euo pipefail

cd /opt/repos/wine_web_wn
git fetch origin
git checkout main
git pull --ff-only origin main

ENV_FILE=/opt/repos/wine_web_wn/.env.local
if [[ -f "$ENV_FILE" ]]; then
  ENV_ARG=(--env-file "$ENV_FILE")
else
  echo "WARN: $ENV_FILE missing — /api/chat and DB-backed routes will fail."
  ENV_ARG=()
fi

# Public NEXT_PUBLIC_* vars must be inlined at BUILD time. They are not secret
# (they ship in the client bundle), so we pass them as --build-arg. Secrets are
# NEVER baked into the image — .dockerignore excludes .env*, and they're
# injected at runtime via --env-file above. Without this the Mapbox map renders
# blank, because .env.local is no longer copied into the build context.
BUILD_ARGS=()
if [[ -f "$ENV_FILE" ]]; then
  while IFS= read -r line; do
    case "$line" in
      NEXT_PUBLIC_*=*) BUILD_ARGS+=(--build-arg "$line") ;;
    esac
  done < "$ENV_FILE"
fi

docker build -f Dockerfile.vps ${BUILD_ARGS[@]+"${BUILD_ARGS[@]}"} -t wine_web_wn:latest .
docker rm -f wine_web_wn_app >/dev/null 2>&1 || true

# Ensure the project's docker network exists (idempotent — first deploy after
# Postgres bootstrap created it; this no-ops on subsequent runs).
docker network create wine_web_wn_net >/dev/null 2>&1 || true

# Run migrations + idempotent seed BEFORE swapping the app container — so a
# new release that expects new schema never briefly serves traffic against
# an old DB. Migrations are forward-only and idempotent (drizzle journal);
# the seed skips rows that already exist (matched by external_id).
if [[ -d /opt/repos/wine_web_wn/drizzle/migrations && -n "$(ls -A /opt/repos/wine_web_wn/drizzle/migrations 2>/dev/null)" ]]; then
  echo "Running drizzle migrations..."
  docker run --rm \
    --network wine_web_wn_net \
    "${ENV_ARG[@]}" \
    --entrypoint sh \
    wine_web_wn:latest \
    -c "node node_modules/drizzle-kit/bin.cjs migrate"

  echo "Seeding restaurants/dishes/wines/pairings..."
  docker run --rm \
    --network wine_web_wn_net \
    "${ENV_ARG[@]}" \
    --entrypoint node \
    wine_web_wn:latest \
    node_modules/tsx/dist/cli.mjs scripts/db-seed.mts
fi

docker run -d \
  --name wine_web_wn_app \
  --restart unless-stopped \
  --network wine_web_wn_net \
  -p 172.17.0.1:4300:3000 \
  "${ENV_ARG[@]}" \
  wine_web_wn:latest

echo "Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
