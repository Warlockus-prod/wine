/**
 * /api/pairing/explain — generate a 2-sentence Vinokompas-vocabulary
 * rationale for a specific dish × wine pair, on-demand from /pairing.
 *
 * Why a separate route from /api/pairing:
 *  - Score+rank for ALL wines runs offline-friendly heuristics (deterministic,
 *    fast, free).
 *  - The lyrical "why" only matters for the SELECTED wine — paying for an
 *    OpenAI call per click is fine, paying per ranked wine is not.
 *
 * The KB system prompt grounds the bot in the 6 sektorów / 12 tendencji /
 * 3 base smaki vocabulary so output stays inside Vinokompas language.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { COMPASS_SECTORS, BASE_TASTES } from "@/data/wine-compass-kb";
import { logEvent } from "@/lib/server-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reqSchema = z.object({
  dish: z.object({
    name: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
  }),
  wine: z.object({
    name: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    grape: z.string().max(100).optional(),
    region: z.string().max(100).optional(),
  }),
  /** Optional: per-restaurant context for analytics. */
  restaurantId: z.string().uuid().nullish(),
  anonymousId: z.string().uuid().nullish(),
  locale: z.enum(["pl", "en"]).default("pl"),
});

const MAX_TOKENS = 180;

let openaiSingleton: OpenAI | null = null;
const getOpenAI = () => {
  if (openaiSingleton) return openaiSingleton;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  openaiSingleton = new OpenAI({ apiKey });
  return openaiSingleton;
};

function buildVocabPrompt(locale: "pl" | "en") {
  const sectorList = COMPASS_SECTORS.map((s) => {
    const [t1, t2] = s.tendencje;
    return `- ${s.name_pl} → ${t1.name_pl} / ${t2.name_pl}`;
  }).join("\n");
  const tastes = BASE_TASTES.map((b) => `- ${b.name_pl}`).join("\n");

  if (locale === "pl") {
    return `Jesteś sommelierem-przewodnikiem Cellar Compass tłumaczącym łączenia metodą Vinokompas.

# Słownik Vinokompasu (UŻYWAJ TYLKO TYCH POJĘĆ)
6 wrażeń (każde ma 2 tendencje):
${sectorList}

3 podstawowe smaki:
${tastes}

# Zasady odpowiedzi
- DOKŁADNIE 2 zdania, po polsku.
- Każde zdanie używa minimum jednego pojęcia z powyższego słownika (np. „świeżość/cytrusy", „tęgość/czekolada", „kwasowość").
- Zdanie 1: opisuje wrażenie/tendencję dania (co dominuje w smaku/teksturze).
- Zdanie 2: tłumaczy jak wino tę cechę uzupełnia (kontrast lub harmonia) używając swojego sektora.
- Bez wykrzykników, bez „czyli", „bowiem". Krótko i bezpośrednio jak sommelier przy stole.`;
  }
  return `You are a Cellar Compass sommelier-guide explaining pairings via the Vinokompas method.

# Vocabulary (USE ONLY THESE TERMS)
${sectorList}
Base tastes: ${tastes}

# Rules
- EXACTLY 2 sentences, in English.
- Each sentence uses ≥1 vocabulary term.
- Sentence 1: dish's dominant impression / tendency.
- Sentence 2: how the wine's sector complements (contrast or harmony).
- No exclamation marks, no filler. Direct sommelier voice.`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const { dish, wine, locale } = parsed.data;
  const userMessage =
    locale === "pl"
      ? `Połączenie:
DANIE: ${dish.name} — ${dish.description}
WINO: ${wine.name}${wine.grape ? ` (${wine.grape})` : ""}${wine.region ? `, ${wine.region}` : ""} — ${wine.description}

Wyjaśnij dwoma zdaniami, używając słownika Vinokompasu.`
      : `Pair:
DISH: ${dish.name} — ${dish.description}
WINE: ${wine.name}${wine.grape ? ` (${wine.grape})` : ""}${wine.region ? `, ${wine.region}` : ""} — ${wine.description}

Explain in two sentences using Vinokompas vocabulary.`;

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const usesNewParam = /^(gpt-5|o[134])/i.test(model);

  try {
    const completion = await openai.chat.completions.create({
      model,
      ...(usesNewParam
        ? { max_completion_tokens: MAX_TOKENS }
        : { max_tokens: MAX_TOKENS, temperature: 0.5 }),
      messages: [
        { role: "system", content: buildVocabPrompt(locale) },
        { role: "user", content: userMessage },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Empty reply" }, { status: 502 });
    }

    void logEvent({
      type: "pairing_match",
      restaurantId: parsed.data.restaurantId ?? null,
      anonymousId: parsed.data.anonymousId ?? null,
      props: {
        kind: "vinokompas_explain",
        model,
        tokens: completion.usage?.total_tokens ?? null,
        locale,
      },
    });

    return NextResponse.json({
      explanation: reply,
      model,
      usage: completion.usage ?? null,
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: "Bot failed", debug: process.env.NODE_ENV === "development" ? e.message : undefined },
      { status: e.status && e.status >= 400 && e.status < 600 ? e.status : 502 },
    );
  }
}
