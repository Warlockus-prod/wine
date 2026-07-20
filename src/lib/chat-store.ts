/**
 * Chat transcript persistence.
 *
 * The chat used to be write-only to the analytics `events` table (counts and
 * char lengths, no text), so nobody could answer "what do guests actually
 * ask?" — the question that sells the product to a restaurant. This module
 * fills `chat_sessions` / `chat_messages`, which existed in the schema but
 * had no writer.
 *
 * Contract:
 *  - one OPEN session per anonymous guest; turns append to it
 *  - a gap longer than SESSION_GAP_MS starts a new session (a returning guest
 *    next morning is a new conversation, not a 12-hour one)
 *  - SOFT-FAIL like `logEvent`: a transcript write must never break the reply
 *    the guest is waiting for
 *  - guests without an anonymousId (private mode, storage blocked) are simply
 *    not recorded — we never mint an identifier server-side
 */

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";

/** Idle gap that ends a conversation. */
const SESSION_GAP_MS = 45 * 60 * 1000;
/** Stored text cap — transcripts are for reading trends, not archiving essays. */
const MAX_STORED_CHARS = 4000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PersistTurnInput {
  anonymousId?: string | null;
  userText: string;
  assistantText: string;
  model?: string | null;
  /** Total completion tokens for the assistant turn, when the SDK reports it. */
  tokens?: number | null;
}

/** Append one user+assistant exchange to the guest's conversation.
 *  Returns the session id it wrote to, or null when nothing was recorded. */
export async function persistChatTurn(input: PersistTurnInput): Promise<string | null> {
  const anon = typeof input.anonymousId === "string" ? input.anonymousId.trim() : "";
  // The column is uuid — a malformed id would throw per request, so bail early.
  if (!UUID_RE.test(anon)) return null;

  try {
    const [open] = await db
      .select({ id: chatSessions.id, startedAt: chatSessions.startedAt })
      .from(chatSessions)
      .where(and(eq(chatSessions.anonymousId, anon), isNull(chatSessions.endedAt)))
      .orderBy(desc(chatSessions.startedAt))
      .limit(1);

    let sessionId: string | null = open?.id ?? null;

    if (sessionId) {
      // Close a stale session instead of appending to it, so "conversations"
      // in the admin mean what an operator expects.
      const [latest] = await db
        .select({ ts: chatMessages.ts })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(desc(chatMessages.ts))
        .limit(1);
      const lastTs = latest?.ts ?? open?.startedAt ?? null;
      if (lastTs && Date.now() - new Date(lastTs).getTime() > SESSION_GAP_MS) {
        await db
          .update(chatSessions)
          .set({ endedAt: new Date() })
          .where(eq(chatSessions.id, sessionId));
        sessionId = null;
      }
    }

    if (!sessionId) {
      const [created] = await db
        .insert(chatSessions)
        .values({ anonymousId: anon })
        .returning({ id: chatSessions.id });
      sessionId = created?.id ?? null;
    }
    if (!sessionId) return null;

    await db.insert(chatMessages).values([
      {
        sessionId,
        role: "user" as const,
        content: input.userText.slice(0, MAX_STORED_CHARS),
      },
      {
        sessionId,
        role: "assistant" as const,
        content: input.assistantText.slice(0, MAX_STORED_CHARS),
        model: input.model ?? null,
        tokens: input.tokens ?? null,
      },
    ]);

    return sessionId;
  } catch (err) {
    // Never block the guest's answer on a transcript write.
    console.warn("[chat-store] persist failed", err);
    return null;
  }
}
