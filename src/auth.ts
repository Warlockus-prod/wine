/**
 * Auth.js v5 (NextAuth) — magic-link auth backed by Drizzle.
 *
 * SMTP is not provisioned yet. The "console-log" provider below mints the
 * standard verification token but writes the magic link to server stdout
 * instead of sending an email. The deployer reads docker logs to fish the
 * link out and sends it manually. As soon as SMTP env vars land
 * (EMAIL_SERVER_HOST/PORT/USER/PASSWORD/FROM), Auth.js picks them up via
 * the regular `Email` provider and console-log goes silent.
 */

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";

const hasSmtp = Boolean(
  process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD &&
    process.env.EMAIL_FROM,
);

const baseConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  pages: {
    signIn: "/admin/signin",
    verifyRequest: "/admin/signin?status=check-email",
  },
  callbacks: {
    async session({ session, user }) {
      // Surface user.role on the session so middleware can gate by role.
      if (session.user) {
        // @ts-expect-error — augmenting next-auth types in module-augmentation
        session.user.role = (user as { role?: string }).role ?? "staff";
        session.user.id = user.id;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies Omit<NextAuthConfig, "providers">;

// Mailer: use SMTP if configured, otherwise log link to stdout for the
// deployer to fish out of `docker logs`. Both shapes go through the
// Nodemailer provider — different `server` value (`null` triggers the
// stub `sendVerificationRequest` instead of dispatching).
const provider = hasSmtp
  ? Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  : Nodemailer({
      // Provide minimal-shape server so init succeeds, then override
      // sendVerificationRequest to bypass the actual SMTP send.
      server: { host: "noop", port: 25, auth: { user: "noop", pass: "noop" } },
      from: "noreply@local",
      sendVerificationRequest: ({ identifier, url }) => {
        console.log(
          `\n━━━━━━━━━━━ MAGIC LINK ━━━━━━━━━━━\nTo: ${identifier}\nURL: ${url}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
        );
        return Promise.resolve();
      },
    });

const config: NextAuthConfig = {
  ...baseConfig,
  providers: [provider],
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
