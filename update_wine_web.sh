#!/usr/bin/env bash
set -euo pipefail

cd /opt/repos/wine_web_wn
git fetch origin
git checkout main
git pull --ff-only origin main
docker build -f Dockerfile.vps -t wine_web_wn:latest .
docker rm -f wine_web_wn_app >/dev/null 2>&1 || true
docker run -d --name wine_web_wn_app --restart unless-stopped -p 172.17.0.1:4300:3000 wine_web_wn:latest
echo "Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
