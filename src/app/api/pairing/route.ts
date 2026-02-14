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

function scoreWine(dish: DishInput, wine: WineInput): PairingResult {
  const dishText = [dish.name, dish.description, ...(dish.tags ?? [])].join(" ").toLowerCase();
  const wineText = [wine.name, wine.description, ...(wine.tags ?? [])].join(" ").toLowerCase();

  let score = 55;
  const reasons: string[] = [];

  const richDish = includesAny(dishText, ["duck", "confit", "butter", "fat", "rich"]);
  const delicateDish = includesAny(dishText, ["scallop", "delicate", "raw", "light"]);
  const spicyDish = includesAny(dishText, ["spice", "pepper", "garlic"]);

  if (richDish && includesAny(wineText, ["high acid", "dry", "riesling", "acid"])) {
    score += 24;
    reasons.push("High acidity balances rich texture and cleans the palate.");
  }

  if (richDish && includesAny(wineText, ["pinot", "earthy", "light body"])) {
    score += 16;
    reasons.push("Red-fruit and earth complement savory depth without heaviness.");
  }

  if (delicateDish && includesAny(wineText, ["bold", "tannic", "cabernet"])) {
    score -= 20;
    reasons.push("Strong tannins can dominate delicate flavors.");
  }

  if (delicateDish && includesAny(wineText, ["mineral", "crisp", "riesling", "rose"])) {
    score += 14;
    reasons.push("Fresh, mineral profile preserves delicate dish character.");
  }

  if (spicyDish && includesAny(wineText, ["fruity", "rose", "pinot"])) {
    score += 10;
    reasons.push("Fruit notes soften spice and improve balance.");
  }

  if (includesAny(wineText, ["bold", "tannic"]) && !includesAny(dishText, ["steak", "beef", "char"])) {
    score -= 8;
    reasons.push("Structure is slightly aggressive for this dish profile.");
  }

  if (reasons.length === 0) {
    reasons.push("General structure and aroma profile are compatible with the dish.");
  }

  return {
    wineId: wine.id,
    score: clamp(Math.round(score), 25, 99),
    reason: reasons[0],
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
