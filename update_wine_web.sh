#!/usr/bin/env bash
set -euo pipefail

cd /opt/repos/wine_web_wn
git fetch origin
git checkout main
git pull --ff-only origin main
docker build -f Dockerfile.vps -t wine_web_wn:latest .
docker rm -f wine_web_wn_app >/dev/null 2>&1 || true

# Pass server-side secrets via --env-file. The .env.local lives ONLY on this
# VPS (chmod 600, never in git). Required keys today:
#   OPENAI_API_KEY  — /api/chat (Vinokompas guide bot)
#   OPENAI_MODEL    — defaults to gpt-5.4-mini
# NEXT_PUBLIC_* values are bundled at build-time so they are also baked into
# the image; passing them again here is a no-op and harmless.
ENV_FILE=/opt/repos/wine_web_wn/.env.local
if [[ -f "$ENV_FILE" ]]; then
  ENV_ARG=(--env-file "$ENV_FILE")
else
  echo "WARN: $ENV_FILE missing — /api/chat will return 503"
  ENV_ARG=()
fi

docker run -d \
  --name wine_web_wn_app \
  --restart unless-stopped \
  -p 172.17.0.1:4300:3000 \
  "${ENV_ARG[@]}" \
  wine_web_wn:latest

echo "Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
