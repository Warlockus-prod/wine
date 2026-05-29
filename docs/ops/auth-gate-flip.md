# Auth-gate flip runbook — `AUTH_GATE_ADMIN=0 → 1`

Audit P0-2. Today the admin UI and **all write APIs are open** (pilot mode):
`api-acl.requireAuth()` returns a synthetic `pilot` user and
`requireRestaurantMember` is bypassed when `AUTH_GATE_ADMIN !== "1"`
(`src/lib/api-acl.ts:27`). The edge gate in `src/middleware.ts` is also off
(`GATE_ENABLED = AUTH_GATE_ADMIN === "1"`).

Flipping is a **2-step** operation (bootstrap script already exists). Doing it
out of order = lockout. Public GET APIs stay open by design; only the admin UI +
write routes (POST/PUT/DELETE) get gated.

## Where env lives
VPS injects env via `--env-file /opt/repos/wine_web_wn/.env.local`
(`update_wine_web.sh`). Flipping = edit that file + redeploy. **Never commit it.**

## Prerequisites (from you)
- SMTP creds for magic-link: `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT` (default 587),
  `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`.
  (Auth.js only enables the Nodemailer provider when host+user+password+from are all set — `src/auth.ts:25`.)
- The admin email address to seed: `ADMIN_EMAIL`.

## Procedure

### 1. Add SMTP env (gate still 0)
Append to `/opt/repos/wine_web_wn/.env.local` on the VPS:
```
EMAIL_SERVER_HOST=...
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=...
EMAIL_SERVER_PASSWORD=...
EMAIL_FROM=no-reply@icoffio.com
```
Redeploy so the running container picks them up:
```bash
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@46.225.11.249 'bash /opt/repos/wine_web_wn/update_wine_web.sh'
```

### 2. Bootstrap the admin user (REQUIRED before flipping)
Runs against the DB; idempotent (inserts user role=admin + membership in every restaurant):
```bash
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@46.225.11.249 \
  'docker exec -e ADMIN_EMAIL=ty@firma.pl wine_web_wn_app npx tsx scripts/db-bootstrap-admin.mts'
```
Expect `Bootstrap complete:` + `Admin: ty@firma.pl`. (DATABASE_URL is already in the container env.)

### 3. Smoke-test magic-link (gate still 0)
Visit `https://wine.icoffio.com/admin/signin`, enter the admin email, submit.
- If SMTP works → email arrives, link logs you in.
- If SMTP not ready → link is printed to `docker logs wine_web_wn_app`.
Confirm the login round-trips to `/admin` before gating.

### 4. Flip the gate
Set in `/opt/repos/wine_web_wn/.env.local`:
```
AUTH_GATE_ADMIN=1
```
Redeploy (`update_wine_web.sh`).

### 5. Verify
```bash
# Logged-out /admin must redirect to signin
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://wine.icoffio.com/admin
# Write API must 401 without a session
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://wine.icoffio.com/api/restaurants/atelier-amaro/dishes \
  -H 'content-type: application/json' -d '{}'
# Public GET still 200
curl -s -o /dev/null -w "%{http_code}\n" https://wine.icoffio.com/api/restaurants/atelier-amaro/dishes
```
Expect: `/admin` → 307 to `/admin/signin`; POST → 401; GET → 200.

### Rollback
Set `AUTH_GATE_ADMIN=0` in `.env.local`, redeploy. Instant revert to pilot mode.

## Notes
- Middleware uses a **cheap cookie probe** (`SESSION_COOKIE_NAMES`), not full
  session validation, at the edge — real validation happens server-side in the
  route handlers via `requireAuth`. A forged cookie passes the edge but fails at
  the API. This is intentional (edge can't import `@/auth` → would pull postgres
  into edge runtime).
- Open-redirect on `returnTo` is already fixed (`safeReturnTo`, signin page).
- Consider adding write-route rate limiting (audit P1-2) in the same hardening pass.
