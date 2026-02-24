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
      text: "Высокая кислотность освежает блюдо и балансирует жирную текстуру.",
    });
  }

  if (delicateDish && (passport.tannin === "high" || passport.body === "full")) {
    score -= 18;
    reasons.push({
      weight: 12,
      text: "Сильные танины и плотное тело могут перебить деликатный вкус блюда.",
    });
  }

  if (seafoodDish && passport.acidity === "high" && passport.tannin !== "high") {
    score += 18;
    reasons.push({
      weight: 18,
      text: "Минеральность и кислотность вина поддерживают морскую солоноватость и свежесть.",
    });
  }

  if (redMeatDish && (passport.tannin === "high" || passport.tannin === "medium")) {
    score += 20;
    reasons.push({
      weight: 20,
      text: "Танины и структура вина хорошо связываются с белком и жиром красного мяса.",
    });
  }

  if (redMeatDish && passport.body === "light") {
    score -= 14;
    reasons.push({
      weight: 10,
      text: "Легкое тело вина может выглядеть слишком тонким для насыщенного мясного блюда.",
    });
  }

  if (spicyDish && passport.abv >= 14) {
    score -= 10;
    reasons.push({
      weight: 9,
      text: "Высокий алкоголь усиливает ощущение остроты.",
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
      text: "Легкое/среднее тело и мягкие танины аккуратно работают с остротой и специями.",
    });
  }

  if (tomatoDish && passport.acidity === "high") {
    score += 10;
    reasons.push({
      weight: 10,
      text: "Кислотность вина совпадает с кислотным профилем томатного соуса.",
    });
  }

  if (friedDish && includesAny(wineText, ["sparkling", "champagne", "brut"])) {
    score += 8;
    reasons.push({
      weight: 8,
      text: "Игристая структура очищает нёбо после жареной текстуры.",
    });
  }

  if (includesAny(wineText, ["riesling", "chablis", "sancerre"]) && seafoodDish) {
    score += 7;
    reasons.push({
      weight: 7,
      text: "Классическое региональное сочетание белого вина с морепродуктами.",
    });
  }

  if (includesAny(wineText, ["pinot noir"]) && includesAny(dishText, ["duck", "mushroom"])) {
    score += 8;
    reasons.push({
      weight: 8,
      text: "Pinot Noir поддерживает утку и грибные тона, не перегружая блюдо.",
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      weight: 1,
      text: "Базовый баланс тела, кислотности и ароматического профиля корректный.",
    });
  }

  const primaryReason = reasons.sort((a, b) => b.weight - a.weight)[0]?.text;

  return {
    wineId: wine.id,
    score: clamp(Math.round(score), 25, 99),
    reason: primaryReason ?? "Общий профиль вина совместим с выбранным блюдом.",
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
