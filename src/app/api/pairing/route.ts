import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { dish?: DishInput; wines?: WineInput[] };

    if (!body?.dish || !Array.isArray(body.wines) || body.wines.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const matches = body.wines
      .filter((wine) => Boolean(wine.id))
      .map((wine) => scoreWine(body.dish as DishInput, wine))
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json({ error: "Could not calculate pairings" }, { status: 500 });
  }
}
