import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildChatSystemPrompt } from "@/data/wine-compass-kb";

export const runtime = "nodejs";

type ChatTurn = { role: "user" | "assistant"; content: string };

interface ChatRequest {
  messages?: ChatTurn[];
  /** Optional: user's current compass profile so the bot can reference it. */
  profile?: Record<string, number>;
}

const MAX_TURNS = 12; // server-side cap
const MAX_USER_CHARS = 2000;
const MAX_RESPONSE_TOKENS = 350;

let openaiSingleton: OpenAI | null = null;
const getOpenAI = () => {
  if (openaiSingleton) return openaiSingleton;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing");
  }
  openaiSingleton = new OpenAI({ apiKey });
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

  const profileNote = profileToSummary(body.profile);

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch (err) {
    return NextResponse.json(
      {
        error: "Bot tymczasowo niedostępny — brak konfiguracji OpenAI.",
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
        ...cleaned,
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Bot nie zwrócił odpowiedzi." }, { status: 502 });
    }

    return NextResponse.json({
      reply,
      model,
      usage: completion.usage ?? null,
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      {
        error: "Błąd bota — spróbuj ponownie za chwilę.",
        debug: process.env.NODE_ENV === "development" ? e.message : undefined,
      },
      { status: e.status && e.status >= 400 && e.status < 600 ? e.status : 502 },
    );
  }
}
