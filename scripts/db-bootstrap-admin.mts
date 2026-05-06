#!/usr/bin/env -S npx tsx
/**
 * Idempotent admin bootstrap — creates a super-admin user and attaches
 * them as owner of EVERY restaurant. Run once after the first migration
 * + seed, then again whenever new restaurants are added (it's safe — only
 * inserts missing memberships).
 *
 * Usage:
 *   ADMIN_EMAIL=ty@firma.pl npx tsx scripts/db-bootstrap-admin.mts
 *
 * After running, flipping AUTH_GATE_ADMIN=1 won't lock you out — your
 * email is in the users table with role=admin and is a member of every
 * restaurant.
 */

import "dotenv/config";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL;

if (!databaseUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}
if (!adminEmail || !adminEmail.includes("@")) {
  console.error("ADMIN_EMAIL=ty@firma.pl required");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

const stats = { userInserted: 0, userExisted: 0, membershipsAdded: 0 };

await sql.begin(async (tx) => {
  // Upsert user as admin
  const existing = await tx`SELECT id, role FROM users WHERE email = ${adminEmail} LIMIT 1`;
  let userId: string;
  if (existing.length > 0) {
    userId = existing[0].id as string;
    if (existing[0].role !== "admin") {
      await tx`UPDATE users SET role = 'admin', last_login_at = NOW() WHERE id = ${userId}`;
    }
    stats.userExisted++;
  } else {
    const [created] = await tx`
      INSERT INTO users (email, role, name) VALUES (${adminEmail}, 'admin', 'Bootstrap admin')
      RETURNING id
    `;
    userId = created.id as string;
    stats.userInserted++;
  }

  // Attach as owner to every restaurant (skip if membership exists).
  const restaurants = await tx`SELECT id FROM restaurants`;
  for (const r of restaurants) {
    const inserted = await tx`
      INSERT INTO restaurant_members (user_id, restaurant_id, role)
      VALUES (${userId}, ${r.id}, 'owner')
      ON CONFLICT DO NOTHING
      RETURNING user_id
    `;
    if (inserted.length > 0) stats.membershipsAdded++;
  }
});

console.log("Bootstrap complete:", stats);
console.log(`Admin: ${adminEmail}`);
console.log("Now you can flip AUTH_GATE_ADMIN=1 and login at /admin/signin.");

await sql.end();
