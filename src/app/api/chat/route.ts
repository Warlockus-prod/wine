import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildChatSystemPrompt } from "@/data/wine-compass-kb";
import { logEvent } from "@/lib/server-events";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

type ChatTurn = { role: "user" | "assistant"; content: string };

interface ChatRequest {
  messages?: ChatTurn[];
  /** Optional: user's current compass profile so the bot can reference it. */
  profile?: Record<string, number>;
  /** Optional: a short page-context hint (current dish + wine, restaurant
   *  slug, etc.) injected as a system note so the bot's reply is grounded
   *  in what the user is looking at right now. */
  pageContext?: string;
  /** Optional analytics passthroughs. */
  anonymousId?: string;
  sessionId?: string;
  restaurantId?: string;
}

const MAX_TURNS = 12; // server-side cap
const MAX_USER_CHARS = 2000;
const MAX_RESPONSE_TOKENS = 350;

// ─── Per-anonymousId rate limit (24-hour rolling window) ──────────────
// In-memory only - fine for a single-container deploy. If we ever scale
// horizontally, swap for Redis or postgres. Limit prevents one guest
// from burning OpenAI tokens by spamming the chat.
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h (1 day)
const RATE_MAX_PER_WINDOW = 50;             // 50 messages / day per anon id
type RateBuckets = Map<string, number[]>;
// Module-scope so it survives across requests within a single instance.
const rateBuckets: RateBuckets =
  ((globalThis as unknown) as { __wn_chatBuckets?: RateBuckets }).__wn_chatBuckets ??
  new Map();
((globalThis as unknown) as { __wn_chatBuckets?: RateBuckets }).__wn_chatBuckets = rateBuckets;

const checkRate = (key: string): { ok: true } | { ok: false; retryAfter: number; usage: number } => {
  const now = Date.now();
  const previous = rateBuckets.get(key) ?? [];
  const recent = previous.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_PER_WINDOW) {
    const oldest = recent[0];
    const retryAfter = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 1000));
    rateBuckets.set(key, recent); // keep pruned
    return { ok: false, retryAfter, usage: recent.length };
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return { ok: true };
};

// Cost cap keyed ONLY on the trustworthy proxy IP (clientIp → X-Real-IP, which
// nginx overwrites from the real TCP peer). The client-supplied anonymousId is
// deliberately NOT used for the key — it's attacker-controlled, so keying on it
// let anyone rotate the id to burn unlimited OpenAI tokens (audit 2026-07).
const rateKeyFromRequest = (request: Request): string => `ip:${clientIp(request)}`;

let openaiSingleton: OpenAI | null = null;
const getOpenAI = () => {
  if (openaiSingleton) return openaiSingleton;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing");
  }
  // Bounded timeout + one retry so a hung upstream can't tie up the Node
  // handler indefinitely (audit 2026-07).
  openaiSingleton = new OpenAI({ apiKey, timeout: 20_000, maxRetries: 1 });
  return openaiSingleton;
};

const sanitizeTurn = (t: ChatTurn): ChatTurn | null => {
  if (!t || typeof t !== "object") return null;
  if (t.role !== "user" && t.role !== "assistant") return null;
  if (typeof t.content !== "string") return null;
  const content = t.content.trim().slice(0, MAX_USER_CHARS);
  if (content.length === 0) return null;
  return { role: t.role, content };
};

const profileToSummary = (profile: Record<string, number> | undefined): string | null => {
  if (!profile) return null;
  const nonZero = Object.entries(profile).filter(([, v]) => Number(v) > 0);
  if (nonZero.length === 0) return null;
  const lines = nonZero
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([k, v]) => `- ${k}: ${v}/4`)
    .join("\n");
  return `Aktualny profil użytkownika na kompasie (tylko zaznaczone tendencje):\n${lines}`;
};

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const cleaned = messages
    .map(sanitizeTurn)
    .filter((t): t is ChatTurn => t !== null)
    .slice(-MAX_TURNS);

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "no valid messages" }, { status: 400 });
  }

  // 4h rolling-window rate limit per anonymous id (or IP fallback).
  // Returns 429 with a friendly PL message + Retry-After header. Logs
  // the throttle event so we can spot abusive patterns later.
  const rateKey = rateKeyFromRequest(request);
  const rate = checkRate(rateKey);
  if (!rate.ok) {
    const minutes = Math.ceil(rate.retryAfter / 60);
    void logEvent({
      type: "chat_rate_limited",
      props: { key: rateKey, usage: rate.usage, retryAfterSec: rate.retryAfter },
    });
    return NextResponse.json(
      {
        error:
          minutes >= 60
            ? `Dzienny limit pytań wyczerpany. Wróć za około ${Math.ceil(minutes / 60)} godz. - przewodnik dostępny ${RATE_MAX_PER_WINDOW} razy na dobę.`
            : `Trochę za szybko. Wróć za ~${minutes} min - limit ${RATE_MAX_PER_WINDOW} pytań na dobę.`,
        retryAfter: rate.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  const profileNote = profileToSummary(body.profile);
  // Untrusted page context: trim + cap, and demote to a USER-role note (not a
  // system message) so it can't impersonate instructions - prompt-injection
  // hardening (audit P1-3).
  const pageContextClean =
    typeof body.pageContext === "string" ? body.pageContext.trim().slice(0, 600) : "";
  const pageNote =
    pageContextClean.length > 0 ? `Aktualnie użytkownik ogląda: ${pageContextClean}` : null;

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch (err) {
    return NextResponse.json(
      {
        error: "Bot tymczasowo niedostępny - brak konfiguracji OpenAI.",
        debug: process.env.NODE_ENV === "development" ? String(err) : undefined,
      },
      { status: 503 },
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

  try {
    // gpt-5.x and o-series use `max_completion_tokens`; legacy gpt-4o uses
    // `max_tokens`. Detect at runtime so OPENAI_MODEL stays swappable.
    const usesNewParam = /^(gpt-5|o[134])/i.test(model);
    const completion = await openai.chat.completions.create({
      model,
      ...(usesNewParam
        ? { max_completion_tokens: MAX_RESPONSE_TOKENS }
        : { max_tokens: MAX_RESPONSE_TOKENS, temperature: 0.6 }),
      messages: [
        { role: "system", content: buildChatSystemPrompt() },
        ...(profileNote ? [{ role: "system" as const, content: profileNote }] : []),
        ...(pageNote ? [{ role: "user" as const, content: pageNote }] : []),
        ...cleaned,
      ],
    });

    // Humanize: the model loves em/en-dashes, which read as "AI tekst"
    // (client 2026-07) - normalize them to a plain hyphen before returning.
    const reply = completion.choices?.[0]?.message?.content
      ?.trim()
      .replace(/\s*[—–]\s*/g, " - ");
    if (!reply) {
      return NextResponse.json({ error: "Bot nie zwrócił odpowiedzi." }, { status: 502 });
    }

    // Log both sides for analytics - fire-and-forget, never blocks reply.
    const lastUser = cleaned[cleaned.length - 1];
    const isUuid = (v: string | undefined): v is string =>
      !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    const ids = {
      restaurantId: isUuid(body.restaurantId) ? body.restaurantId : null,
      anonymousId: isUuid(body.anonymousId) ? body.anonymousId : null,
      sessionId: body.sessionId ?? null,
    };
    void Promise.all([
      logEvent({
        type: "chat_message_user",
        ...ids,
        props: { chars: lastUser?.content.length ?? 0 },
      }),
      logEvent({
        type: "chat_message_assistant",
        ...ids,
        props: {
          chars: reply.length,
          model,
          tokens: completion.usage?.total_tokens ?? null,
        },
      }),
    ]);

    return NextResponse.json({
      reply,
      model,
      usage: completion.usage ?? null,
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      {
        error: "Błąd bota - spróbuj ponownie za chwilę.",
        debug: process.env.NODE_ENV === "development" ? e.message : undefined,
      },
      { status: e.status && e.status >= 400 && e.status < 600 ? e.status : 502 },
    );
  }
}
