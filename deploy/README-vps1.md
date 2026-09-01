# VPS1 deployment (46.225.11.249)

A second copy of both Vinovigator sites, prepared for the client's own
subdomains. **VPS1 also serves the live `wineassistance.pl` chat** (the
`flask_wine` container, embedded into winnica.pl / vinocompas.pl via the CORS
allow-list in its nginx vhost). Everything here is written so that chat is
never at risk.

## What is already running (2026-09-01)

| Container | Bind | Mode |
|---|---|---|
| `wine_web_wn_app` | `172.17.0.1:4300` | `SITE_MODE=full` |
| `wine_web_wn_samouczek` | `172.17.0.1:4301` | `SITE_MODE=samouczek` |
| `wine_web_wn_postgres` | `172.17.0.1:5440` | own volume `wine_web_wn_pgdata` |

Both bind to the docker bridge only, so **nothing is reachable from the
internet yet** — by design, until DNS exists. nginx has not been touched:
`docker exec nginx_server ls /etc/nginx/conf.d/` still lists exactly the seven
files it had before.

Deploy/update: `bash /opt/repos/wine_web_wn/update_wine_web.sh`
(DB password lives in `/root/.wine_pgpass`, mode 600; secrets in
`/opt/repos/wine_web_wn/.env.local`, mode 600.)

## The three nginx rules on this box

1. **Never `default_server`.** No vhost on VPS1 declares it, so nginx falls
   back to the first config it loads — `default.conf`, which *is* the chat.
   Declaring it anywhere else silently hijacks every unmatched request.
2. **Filename must sort after `default.conf`.** `wine-vinovigator.conf` is
   fine; `00-anything.conf` would load first and become that fallback.
3. **Reload, never restart:** `docker exec nginx_server nginx -s reload`.

Note that `conf.d` is *not* a directory mount — each vhost is bind-mounted as
an individual file, except `regatta.conf`, which was `docker cp`'d in. We
follow the `docker cp` route: it needs no container recreation, so the chat
stays up. The trade-off is that the file is lost if `nginx_server` is ever
recreated — keep the source in this repo and re-copy it if that happens.

## Cutover, once the client's DNS points here

```bash
FULL=vinovigator.winnica.pl        # ← the client's names
TUT=kompas.winnica.pl

# 1. DNS must resolve to this box FIRST — certbot verifies over HTTP.
dig +short "$FULL" "$TUT"          # both must print 46.225.11.249

# 2. Certificates. The ACME challenge already works before the vhost exists:
#    unmatched :80 traffic falls to default.conf, which serves
#    /.well-known/acme-challenge from the same webroot.
certbot certonly --webroot -w /opt/repos/certs/certs -d "$FULL" -d "$TUT"

# 3. Publish the certs where the vhost expects them (this box keeps them in
#    /opt/repos/certs, mounted into nginx as /etc/ssl/{certs,private}).
for h in "$FULL" "$TUT"; do
  cp "/etc/letsencrypt/live/$h/fullchain.pem" "/opt/repos/certs/certs/$h.crt"
  cp "/etc/letsencrypt/live/$h/privkey.pem"   "/opt/repos/certs/private/$h.key"
done

# 4. vhost from the template in this directory
sed -e "s/__FULL_HOST__/$FULL/g" -e "s/__TUTORIAL_HOST__/$TUT/g" \
  /opt/repos/wine_web_wn/deploy/vps1-nginx-site.conf.template \
  > /tmp/wine-vinovigator.conf
docker cp /tmp/wine-vinovigator.conf nginx_server:/etc/nginx/conf.d/wine-vinovigator.conf

# 5. Validate BEFORE reloading — a bad config would refuse to load.
docker exec nginx_server nginx -t && docker exec nginx_server nginx -s reload

# 6. Prove the chat is still fine (this is the check that matters).
curl -s -o /dev/null -w "chat %{http_code}\n" -H "Host: wineassistance.pl" -k https://127.0.0.1/
```

### Then, in the app

- `update_wine_web.sh` — set `SITE_URL_FULL` / `SITE_URL_TUTORIAL` to the new
  hosts and re-run (runtime values, no rebuild needed for these).
- `.env.local` — `NEXT_PUBLIC_SITE_URL` is baked in at BUILD time, so changing
  it requires the rebuild that `update_wine_web.sh` performs anyway.
- `next.config.ts` → `frame-ancestors`, and
  `src/app/[locale]/embed/samouczek/EmbedSamouczekClient.tsx` →
  `ALLOWED_PARENT_ORIGINS`: both allow-list who may iframe the widget. The new
  hosts must be added there or the shop's iframe will be blocked.

### Data

This copy was seeded from the repo seed, **not** from production. VPS2's
Postgres holds the real pilot history (events since 2026-05-05) plus any
restaurant edits made through the DB editor. Copy it at cutover, not before,
so the snapshot is fresh:

```bash
ssh VPS2 'docker exec wine_web_wn_postgres pg_dump -U wine wine_web_wn' \
  | ssh VPS1 'docker exec -i wine_web_wn_postgres psql -U wine -d wine_web_wn'
```

### Old QR codes

Printed codes point at `wine.icoffio.com`. Keep the VPS2 deployment and its
redirect alive after the move — switching it off breaks every code already in
a restaurant.
