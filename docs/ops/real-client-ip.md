# Restoring the real client IP (proxy_protocol) — PREPARED, NOT APPLIED

## The problem

Public HTTPS on VPS2 enters an nginx **stream** block on :443 that reads the
SNI name and `proxy_pass`es to `127.0.0.1:8443`. The HTTP vhosts then set
`X-Real-IP $remote_addr`, and at that point `$remote_addr` is the loopback
address — the stream hop has already discarded the client's address.

So every request looks like it comes from `127.0.0.1`, and every per-IP rate
limit in the app collapses into **one bucket shared by the whole internet**.
The chat limit is 50 messages / 24 h; before this was noticed, the 51st message
of the day from *anybody* would have silenced the bot for *everybody*.

Mitigated in the app on 2026-09-01 (`src/app/api/chat/route.ts`): the chat now
uses a per-guest bucket keyed on `anonymousId` when the IP is untrustworthy,
plus a global ceiling that still caps cost. That removes the outage risk. It is
NOT a full substitute — `anonymousId` is client-supplied and rotatable, so a
determined abuser is bounded only by the global ceiling.

## Why it is not applied

`proxy_protocol` is enabled on the stream **server**, i.e. for every backend it
routes to. Once it is on, EVERY vhost behind it must declare
`listen 8443 ssl proxy_protocol` — any vhost that does not will fail every
request with a protocol-parse error.

On VPS2 that is **20+ vhosts belonging to other projects**: n8n, gtframe,
regatta, analytics, auth, app.hybridadtech.com, euconsole, mediaplan, ga4,
footfall, betafinanse, przepisy, feed-validator, geo-validator, jonny, rtb,
weektoregatta, emandaryn, h-icoffio and ours. Breaking someone else's
production to sharpen our rate limiter is not a trade to make unilaterally —
hence this file instead of a change.

## The change, when there is a window

1. Stream — `/etc/nginx/stream.d/01-sni-routing.conf`, in the `server` block:

   ```nginx
   server {
       listen 443;
       listen [::]:443;
       proxy_pass $sni_backend;
       ssl_preread on;
       proxy_protocol on;          # ← add
   }
   ```

2. EVERY vhost that listens on 8443 — add the parameter and trust the hop:

   ```nginx
   listen 8443 ssl proxy_protocol;        # ← was: listen 8443 ssl;
   set_real_ip_from 127.0.0.1;            # ← add (once per server block)
   real_ip_header proxy_protocol;         # ← add
   ```

   Enumerate them first, and patch them in ONE edit so no vhost is left behind:

   ```bash
   docker exec nginx_server sh -c 'grep -rl "listen 8443" /etc/nginx/conf.d/ | grep -v bak'
   ```

3. `docker exec nginx_server nginx -t` — must pass BEFORE reloading.
4. `docker exec nginx_server nginx -s reload`.
5. Verify every hostname still answers, not just ours. Take the status codes
   BEFORE the change and compare after; anything that regresses means a vhost
   was missed.
6. Confirm the fix worked: a request should now arrive with a real
   `X-Real-IP`. The app picks it up automatically — `trustedIp()` in
   `src/app/api/chat/route.ts` ignores loopback addresses and starts keying on
   the IP again with no code change.

**Rollback:** remove `proxy_protocol` from the stream server and reload. Keep
the vhost `proxy_protocol` parameters out of the rollback path — a vhost
expecting the header while the stream no longer sends it fails just as hard, so
roll back the stream and the vhosts together.
