import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Locale = "pl" | "en";

// All reason strings translated. Key = stable English source line; value =
// PL translation. The scorer still works with English keys internally -
// we resolve to the active locale once at the end of the request.
const PL: Record<string, string> = {
  "High acidity refreshes the palate and balances richer textures.":
    "Wysoka kwasowość odświeża podniebienie i równoważy bogatsze tekstury.",
  "High tannin or full body can overpower delicate flavors.":
    "Wysoka taniczność lub pełne ciało mogą zdominować delikatne smaki.",
  "Acidity and minerality support seafood freshness and salinity.":
    "Kwasowość i mineralność podkreślają świeżość owoców morza i ich słoność.",
  "Tannin structure pairs well with the protein and fat in red meat.":
    "Struktura taninowa doskonale współgra z białkiem i tłuszczem czerwonego mięsa.",
  "A light-bodied wine can feel too thin for a rich meat dish.":
    "Wino o lekkim ciele może wydać się zbyt delikatne przy treściwym daniu mięsnym.",
  "Higher alcohol can amplify perceived heat in spicy dishes.":
    "Wyższy alkohol może wzmocnić odczuwaną ostrość w pikantnych daniach.",
  "Light to medium body with softer tannin handles spice more gracefully.":
    "Wino o lekkim lub średnim ciele i miększej taninie lepiej radzi sobie z ostrością.",
  "Wine acidity aligns with the acid profile of tomato-based sauces.":
    "Kwasowość wina współgra z profilem kwasowym sosów pomidorowych.",
  "Sparkling texture cleanses the palate after fried textures.":
    "Tekstura wina musującego oczyszcza podniebienie po smażonych potrawach.",
  "Classic regional white-wine-and-seafood pairing profile.":
    "Klasyczne regionalne łączenie białego wina z owocami morza.",
  "Pinot Noir complements duck and mushroom notes without overpowering them.":
    "Pinot Noir uzupełnia nuty kaczki i grzybów, nie dominując ich.",
  "Overall body, acidity, and aromatic profile are broadly compatible.":
    "Ogólne ciało, kwasowość i profil aromatyczny są w pełni zgodne.",
  "Overall wine structure is compatible with the selected dish.":
    "Ogólna struktura wina pasuje do wybranego dania.",
};

const localize = (text: string, locale: Locale): string =>
  locale === "pl" ? PL[text] ?? text : text;

type DishInput = {
  id?: string;
  name?: string;
  description?: string;
  tags?: string[];
};

type WineInput = {
  id: string;
  name?: string;
  description?: string;
  tags?: string[];
  passport?: {
    grape?: string;
    abv?: number;
    body?: "light" | "medium" | "full";
    acidity?: "low" | "medium" | "high";
    tannin?: "none" | "soft" | "medium" | "high";
    servingTempC?: string;
    decant?: string;
  };
};

type PairingResult = {
  wineId: string;
  score: number;
  reason: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const includesAny = (source: string, terms: string[]) =>
  terms.some((term) => source.includes(term));

const inferPassport = (wine: WineInput) => {
  const wineText = [wine.name, wine.description, ...(wine.tags ?? [])].join(" ").toLowerCase();
  const body = includesAny(wineText, ["full", "bold", "cabernet", "syrah"])
    ? "full"
    : includesAny(wineText, ["light", "pinot", "rose", "riesling"])
      ? "light"
      : "medium";
  const acidity = includesAny(wineText, ["high acid", "riesling", "chablis", "sancerre"])
    ? "high"
    : "medium";
  const tannin = includesAny(wineText, ["tannic", "cabernet", "nebbiolo"])
    ? "high"
    : includesAny(wineText, ["pinot", "soft tannin"])
      ? "soft"
      : "none";

  return {
    grape: wine.passport?.grape ?? "Blend",
    abv: Number.isFinite(wine.passport?.abv) ? Number(wine.passport?.abv) : body === "full" ? 14.5 : 12.8,
    body: wine.passport?.body ?? body,
    acidity: wine.passport?.acidity ?? acidity,
    tannin: wine.passport?.tannin ?? tannin,
    servingTempC: wine.passport?.servingTempC ?? "8-16",
    decant: wine.passport?.decant ?? "No decant.",
  };
};

function scoreWine(dish: DishInput, wine: WineInput): PairingResult {
  const dishText = [dish.name, dish.description, ...(dish.tags ?? [])].join(" ").toLowerCase();
  const wineText = [wine.name, wine.description, ...(wine.tags ?? [])].join(" ").toLowerCase();
  const passport = inferPassport(wine);

  let score = 60;
  const reasons: Array<{ weight: number; text: string }> = [];

  const richDish = includesAny(dishText, ["duck", "confit", "butter", "fat", "rich", "cream", "risotto", "cheese"]);
  const delicateDish = includesAny(dishText, ["scallop", "delicate", "raw", "light", "crudo", "tartare", "fish"]);
  const seafoodDish = includesAny(dishText, ["seafood", "scallop", "fish", "branzino", "sole", "oyster"]);
  const redMeatDish = includesAny(dishText, ["beef", "steak", "wagyu", "lamb", "osso buco", "ragu"]);
  const spicyDish = includesAny(dishText, ["spice", "pepper", "garlic", "chili", "harissa"]);
  const tomatoDish = includesAny(dishText, ["tomato", "ragu", "marinara"]);
  const friedDish = includesAny(dishText, ["fry", "tempura", "crispy"]);

  if (richDish && passport.acidity === "high") {
    score += 16;
    reasons.push({
      weight: 16,
      text: "High acidity refreshes the palate and balances richer textures.",
    });
  }

  if (delicateDish && (passport.tannin === "high" || passport.body === "full")) {
    score -= 18;
    reasons.push({
      weight: 12,
      text: "High tannin or full body can overpower delicate flavors.",
    });
  }

  if (seafoodDish && passport.acidity === "high" && passport.tannin !== "high") {
    score += 18;
    reasons.push({
      weight: 18,
      text: "Acidity and minerality support seafood freshness and salinity.",
    });
  }

  if (redMeatDish && (passport.tannin === "high" || passport.tannin === "medium")) {
    score += 20;
    reasons.push({
      weight: 20,
      text: "Tannin structure pairs well with the protein and fat in red meat.",
    });
  }

  if (redMeatDish && passport.body === "light") {
    score -= 14;
    reasons.push({
      weight: 10,
      text: "A light-bodied wine can feel too thin for a rich meat dish.",
    });
  }

  if (spicyDish && passport.abv >= 14) {
    score -= 10;
    reasons.push({
      weight: 9,
      text: "Higher alcohol can amplify perceived heat in spicy dishes.",
    });
  }

  if (
    spicyDish &&
    (passport.body === "light" || passport.body === "medium") &&
    passport.tannin !== "high"
  ) {
    score += 9;
    reasons.push({
      weight: 9,
      text: "Light to medium body with softer tannin handles spice more gracefully.",
    });
  }

  if (tomatoDish && passport.acidity === "high") {
    score += 10;
    reasons.push({
      weight: 10,
      text: "Wine acidity aligns with the acid profile of tomato-based sauces.",
    });
  }

  if (friedDish && includesAny(wineText, ["sparkling", "champagne", "brut"])) {
    score += 8;
    reasons.push({
      weight: 8,
      text: "Sparkling texture cleanses the palate after fried textures.",
    });
  }

  if (includesAny(wineText, ["riesling", "chablis", "sancerre"]) && seafoodDish) {
    score += 7;
    reasons.push({
      weight: 7,
      text: "Classic regional white-wine-and-seafood pairing profile.",
    });
  }

  if (includesAny(wineText, ["pinot noir"]) && includesAny(dishText, ["duck", "mushroom"])) {
    score += 8;
    reasons.push({
      weight: 8,
      text: "Pinot Noir complements duck and mushroom notes without overpowering them.",
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      weight: 1,
      text: "Overall body, acidity, and aromatic profile are broadly compatible.",
    });
  }

  const primaryReason = reasons.sort((a, b) => b.weight - a.weight)[0]?.text;

  return {
    wineId: wine.id,
    score: clamp(Math.round(score), 25, 99),
    reason: primaryReason ?? "Overall wine structure is compatible with the selected dish.",
  };
}

const bodySchema = z.object({
  dish: z.object({
    id: z.string().max(100).optional(),
    name: z.string().max(300).optional(),
    description: z.string().max(2000).optional(),
    tags: z.array(z.string().max(60)).max(30).optional(),
  }),
  wines: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        name: z.string().max(300).optional(),
        description: z.string().max(2000).optional(),
        tags: z.array(z.string().max(60)).max(30).optional(),
        passport: z
          .object({
            grape: z.string().max(100).optional(),
            abv: z.number().optional(),
            body: z.enum(["light", "medium", "full"]).optional(),
            acidity: z.enum(["low", "medium", "high"]).optional(),
            tannin: z.enum(["none", "soft", "medium", "high"]).optional(),
            servingTempC: z.string().max(40).optional(),
            decant: z.string().max(200).optional(),
          })
          .optional(),
      }),
    )
    .min(1)
    .max(200),
  curated: z
    .array(
      z.object({
        dishId: z.string().max(100).optional(),
        wineId: z.string().max(100).optional(),
        reason: z.string().max(1000).optional(),
      }),
    )
    .max(1000)
    .optional(),
  locale: z.enum(["pl", "en"]).optional(),
});

export async function POST(request: Request) {
  try {
    // Public + CPU-bound scorer → throttle per IP and bound the payload so a
    // huge wines[] can't burn the event loop (algorithmic DoS, audit M3).
    const rl = rateLimit(`pairing:${clientIp(request)}`, 60, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const body = parsed.data;

    // Locale resolution priority: explicit body.locale → URL ?locale param.
    // Default keeps EN to avoid silently breaking older clients.
    const url = new URL(request.url);
    const fromQuery = url.searchParams.get("locale") as Locale | null;
    const locale: Locale = body.locale ?? (fromQuery === "pl" ? "pl" : "en");

    const dish = body.dish;
    const dishId = dish.id ?? "";

    const curatedForDish = new Map<string, string>();
    if (Array.isArray(body.curated) && dishId) {
      for (const entry of body.curated) {
        if (
          entry?.dishId === dishId &&
          typeof entry.wineId === "string" &&
          entry.wineId.length > 0 &&
          typeof entry.reason === "string" &&
          entry.reason.trim().length > 0
        ) {
          curatedForDish.set(entry.wineId, entry.reason.trim());
        }
      }
    }

    const matches = body.wines
      .filter((wine) => Boolean(wine.id))
      .map((wine) => {
        const result = scoreWine(dish, wine);
        const curatedReason = curatedForDish.get(wine.id);
        if (curatedReason) {
          return {
            ...result,
            // Curated pairs are author-endorsed, so lift them above algo-only
            // matches with a fixed BONUS that preserves the real score spread —
            // flooring everything to 88 made the guest top-3 read 88/88/88
            // (audit 2026-07).
            score: clamp(result.score + 12, 70, 99),
            // Curated reasons are author-written, no translation map.
            reason: curatedReason,
          };
        }
        // Translate the algorithmic reason once, at the boundary.
        return { ...result, reason: localize(result.reason, locale) };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json({ error: "Could not calculate pairings" }, { status: 500 });
  }
}
