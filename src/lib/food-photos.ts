/**
 * food-photos.ts — category-keyed Unsplash CDN URLs for dish + wine images.
 *
 * Resolution order for getDishImage:
 *   1. dish.image (explicit URL on the seed entry) — highest priority,
 *      handled by the call site, not here.
 *   2. DISH_IMAGE_MAP[dish.id] from src/data/dish-images.ts — populated
 *      by scripts/gen-dish-images.mts after running DALL·E 3 generation.
 *      This is what gives EVERY dish a unique generated photo.
 *   3. Category-keyed Unsplash URL (this file's regex rules) — fallback.
 *   4. DISH_FALLBACK — generic plated dish.
 *
 * Same shape for wines.
 */

import { DISH_IMAGE_MAP } from "@/data/dish-images";

const norm = (s?: string) => (s ?? "").toLowerCase().trim();

// ─── DISH PHOTOS ─────────────────────────────────────────────────────────
// Order matters: most specific keyword first. The first matching rule wins.
type Rule = { match: RegExp; src: string };

const DISH_RULES: Rule[] = [
  // Italian
  { match: /(pizza|margherita|napol)/, src: "photo-1565299624946-b28f40a0ae38" },
  { match: /(pasta|spaghetti|tagliatelle|fettuccine|linguine|carbonar|cacio|ragu|ragù|amatricia)/, src: "photo-1551183053-bf91a1d81141" },
  { match: /(risotto)/, src: "photo-1633964913849-96bb09cce6a6" },
  { match: /(gnocchi)/, src: "photo-1631898039984-fd5ee8cdaf67" },
  { match: /(osso buco|osso-buco|veal)/, src: "photo-1544025162-d76694265947" },
  { match: /(tiramisu|panna cotta|gelato|cannoli)/, src: "photo-1571877227200-a0d98ea607e9" },
  { match: /(burrata|mozzarella|caprese)/, src: "photo-1608897013039-887f21d8c804" },
  { match: /(parmigian|melanzane|eggplant|aubergine)/, src: "photo-1572441713132-51c75654db73" },
  { match: /(vitello|carpaccio)/, src: "photo-1626645738196-c2a7c87a8f9a" },
  { match: /(branzino|sea bass|labraks)/, src: "photo-1559847844-1da4c1d62c1f" },

  // French
  { match: /(escargot|ślimak)/, src: "photo-1602253057119-44d745d9b860" },
  { match: /(duck confit|kacz|canard|magret)/, src: "photo-1544025162-d76694265947" },
  { match: /(tartare|tatar)/, src: "photo-1606923829579-0cb981a83e2b" },
  { match: /(scallop|przegrzeb|coquille)/, src: "photo-1559847844-d721426d6edc" },
  { match: /(foie gras)/, src: "photo-1565958011703-44f9829ba187" },
  { match: /(crème brûlée|creme brulee|brûlée)/, src: "photo-1488477181946-6428a0291777" },
  { match: /(soupe|consomm|broth|bouillab|bisque|zupa)/, src: "photo-1547592180-85f173990554" },

  // Japanese
  { match: /(sushi|nigiri|maki|sashimi|temaki)/, src: "photo-1579871494447-9811cf80d66c" },
  { match: /(ramen)/, src: "photo-1569718212165-3a8278d5f624" },
  { match: /(tempura)/, src: "photo-1581167410946-3c87bbcc4a4b" },
  { match: /(yakitori|robata)/, src: "photo-1606755456206-b25206cde27e" },
  { match: /(unagi|miso|cod|dorsz)/, src: "photo-1614777986387-015c2a89b696" },
  { match: /(wagyu|tataki|beef|wołow|wolow|steak)/, src: "photo-1546833999-b9f581a1996d" },
  { match: /(matcha|mochi|dorayaki)/, src: "photo-1582610116397-edb318620f90" },
  { match: /(hamachi|crudo|cebiche|ceviche|poke)/, src: "photo-1611141647740-8fffc6e29cf2" },

  // Polish / heritage
  { match: /(pierog|dumpling)/, src: "photo-1601050690597-df0568f70950" },
  { match: /(żurek|zurek|barszcz|kapuśniak)/, src: "photo-1547592180-85f173990554" },
  { match: /(bigos|gołąb|kotlet|schab)/, src: "photo-1559847844-5315695dadae" },
  { match: /(sernik|babka|szarlotka|mazurek)/, src: "photo-1571877227200-a0d98ea607e9" },

  // Generic categories
  { match: /(salad|sałat|caesar|nicoise)/, src: "photo-1546069901-ba9599a7e63c" },
  { match: /(soup|broth|zupa)/, src: "photo-1547592180-85f173990554" },
  { match: /(starter|appetizer|przystaw|amuse|tapas|antipast)/, src: "photo-1565299507177-b0ac66763828" },
  { match: /(main|principal|główne|glowne|entrée|entree)/, src: "photo-1546833999-b9f581a1996d" },
  { match: /(dessert|deser|cake|tart|cheesecake)/, src: "photo-1488477181946-6428a0291777" },
  { match: /(cheese|ser|fromage)/, src: "photo-1486297678162-eb2a19b0a32d" },
  { match: /(seafood|fish|ryba|crab|lobster|prawn|shrimp|oyster)/, src: "photo-1559847844-1da4c1d62c1f" },
  { match: /(grill|asado|brasa|charcoal|chuleton|chuletón|tomahawk)/, src: "photo-1546833999-b9f581a1996d" },
];

const DISH_FALLBACK = "photo-1414235077428-338989a2e8c0"; // generic plated dish

const buildUnsplashUrl = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format`;

/**
 * Pick a dish image. Lookup order:
 *   1. opts.id → DISH_IMAGE_MAP (the AI-generated photo, if present)
 *   2. category/name regex rules → curated Unsplash CDN URL
 *   3. DISH_FALLBACK (generic plated dish)
 */
export function getDishImage(
  opts: { id?: string; category?: string; name?: string },
  size = 600,
): string {
  if (opts.id && DISH_IMAGE_MAP[opts.id]) return DISH_IMAGE_MAP[opts.id];
  const haystack = `${norm(opts.category)} ${norm(opts.name)}`;
  for (const r of DISH_RULES) if (r.match.test(haystack)) return buildUnsplashUrl(r.src, size);
  return buildUnsplashUrl(DISH_FALLBACK, size);
}

// ─── WINE PHOTOS ─────────────────────────────────────────────────────────
const WINE_RULES: Rule[] = [
  { match: /(champagne|crémant|cremant|cava|prosecco|sparkling|brut|franciacorta|sekt)/, src: "photo-1547595628-c61a29f496f0" },
  { match: /(rose|rosé|rosado|rosato)/, src: "photo-1561461056-2a5ba76b3a1c" },
  { match: /(dessert|porto|port|tokaji|sauternes|sweet|moscato|ice wine)/, src: "photo-1568213816046-0ee1c42bd559" },
  { match: /(white|blanc|bianco|sauvignon|chardonnay|riesling|pinot grigio|gewurz|chenin|albariño|albarino|verdejo|grüner|gruner|chablis)/, src: "photo-1566995541428-f5d2ae53d28b" },
  { match: /(red|rouge|rosso|tinto|cabernet|merlot|pinot noir|syrah|shiraz|grenache|sangiovese|nebbiolo|tempranillo|malbec|primitivo|brunello|barolo|bordeaux|chianti|amarone|barbera)/, src: "photo-1553361371-9b22f78e8b1d" },
];

const WINE_FALLBACK = "photo-1553361371-9b22f78e8b1d"; // generic red bottle

export function getWineImage(
  opts: { id?: string; style?: string; grape?: string; name?: string; region?: string },
  size = 600,
): string {
  // (No AI-generated wine map yet — wines lean on Wikimedia for canonical
  // bottle photos handled in restaurant-pairing-adapter.ts.)
  const haystack = `${norm(opts.style)} ${norm(opts.grape)} ${norm(opts.name)} ${norm(opts.region)}`;
  for (const r of WINE_RULES) if (r.match.test(haystack)) return buildUnsplashUrl(r.src, size);
  return buildUnsplashUrl(WINE_FALLBACK, size);
}
