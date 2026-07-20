/**
 * /api/admin/chat-analytics
 *  GET - what guests actually ask the Vinovigator bot.
 *
 * Reads the transcripts written by `src/lib/chat-store.ts`. This is the
 * pitch-grade number for a restaurant ("your guests asked about X 40 times
 * last month"), which the analytics `events` table could never answer — it
 * only ever stored message COUNTS, not text.
 *
 * ACL-gated like every other admin surface: `requireAuth` is open in pilot
 * mode (AUTH_GATE_ADMIN=0) and enforces Basic Auth / magic-link once the
 * gate is flipped.
 */

import { and, desc, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { apiHandler, requireAuth } from "@/lib/api-acl";

export const dynamic = "force-dynamic";

/** Group near-identical questions: case/punctuation/whitespace insensitive. */
const NORMALISE = sql`lower(regexp_replace(btrim(${chatMessages.content}), '[[:punct:][:space:]]+', ' ', 'g'))`;

export async function GET(request: Request): Promise<NextResponse> {
  return apiHandler(async () => {
    await requireAuth(request);

    const url = new URL(request.url);
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") ?? 30) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totals] = await db
      .select({
        messages: sql<number>`count(*)::int`,
        questions: sql<number>`count(*) filter (where ${chatMessages.role} = 'user')::int`,
        sessions: sql<number>`count(distinct ${chatMessages.sessionId})::int`,
        tokens: sql<number>`coalesce(sum(${chatMessages.tokens}), 0)::int`,
      })
      .from(chatMessages)
      .where(gte(chatMessages.ts, since));

    const [guests] = await db
      .select({ count: sql<number>`count(distinct ${chatSessions.anonymousId})::int` })
      .from(chatSessions)
      .where(gte(chatSessions.startedAt, since));

    // Top questions — the headline number for the pitch.
    const topQuestions = await db
      .select({
        question: sql<string>`min(${chatMessages.content})`,
        asked: sql<number>`count(*)::int`,
        lastAt: sql<string>`max(${chatMessages.ts})`,
      })
      .from(chatMessages)
      .where(and(gte(chatMessages.ts, since), sql`${chatMessages.role} = 'user'`))
      .groupBy(NORMALISE)
      .orderBy(sql`count(*) desc`)
      .limit(25);

    // Recent conversations — opening question + size, for spot-reading.
    const recent = await db
      .select({
        sessionId: chatMessages.sessionId,
        startedAt: sql<string>`min(${chatMessages.ts})`,
        lastAt: sql<string>`max(${chatMessages.ts})`,
        turns: sql<number>`count(*) filter (where ${chatMessages.role} = 'user')::int`,
        opener: sql<string>`(array_agg(${chatMessages.content} order by ${chatMessages.ts}) filter (where ${chatMessages.role} = 'user'))[1]`,
      })
      .from(chatMessages)
      .where(gte(chatMessages.ts, since))
      .groupBy(chatMessages.sessionId)
      .orderBy(desc(sql`max(${chatMessages.ts})`))
      .limit(30);

    return {
      rangeDays: days,
      totals: {
        messages: totals?.messages ?? 0,
        questions: totals?.questions ?? 0,
        sessions: totals?.sessions ?? 0,
        guests: guests?.count ?? 0,
        tokens: totals?.tokens ?? 0,
      },
      topQuestions,
      recent,
    };
  });
}
