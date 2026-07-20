#!/usr/bin/env bash
# Nightly retention purge for guest chat logs (see src/lib/chat-retention.ts).
#
# Runs scripts/db-purge-chat.mts inside a throwaway container off the SAME
# image the app runs, on the project network, with the same runtime env — the
# pattern update_wine_web.sh already uses for migrations and the seed. Nothing
# is installed on the host and no secret leaves .env.local.
#
# Install (VPS2, root crontab) — 03:40, twenty minutes after the DB backup at
# 03:20 so a purged day is always captured in that night's dump first:
#   40 3 * * * /opt/repos/wine_web_wn/purge_chat.sh >> /var/log/wine-chat-purge.log 2>&1
#
# Window: CHAT_RETENTION_DAYS in .env.local (default 90). A malformed value
# aborts the run instead of deleting anything.
#
#   ./purge_chat.sh --dry-run    # report what would go, delete nothing
set -euo pipefail

REPO=/opt/repos/wine_web_wn
ENV_FILE="$REPO/.env.local"
IMAGE=wine_web_wn:latest

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[purge-chat] $ENV_FILE missing — refusing to run without DATABASE_URL" >&2
  exit 1
fi

# The image is rebuilt on every deploy; if it is somehow absent, do nothing
# rather than silently skipping the purge forever.
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "[purge-chat] image $IMAGE not found — run update_wine_web.sh first" >&2
  exit 1
fi

exec docker run --rm \
  --network wine_web_wn_net \
  --env-file "$ENV_FILE" \
  --entrypoint node \
  "$IMAGE" \
  node_modules/tsx/dist/cli.mjs scripts/db-purge-chat.mts "$@"
