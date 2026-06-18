/**
 * samouczek-wines.ts - wine catalogue for the Vinokompas tutorial.
 *
 * Source: winnica.pl - the originators of the Vinocompas methodology this
 * whole tutorial is built on (they ship the public "Vinocompas" taste tool).
 * The samouczek is NOT tied to any single restaurant, so proposals are
 * matched against the live taste profile and link back to winnica.pl's
 * selection of that grape/style.
 *
 * Each entry is a grape/style (not a volatile SKU) so the "buy" link always
 * lands on real, in-stock products via winnica.pl search - it never 404s.
 *
 * `fingerprint` maps a CompassProfile key → strength 0..4 (how strongly the
 * wine expresses that base taste / tendencja). Keys MUST match the ids in
 * wine-compass-kb.ts: base.{slodycz|cierpkosc|kwasowosc} and
 * {sektor}.{tendencja} (e.g. "swieze.cytrusy").
 */

export type SamouczekWineStyle =
  | "white"
  | "red"
  | "rose"
  | "sparkling"
  | "dessert";

export interface SamouczekWine {
  id: string;
  /** Grape / style headline, PL. */
  name_pl: string;
  /** Grape variety - drives the bottle silhouette + the shop search. */
  grape: string;
  /** Region label, PL. */
  region_pl: string;
  style: SamouczekWineStyle;
  /** Indicative entry price at winnica.pl, PLN. */
  priceFrom: number;
  /** One-line "why it fits your profile", PL. */
  why_pl: string;
  /** CompassProfile key → strength 0..4. */
  fingerprint: Record<string, number>;
  /** winnica.pl search term. */
  query: string;
}

export const SAMOUCZEK_WINES: SamouczekWine[] = [
  // ── ŚWIEŻE - crisp, citrus, green ─────────────────────────────────────
  {
    id: "riesling-wytrawny",
    name_pl: "Riesling wytrawny",
    grape: "Riesling",
    region_pl: "Mosel, Niemcy",
    style: "white",
    priceFrom: 59,
    why_pl: "Rześka kwasowość i cytrusowy nerw - esencja świeżości.",
    fingerprint: { "swieze.cytrusy": 4, "swieze.zielone": 2, "ziemiste.mineraly": 3, "base.kwasowosc": 4 },
    query: "Riesling",
  },
  {
    id: "sauvignon-blanc",
    name_pl: "Sauvignon Blanc",
    grape: "Sauvignon Blanc",
    region_pl: "Loara, Francja",
    style: "white",
    priceFrom: 55,
    why_pl: "Zielone zioła, agrest i tnąca świeżość - wino-orzeźwienie.",
    fingerprint: { "swieze.zielone": 4, "swieze.cytrusy": 3, "base.kwasowosc": 4 },
    query: "Sauvignon Blanc",
  },
  {
    id: "pinot-grigio",
    name_pl: "Pinot Grigio",
    grape: "Pinot Grigio",
    region_pl: "Veneto, Włochy",
    style: "white",
    priceFrom: 45,
    why_pl: "Lekkie, cytrusowe i bezpretensjonalne - czysta przyjemność.",
    fingerprint: { "swieze.cytrusy": 3, "swieze.zielone": 2, "base.kwasowosc": 3 },
    query: "Pinot Grigio",
  },
  {
    id: "gruner-veltliner",
    name_pl: "Grüner Veltliner",
    grape: "Grüner Veltliner",
    region_pl: "Wachau, Austria",
    style: "white",
    priceFrom: 65,
    why_pl: "Biały pieprz, zielone jabłko i mineralny krzemień.",
    fingerprint: { "swieze.zielone": 3, "swieze.cytrusy": 2, "ziemiste.mineraly": 2, "base.kwasowosc": 3 },
    query: "Gruner Veltliner",
  },

  // ── OLEISTE - buttery, toasty, tropical ───────────────────────────────
  {
    id: "chardonnay-beczkowe",
    name_pl: "Chardonnay beczkowe",
    grape: "Chardonnay",
    region_pl: "Burgundia, Francja",
    style: "white",
    priceFrom: 79,
    why_pl: "Masło, tosty i orzechy z dębowej beczki - gęsta oleistość.",
    fingerprint: { "oleiste.maslo": 4, "oleiste.tropikalne": 2, "swieze.cytrusy": 1 },
    query: "Chardonnay",
  },
  {
    id: "viognier",
    name_pl: "Viognier",
    grape: "Viognier",
    region_pl: "Rhône, Francja",
    style: "white",
    priceFrom: 69,
    why_pl: "Morela, mango i kwiaty - żywiczna, tropikalna pełnia.",
    fingerprint: { "oleiste.tropikalne": 4, "oleiste.maslo": 2, "miekkie.dojrzale": 2 },
    query: "Viognier",
  },

  // ── musujące + słodkie ────────────────────────────────────────────────
  {
    id: "prosecco",
    name_pl: "Prosecco Brut",
    grape: "Glera",
    region_pl: "Veneto, Włochy",
    style: "sparkling",
    priceFrom: 49,
    why_pl: "Drobne bąbelki, zielone jabłko i cytrus - lekkość i radość.",
    fingerprint: { "swieze.cytrusy": 3, "miekkie.dojrzale": 2, "base.kwasowosc": 3 },
    query: "Prosecco",
  },
  {
    id: "moscato-dasti",
    name_pl: "Moscato d'Asti",
    grape: "Moscato",
    region_pl: "Piemont, Włochy",
    style: "sparkling",
    priceFrom: 52,
    why_pl: "Brzoskwinia, liczi i miód - delikatna, musująca słodycz.",
    fingerprint: { "oleiste.tropikalne": 3, "miekkie.dojrzale": 3, "base.slodycz": 4 },
    query: "Moscato",
  },

  // ── MIĘKKIE - ripe fruit, jam ─────────────────────────────────────────
  {
    id: "merlot",
    name_pl: "Merlot",
    grape: "Merlot",
    region_pl: "Bordeaux, Francja",
    style: "red",
    priceFrom: 59,
    why_pl: "Dojrzała śliwka i aksamit - łagodne, okrągłe czerwone.",
    fingerprint: { "miekkie.dojrzale": 4, "miekkie.konfitury": 2, "base.cierpkosc": 2 },
    query: "Merlot",
  },
  {
    id: "primitivo",
    name_pl: "Primitivo",
    grape: "Primitivo",
    region_pl: "Apulia, Włochy",
    style: "red",
    priceFrom: 55,
    why_pl: "Konfitura z czarnych owoców, lukrecja i ciepło słońca.",
    fingerprint: { "miekkie.konfitury": 4, "miekkie.dojrzale": 3, "base.slodycz": 1, "base.cierpkosc": 2 },
    query: "Primitivo",
  },
  {
    id: "pinot-noir",
    name_pl: "Pinot Noir",
    grape: "Pinot Noir",
    region_pl: "Burgundia, Francja",
    style: "red",
    priceFrom: 89,
    why_pl: "Wiśnia, leśna ściółka i jedwab - eleganckie, ziemiste.",
    fingerprint: { "ziemiste.sciolka": 4, "miekkie.dojrzale": 2, "ziemiste.mineraly": 2, "base.cierpkosc": 1 },
    query: "Pinot Noir",
  },

  // ── SZORSTKIE - tannin, oak, leather ──────────────────────────────────
  {
    id: "chianti",
    name_pl: "Chianti Classico",
    grape: "Sangiovese",
    region_pl: "Toskania, Włochy",
    style: "red",
    priceFrom: 69,
    why_pl: "Wiśnia, zioła i wytrawne taniny - klasyk do stołu.",
    fingerprint: { "szorstkie.dab": 3, "ziemiste.sciolka": 2, "miekkie.dojrzale": 2, "base.cierpkosc": 3, "base.kwasowosc": 2 },
    query: "Chianti",
  },
  {
    id: "cabernet-sauvignon",
    name_pl: "Cabernet Sauvignon",
    grape: "Cabernet Sauvignon",
    region_pl: "Bordeaux / Toskania",
    style: "red",
    priceFrom: 75,
    why_pl: "Czarna porzeczka, cedr i dębowa struktura - moc i taniny.",
    fingerprint: { "tegie.cigaro": 3, "szorstkie.dab": 3, "miekkie.konfitury": 2, "base.cierpkosc": 4 },
    query: "Cabernet Sauvignon",
  },
  {
    id: "nebbiolo-barolo",
    name_pl: "Nebbiolo / Barolo",
    grape: "Nebbiolo",
    region_pl: "Piemont, Włochy",
    style: "red",
    priceFrom: 119,
    why_pl: "Róża, smoła i potężne taniny - szorstki arystokrata.",
    fingerprint: { "szorstkie.dab": 3, "szorstkie.pizmo": 2, "ziemiste.sciolka": 3, "tegie.suszone": 3, "base.cierpkosc": 4 },
    query: "Nebbiolo",
  },

  // ── TĘGIE - bold, dried, smoky ────────────────────────────────────────
  {
    id: "syrah-shiraz",
    name_pl: "Syrah / Shiraz",
    grape: "Syrah",
    region_pl: "Rhône / Australia",
    style: "red",
    priceFrom: 65,
    why_pl: "Wędzonka, czarny pieprz i suszona śliwka - tęga, dymna moc.",
    fingerprint: { "tegie.cigaro": 4, "tegie.suszone": 2, "szorstkie.pizmo": 2, "miekkie.konfitury": 2, "base.cierpkosc": 3 },
    query: "Syrah",
  },
  {
    id: "rioja-reserva",
    name_pl: "Rioja Reserva",
    grape: "Tempranillo",
    region_pl: "Rioja, Hiszpania",
    style: "red",
    priceFrom: 79,
    why_pl: "Suszone owoce, skóra i wanilia z długiego leżakowania.",
    fingerprint: { "tegie.suszone": 3, "szorstkie.dab": 3, "szorstkie.pizmo": 2, "oleiste.maslo": 1, "base.cierpkosc": 3 },
    query: "Rioja",
  },
  {
    id: "amarone",
    name_pl: "Amarone della Valpolicella",
    grape: "Corvina",
    region_pl: "Veneto, Włochy",
    style: "red",
    priceFrom: 139,
    why_pl: "Suszone wiśnie, figi i czekolada - tęgie, skoncentrowane.",
    fingerprint: { "miekkie.konfitury": 4, "tegie.suszone": 4, "base.slodycz": 1, "base.cierpkosc": 3 },
    query: "Amarone",
  },
  {
    id: "porto-tawny",
    name_pl: "Porto Tawny",
    grape: "Porto",
    region_pl: "Douro, Portugalia",
    style: "dessert",
    priceFrom: 89,
    why_pl: "Karmel, suszone owoce i orzechy - słodki, tęgi finał.",
    fingerprint: { "tegie.suszone": 4, "miekkie.konfitury": 3, "base.slodycz": 4, "base.cierpkosc": 2 },
    query: "Porto",
  },
];

/** Build a winnica.pl search URL for a grape/style query. */
export const winnicaSearchUrl = (query: string): string =>
  `https://winnica.pl/pl/szukaj?controller=search&s=${encodeURIComponent(query)}`;
