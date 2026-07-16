/**
 * Wine Compass - Vinocompas methodology knowledge base.
 *
 * Source: vinocompas.pl + parfumealavin.my.canva.site/samouczek (PL).
 * Curated from author's tutorial (Magdalena Surgiel-Czyż).
 *
 * Used by:
 *  - <TasteCompass> for sector definitions, tendencje labels, colors.
 *  - /api/chat system prompt as grounded knowledge.
 *  - /[locale]/samouczek for chapter content.
 *
 * IP note: this is OUR rewriting/encoding of a publicly-taught
 * methodology (the same way recipe books restate techniques). Direct
 * quotations stay attributed in `notes`.
 *
 * i18n: PL is the authoring language; every display field has a parallel
 * `_en` twin (terminology per docs/i18n/samouczek-en.md - Tęgie→Bold,
 * Miękkie→Soft, Oleiste→Unctuous, Świeże→Fresh, Ziemiste→Earthy,
 * Szorstkie→Grippy). Components pick a side via `pickL(lang, pl, en)`.
 * The chat system prompt stays PL-based on purpose (the bot is PL-first).
 */

export type TendencjaId = string; // e.g. "swieze.cytrusy"
export type SectorId =
  | "swieze"
  | "oleiste"
  | "miekkie"
  | "tegie"
  | "szorstkie"
  | "ziemiste";

export type BaseTaste = "slodycz" | "cierpkosc" | "kwasowosc";

/** UI language of the tutorial surfaces - PL primary, EN at the root locale. */
export type CompassLang = "pl" | "en";

/** Pick the PL or EN variant of a display string. */
export const pickL = (lang: CompassLang, pl: string, en: string): string =>
  lang === "pl" ? pl : en;

export interface Tendencja {
  id: TendencjaId;
  name_pl: string;
  name_en: string;
  /** Compact label for the compass dial - 1-2 words max, fits without
   *  collision when 12 labels orbit a 320px circle. Falls back to name_pl. */
  shortLabel_pl: string;
  shortLabel_en: string;
  associations_pl: string;
  associations_en: string;
  examples_pl: string;
  examples_en: string;
  found_in_pl: string; // "wina czerwone" | "wina białe" | etc
  found_in_en: string;
}

export interface CompassSector {
  id: SectorId;
  name_pl: string;
  name_en: string;
  /** "świeżość" / "tęgość" - adjective form */
  noun_pl: string;
  noun_en: string;
  short_pl: string; // 1-line essence
  short_en: string;
  long_pl: string; // 2-3 paragraphs description
  long_en: string;
  color: string; // hex - used in SVG compass
  tendencje: [Tendencja, Tendencja];
}

// Order matches the canonical Vinocompas wheel (clockwise from 12 o'clock):
// TĘGIE → MIĘKKIE → OLEISTE → ŚWIEŻE → ZIEMISTE → SZORSTKIE, with each
// sector's two tendencje in their on-wheel order. Verified against the
// official vinocompas.pl calculator data (modules/Vinocompas/Client S1/S2).
// The compass renders this array clockwise, so the array order IS the
// visual order — do not re-sort without checking the wheel.
export const COMPASS_SECTORS: CompassSector[] = [
  {
    id: "tegie",
    name_pl: "Tęgie",
    name_en: "Bold",
    noun_pl: "Tęgość",
    noun_en: "Boldness",
    short_pl: "Orientalne, ciepłe, ciężkie, intensywne, gęste i słodkie.",
    short_en: "Oriental, warm, heavy, intense, dense and sweet.",
    long_pl:
      "Tęgość to wrażenie kojarzące się z cierpkością wzbogaconą słodyczą. Przywodzi na myśl wszystko, co ciężkie, ciepłe i intensywne - kawę, czekoladę, tytoń i suszone owoce.",
    long_en:
      "Boldness is the sensation of astringency enriched with sweetness. It calls to mind everything heavy, warm and intense - coffee, chocolate, tobacco and dried fruit.",
    color: "#8a4b2a",
    tendencje: [
      {
        id: "tegie.cigaro",
        name_pl: "Czekolada, kawa, tytoń",
        name_en: "Chocolate, coffee, tobacco",
        shortLabel_pl: "Kawa i czekolada",
        shortLabel_en: "Coffee & chocolate",
        associations_pl: "czekolada, kawa, tytoń, słodkie cygaro",
        associations_en: "chocolate, coffee, tobacco, a sweet cigar",
        examples_pl:
          "Ciężka tendencja, która przywodzi na myśl „klub gentelmena”, „klub golfowy”, „sklep ze słodyczami” czy „sklep z cygarami”. Zwykle w winach czerwonych.",
        examples_en:
          "A weighty tendency that calls to mind a gentlemen's club, a golf clubhouse, an old-fashioned sweet shop or a cigar store. Usually found in red wines.",
        found_in_pl: "wina czerwone (głównie)",
        found_in_en: "red wines (mostly)",
      },
      {
        id: "tegie.suszone",
        name_pl: "Suszone owoce",
        name_en: "Dried fruit",
        shortLabel_pl: "Suszone owoce",
        shortLabel_en: "Dried fruit",
        associations_pl:
          "w czerwonych: wędzone śliwki, suszone śliwki, daktyle, żurawina. W białych: suszona morela, rodzynki, daktyle, jabłka, pomarańcze, banany, orientalne przyprawy",
        associations_en:
          "in reds: smoked plums, prunes, dates, cranberries. In whites: dried apricot, raisins, dates, apples, oranges, bananas, oriental spices",
        examples_pl: "Intensywne wrażenie. To trochę skojarzenie z wigilijnym suszem.",
        examples_en:
          "An intense sensation — think of the dried-fruit compote served on Christmas Eve.",
        found_in_pl: "wina dojrzałe, mocne",
        found_in_en: "mature, powerful wines",
      },
    ],
  },
  {
    id: "miekkie",
    name_pl: "Miękkie",
    name_en: "Soft",
    noun_pl: "Miękkość",
    noun_en: "Softness",
    short_pl: "Skojarzenie z latem i przyjemnościami. Dojrzałe owoce i konfitury.",
    short_en: "Think summer and simple pleasures. Ripe fruit and preserves.",
    long_pl:
      "Miękkość to wrażenie kojarzące się ze słodyczą dopełnioną cierpkością. Przywodzi na myśl dojrzałe owoce, konfitury i wszystko, co łagodne, przyjemne i harmonijne.",
    long_en:
      "Softness is the sensation of sweetness rounded out by astringency. It calls to mind ripe fruit, preserves and everything gentle, pleasant and harmonious.",
    color: "#e74c3c",
    tendencje: [
      {
        id: "miekkie.dojrzale",
        name_pl: "Dojrzałe owoce",
        name_en: "Ripe fruit",
        shortLabel_pl: "Dojrzałe owoce",
        shortLabel_en: "Ripe fruit",
        associations_pl:
          "w czerwonym: śliwki, wiśnie, maliny, jagody, truskawki, jeżyny, figi, porzeczka. W białym: jabłka, gruszki, morele, agrest",
        associations_en:
          "in reds: plums, cherries, raspberries, blueberries, strawberries, blackberries, figs, currants. In whites: apples, pears, apricots, gooseberries",
        examples_pl: "Klasyczne owocowe nuty występujące w młodych, owocowych winach.",
        examples_en: "The classic fruit notes found in young, fruit-forward wines.",
        found_in_pl: "wina czerwone i białe - różne owoce",
        found_in_en: "red and white wines — different fruits in each",
      },
      {
        id: "miekkie.konfitury",
        name_pl: "Konfitury",
        name_en: "Preserves",
        shortLabel_pl: "Konfitury",
        shortLabel_en: "Preserves",
        associations_pl: "konfitury z jabłka, truskawki - owoce upieczone, usmażone, skarmelizowane",
        associations_en:
          "apple or strawberry preserves — fruit that has been baked, stewed or caramelised",
        examples_pl:
          "Konfitury różnią się od dojrzałych owoców intensywnością. Tutaj jabłko czy truskawka są upieczone, usmażone, czy skarmelizowane.",
        examples_en:
          "Preserves differ from ripe fruit in intensity. Here the apple or strawberry has been baked, stewed or caramelised.",
        found_in_pl: "wina dojrzałe, treściwe",
        found_in_en: "mature, full-bodied wines",
      },
    ],
  },
  {
    id: "oleiste",
    name_pl: "Oleiste",
    name_en: "Unctuous",
    noun_pl: "Oleistość",
    noun_en: "Unctuousness",
    short_pl: "Wszystko co gęste, lepkie, słodkie i żywiczne.",
    short_en: "Everything dense, sticky, sweet and resinous.",
    long_pl:
      "Oleistość to wrażenie kojarzące się ze słodyczą wzbogaconą cierpkością. Kojarzy się z gęstością, kremowością, masłem, orzechami i owocami tropikalnymi.",
    long_en:
      "Unctuousness is the sensation of sweetness enriched with astringency. It brings to mind density, creaminess, butter, nuts and tropical fruit.",
    color: "#f4c84a",
    tendencje: [
      {
        id: "oleiste.maslo",
        name_pl: "Masłowość, tostowość, orzechy",
        name_en: "Butter, toast, nuts",
        shortLabel_pl: "Masło i orzechy",
        shortLabel_en: "Butter & nuts",
        associations_pl: "masło, orzechy, tosty, drożdże, ciasteczka maślane, pierniczki",
        associations_en: "butter, nuts, toast, yeast, butter biscuits, gingerbread",
        examples_pl:
          "Różnego rodzaju produkty „tłuste”. Tego rodzaju wrażenia spotykamy w wielu gatunkach win białych jak i czerwonych.",
        examples_en:
          "All manner of \"rich\" flavours. You'll meet these sensations across many white and red wine styles alike.",
        found_in_pl: "wina białe i czerwone",
        found_in_en: "white and red wines",
      },
      {
        id: "oleiste.tropikalne",
        name_pl: "Owoce tropikalne",
        name_en: "Tropical fruit",
        shortLabel_pl: "Owoce tropikalne",
        shortLabel_en: "Tropical fruit",
        associations_pl: "mango, ananas, papaja, marakuja, banan, liczi",
        associations_en: "mango, pineapple, papaya, passion fruit, banana, lychee",
        examples_pl:
          "Oleistość żywiczna, pełnia słodyczy. Te doznania często odnajdziemy w białych winach.",
        examples_en:
          "Resinous unctuousness, sweetness in full. You'll most often find these notes in white wines.",
        found_in_pl: "wina białe (głównie)",
        found_in_en: "white wines (mostly)",
      },
    ],
  },
  {
    id: "swieze",
    name_pl: "Świeże",
    name_en: "Fresh",
    noun_pl: "Świeżość",
    noun_en: "Freshness",
    short_pl: "Wszystko co kwaśne, cierpkie, ale też odświeżające i rześkie. Łatwe skojarzenie to lemoniada albo zielony ogórek.",
    short_en:
      "Everything tart and astringent — yet refreshing and crisp. The easy association: lemonade, or a fresh green cucumber.",
    long_pl:
      "Świeżość to wrażenie kojarzące się z kwasowością złagodzoną słodyczą. Przywodzi na myśl cytrusy, lemoniadę, zielony ogórek i wszystko, co rześkie oraz soczyste.",
    long_en:
      "Freshness is the sensation of acidity softened by sweetness. It calls to mind citrus, lemonade, green cucumber and everything crisp and juicy.",
    color: "#9bc24a",
    tendencje: [
      {
        id: "swieze.zielone",
        name_pl: "Zielone warzywa i owoce",
        name_en: "Green vegetables and fruit",
        shortLabel_pl: "Warzywa",
        shortLabel_en: "Greens",
        associations_pl: "melon, winogrona, seler, ogórek, karczoch, szparagi",
        associations_en: "melon, grapes, celery, cucumber, artichoke, asparagus",
        examples_pl:
          "Te doznania często odnajdziemy w białych winach, warzywne tendencje spotykamy też często w winach czerwonych.",
        examples_en:
          "You'll often find these notes in white wines; vegetal tendencies also appear frequently in reds.",
        found_in_pl: "wina białe (głównie) i czerwone",
        found_in_en: "white wines (mostly) and reds",
      },
      {
        id: "swieze.cytrusy",
        name_pl: "Cytrusy",
        name_en: "Citrus",
        shortLabel_pl: "Cytrusy",
        shortLabel_en: "Citrus",
        associations_pl: "cytryny, grejpfruty, pomarańcze, mandarynki",
        associations_en: "lemons, grapefruit, oranges, mandarins",
        examples_pl: "Tego rodzaju wrażenia spotykamy w wielu gatunkach win białych jak i czerwonych.",
        examples_en:
          "You'll meet these sensations across many white and red wine styles alike.",
        found_in_pl: "wina białe i czerwone",
        found_in_en: "white and red wines",
      },
    ],
  },
  {
    id: "ziemiste",
    name_pl: "Ziemiste",
    name_en: "Earthy",
    noun_pl: "Ziemistość",
    noun_en: "Earthiness",
    short_pl: "Wyobraź sobie, że kładziesz się na ziemi: las, łąka, rzeka, świeża ziemia.",
    short_en:
      "Imagine lying down on the ground: forest, meadow, riverbank, freshly turned earth.",
    long_pl:
      "Ziemistość to wrażenie kojarzące się z kwasowością pogłębioną cierpkością. Kojarzy się z minerałami, lasem, mokrą ziemią i ściółką leśną.",
    long_en:
      "Earthiness is the sensation of acidity deepened by astringency. It brings to mind minerals, forest, damp soil and the forest floor.",
    color: "#2c5d8e",
    tendencje: [
      {
        id: "ziemiste.mineraly",
        name_pl: "Minerały",
        name_en: "Minerals",
        shortLabel_pl: "Minerały",
        shortLabel_en: "Minerals",
        associations_pl:
          "kamienie, rzeka, akweny wodne, woda mineralna - bąbelki na języku, „szczypanie”",
        associations_en:
          "stones, rivers, open water, sparkling mineral water — the prickle of bubbles on the tongue",
        examples_pl: "Pamiętacie jak pachnie morze? Ten zapach też.",
        examples_en: "Remember what the sea smells like? That scent belongs here too.",
        found_in_pl: "wina białe i czerwone",
        found_in_en: "white and red wines",
      },
      {
        id: "ziemiste.sciolka",
        name_pl: "Ściółka leśna",
        name_en: "Forest floor",
        shortLabel_pl: "Ściółka leśna",
        shortLabel_en: "Forest floor",
        associations_pl: "ściółka leśna, ścięta trawa, fiołki, lawenda",
        associations_en: "forest floor, cut grass, violets, lavender",
        examples_pl:
          "Wrażenia kojarzone z lasem, glebą zwykle znajdujemy w winach czerwonych; trawę mamy w białych jak Sauvignon Blanc.",
        examples_en:
          "Notes of forest and soil usually turn up in red wines; the grass belongs to whites like Sauvignon Blanc.",
        found_in_pl: "wina czerwone (las/gleba), białe (trawa)",
        found_in_en: "red wines (forest/soil), whites (grass)",
      },
    ],
  },
  {
    id: "szorstkie",
    name_pl: "Szorstkie",
    name_en: "Grippy",
    noun_pl: "Szorstkość",
    noun_en: "Grip",
    short_pl: "Uczucie cierpkości, suchości na języku. Powąchaj skórę albo kawałek deski.",
    short_en:
      "That astringent, drying feel on the tongue. Smell a piece of leather, or a plank of raw wood.",
    long_pl:
      "Szorstkość to wrażenie kojarzące się z cierpkością podkreśloną kwasowością. Kojarzy się z uczuciem suchości i ściągania oraz skórą, drewnem i cierpkimi owocami.",
    long_en:
      "Grip is the sensation of astringency underscored by acidity. It brings to mind dryness and pucker on the tongue, along with leather, wood and tart fruit.",
    color: "#5a2c5e",
    tendencje: [
      {
        id: "szorstkie.pizmo",
        name_pl: "Piżmo, skóra",
        name_en: "Musk, leather",
        shortLabel_pl: "Piżmo",
        shortLabel_en: "Musk",
        associations_pl: "skojarzenia zwierzęce - zapach mokrego psa, konia, stajni, skóry",
        associations_en:
          "animal associations — the smell of wet dog, horse, stable, leather",
        examples_pl: "Tego rodzaju wrażenia spotykamy w czerwonych winach.",
        examples_en: "You'll meet these sensations in red wines.",
        found_in_pl: "wina czerwone",
        found_in_en: "red wines",
      },
      {
        id: "szorstkie.dab",
        name_pl: "Dąb, dym, garbniki",
        name_en: "Oak, smoke, tannins",
        shortLabel_pl: "Dąb",
        shortLabel_en: "Oak",
        associations_pl:
          "drewno, nieheblowana deska, zapach ogniska, tytoń z papierosa, ściąganie na języku przy cierpkich owocach",
        associations_en:
          "wood, a rough-sawn plank, the smell of a campfire, cigarette tobacco, the pucker that tart fruit leaves on the tongue",
        examples_pl: "Szeroka rodzina wrażeń „szorstkich” i „cierpkich”.",
        examples_en: "A broad family of \"grippy\" and \"astringent\" sensations.",
        found_in_pl: "wina czerwone",
        found_in_en: "red wines",
      },
    ],
  },
];

export interface BaseTasteInfo {
  id: BaseTaste;
  name_pl: string;
  name_en: string;
  description_pl: string;
  description_en: string;
}

// Axis descriptions are the client's round-3 texts (2026-07), verbatim —
// they carry the "wytrawność to proporcje, nie cukier" framing of etap 1.
// EN twins are faithful renderings of the same round-3 texts.
export const BASE_TASTES: BaseTasteInfo[] = [
  {
    id: "slodycz",
    name_pl: "Słodycz",
    name_en: "Sweetness",
    description_pl:
      "Słodycz odpowiada za wrażenie łagodności i pełni. Nie zawsze oznacza dużą ilość cukru - często sprawia po prostu, że wino wydaje się bardziej miękkie i mniej wytrawne. Jej proporcje względem kwasowości i cierpkości wpływają na odbiór wytrawności wina i pomagają budować jego profil smakowy.",
    description_en:
      "Sweetness is responsible for the feeling of gentleness and fullness. It doesn't always mean a lot of sugar - often it simply makes the wine feel softer and less dry. Its proportion to acidity and astringency shapes how dry the wine seems and helps build its taste profile.",
  },
  {
    id: "cierpkosc",
    name_pl: "Cierpkość",
    name_en: "Astringency",
    description_pl:
      "Cierpkość to uczucie delikatnego ściągania i suchości w ustach. Im jest wyższa, tym wino wydaje się bardziej wyraziste, zdecydowane i wytrawne. W połączeniu ze słodyczą i kwasowością buduje profil smakowy wina - to wzajemne proporcje tych trzech smaków decydują o jego charakterze.",
    description_en:
      "Astringency is the feeling of gentle pucker and dryness in the mouth. The higher it is, the more expressive, assertive and dry the wine seems. Together with sweetness and acidity it builds the wine's taste profile - it is the mutual proportions of these three tastes that decide its character.",
  },
  {
    id: "kwasowosc",
    name_pl: "Kwasowość",
    name_en: "Acidity",
    description_pl:
      "Kwasowość nadaje winu świeżość, lekkość i energię. To dzięki niej wino wydaje się bardziej rześkie, soczyste, a często również bardziej wytrawne. W połączeniu ze słodyczą i cierpkością wpływa na profil smakowy wina, nadając mu charakter i równowagę.",
    description_en:
      "Acidity gives a wine freshness, lightness and energy. It is what makes a wine feel crisper and juicier - and often drier too. Together with sweetness and astringency it shapes the wine's taste profile, lending it character and balance.",
  },
];

export interface MethodStep {
  id: string;
  title_pl: string;
  title_en: string;
  body_pl: string;
  body_en: string;
}

export const METHOD_STEPS: MethodStep[] = [
  {
    id: "wzrok",
    title_pl: "Wzrok",
    title_en: "Sight",
    body_pl:
      "Spójrz na wino: jaki ma kolor (głębia, intensywność), gęstość (czy spływa po szkle wolno czy szybko), czy jest spokojne czy musujące?",
    body_en:
      "Look at the wine: what colour is it (depth, intensity)? How viscous — do the legs run down the glass slowly or quickly? Is it still or sparkling?",
  },
  {
    id: "dotyk",
    title_pl: "Dotyk (w ustach)",
    title_en: "Touch (in the mouth)",
    body_pl:
      "Zwróć uwagę na gęstość i konsystencję - czy wino jest lekkie i wodniste, czy gęste i oleiste?",
    body_en:
      "Pay attention to body and texture — is the wine light and watery, or dense and unctuous?",
  },
  {
    id: "zapach",
    title_pl: "Zapach - bez nosa i z nosem",
    title_en: "Smell — nose pinched, then open",
    body_pl:
      "Tutaj robi się ciekawie. Najpierw zatkaj nos i wypij łyk - to oddaje czysty smak (słodycz, cierpkość, kwasowość). Potem otwórz nos i powąchaj - wszystkie wrażenia z 6 sektorów kompasu pojawią się w nosie.",
    body_en:
      "This is where it gets interesting. First pinch your nose and take a sip — that gives you pure taste (sweetness, astringency, acidity). Then release your nose and smell — all six sensations of the compass will arrive through the nose.",
  },
  {
    id: "smak",
    title_pl: "Smak",
    title_en: "Taste",
    body_pl:
      "Gdyby wino składało się tylko ze smaku, mówilibyśmy że wyczuwamy w nim: słodycz, cierpkość lub kwasowość. To są 3 podstawowe wrażenia smakowe - niezależne od 6 wrażeń aromatycznych z kompasu.",
    body_en:
      "If wine were made of taste alone, all we could say is that we detect sweetness, astringency or acidity. These are the 3 base tastes — independent of the compass's 6 aromatic sensations.",
  },
  {
    id: "kompas",
    title_pl: "Ułóż na kompasie",
    title_en: "Plot it on the compass",
    body_pl:
      "Każde z 6 wrażeń (świeże, oleiste, miękkie, tęgie, szorstkie, ziemiste) ma 2 tendencje. Zaznacz na kompasie intensywność każdej tendencji (od 0 do 5). To jest twój profil smaku tego wina.",
    body_en:
      "Each of the 6 sensations (fresh, unctuous, soft, bold, grippy, earthy) has 2 tendencies. Mark the intensity of each tendency on the compass (from 0 to 5). That is your taste profile of this wine.",
  },
  {
    id: "porownaj",
    title_pl: "Porównaj wina",
    title_en: "Compare wines",
    body_pl:
      "Zakręć kieliszkiem, powąchaj, spróbuj win, powąchaj jeszcze raz. Na podstawie znanych już wrażeń i tendencji opisz wina i to, czym się różnią. Stwórz własny Vinokompas i znajdź wina, które naprawdę lubisz.",
    body_en:
      "Swirl the glass, nose it, taste the wines, nose them again. Using the sensations and tendencies you now know, describe the wines and how they differ. Build your own Vinocompas and find the wines you truly love.",
  },
];

export interface FAQItem {
  q_pl: string;
  q_en: string;
  a_pl: string;
  a_en: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    q_pl: "Co to jest Vinokompas?",
    q_en: "What is Vinocompas?",
    a_pl:
      "To system opisu wina oparty na 6 wrażeniach zmysłowych (świeże, oleiste, miękkie, tęgie, szorstkie, ziemiste) i 3 podstawowych smakach (słodycz, cierpkość, kwasowość). Każde wrażenie ma 2 tendencje. Po zaznaczeniu intensywności każdej tendencji otrzymujesz unikalny profil smakowy wina - i możesz szukać innych win do niego podobnych.",
    a_en:
      "It's a system for describing wine built on 6 sensory sensations (fresh, unctuous, soft, bold, grippy, earthy) and 3 base tastes (sweetness, astringency, acidity). Each sensation has 2 tendencies. Once you've marked the intensity of each tendency, you get a unique taste profile of the wine — and you can go looking for other wines that resemble it.",
  },
  {
    q_pl: "Co to jest tendencja?",
    q_en: "What is a tendency?",
    a_pl:
      "Tendencja to skojarzenie, które przeważa w danym wrażeniu. Na przykład wrażenie „świeże” ma 2 tendencje: cytrusy i zielone warzywa/owoce. Każde wrażenie ma 2 wyraźne tendencje - to cała filozofia.",
    a_en:
      "A tendency is the association that dominates within a given sensation. The \"fresh\" sensation, for instance, has 2 tendencies: citrus and green vegetables/fruit. Every sensation has 2 distinct tendencies — that's the whole philosophy.",
  },
  {
    q_pl: "Jak rozróżnić wrażenia od tendencji?",
    q_en: "How do I tell sensations from tendencies?",
    a_pl:
      "Wrażenie to ogólna kategoria (np. „świeże”). Tendencja to konkretne skojarzenie wewnątrz tej kategorii (np. „cytrusy” albo „zielone warzywa”). Jedno wino może być świeże w stronę cytrusów (jak Riesling), inne świeże w stronę zielonych warzyw (jak Sauvignon Blanc).",
    a_en:
      "A sensation is the broad category (e.g. \"fresh\"). A tendency is the specific association inside that category (e.g. \"citrus\" or \"green vegetables\"). One wine can be fresh leaning towards citrus (like a Riesling), another fresh leaning towards green vegetables (like a Sauvignon Blanc).",
  },
  {
    q_pl: "Co znaczy „cierpkość”?",
    q_en: "What does \"astringency\" mean?",
    a_pl:
      "Cierpkość to uczucie ściągania na języku. W czerwonych winach pochodzi głównie od garbników (tanin) zawartych w skórkach winogron i drewnie beczki. Pomyśl o aronii albo czarnej porzeczce - aż ściąga buzię.",
    a_en:
      "Astringency is that puckering, drying grip on the tongue. In red wines it comes mainly from the tannins in grape skins and barrel wood. Think of chokeberries or blackcurrants — the way they pull your mouth tight.",
  },
  {
    q_pl: "Czym różni się „świeże” od „oleiste”?",
    q_en: "What's the difference between \"fresh\" and \"unctuous\"?",
    a_pl:
      "Świeże wino jest kwaśne, rześkie, lekkie - jak lemoniada. Oleiste wino jest gęste, lepkie, słodkie - jak masło, orzechy, mango. Świeże orzeźwia, oleiste otula. Można też mieć wino które jednocześnie świeże i lekko oleiste - wtedy zaznacz oba sektory na kompasie z różną intensywnością.",
    a_en:
      "A fresh wine is tart, crisp, light — like lemonade. An unctuous wine is dense, sticky, sweet — think butter, nuts, mango. Fresh refreshes; unctuous envelops. A wine can also be fresh and lightly unctuous at once — in that case mark both sensations on the compass at different intensities.",
  },
  {
    q_pl: "Czym różni się „miękkie” od „tęgie”?",
    q_en: "What's the difference between \"soft\" and \"bold\"?",
    a_pl:
      "Miękkie to dojrzałe owoce i konfitury - letnie, przyjemne, owocowe. Tęgie to czekolada, kawa, tytoń i suszone owoce - orientalne, ciężkie, intensywne. Wino miękkie pijemy łatwo, wino tęgie wymaga uwagi i często długiego oddychania w karafce.",
    a_en:
      "Soft means ripe fruit and preserves — summery, easy, fruit-driven. Bold means chocolate, coffee, tobacco and dried fruit — oriental, heavy, intense. A soft wine drinks easily; a bold wine demands attention, and often a long breathe in the decanter.",
  },
  {
    q_pl: "Czym różni się „szorstkie” od „ziemiste”?",
    q_en: "What's the difference between \"grippy\" and \"earthy\"?",
    a_pl:
      "Szorstkie to wrażenie cierpkości, suchości - piżmo, skóra, dąb, dym, garbniki. Ziemiste to wrażenie ziemi, lasu, minerałów. Szorstkie wina mają taniny i drewno; ziemiste mają nuty terroir - kamienia, ściółki leśnej, kwiatów polnych.",
    a_en:
      "Grippy is the sensation of astringency and dryness — musk, leather, oak, smoke, tannins. Earthy is the sensation of soil, forest and minerals. Grippy wines carry tannin and wood; earthy wines carry notes of terroir — stone, forest floor, wildflowers.",
  },
  {
    q_pl: "Jakie wino dla kogoś kto lubi tytoń i kawę?",
    q_en: "Which wine for someone who loves tobacco and coffee?",
    a_pl:
      "Szukaj wina z wysokim wskaźnikiem w sektorze „tęgie” (tendencja czekolada/kawa/tytoń) i często też „szorstkie” (dąb, garbniki). To zwykle dojrzałe czerwone wina z beczki: Cabernet Sauvignon, Brunello di Montalcino, Tignanello, Vega Sicilia, Chateauneuf-du-Pape.",
    a_en:
      "Look for a wine scoring high in the \"bold\" sensation (the chocolate/coffee/tobacco tendency), and often \"grippy\" too (oak, tannins). That usually means mature, barrel-aged reds: Cabernet Sauvignon, Brunello di Montalcino, Tignanello, Vega Sicilia, Châteauneuf-du-Pape.",
  },
  {
    q_pl: "Jakie wino dla kogoś kto lubi cytrusy?",
    q_en: "Which wine for someone who loves citrus?",
    a_pl:
      "Szukaj wina z wysokim wskaźnikiem w sektorze „świeże” (tendencja cytrusy). Klasyki to Riesling z Alzacji albo Mozeli, Sauvignon Blanc z Loary lub Nowej Zelandii (Cloudy Bay), Albarino z Galicji, Chablis z Burgundii.",
    a_en:
      "Look for a wine scoring high in the \"fresh\" sensation (the citrus tendency). The classics: Riesling from Alsace or the Mosel, Sauvignon Blanc from the Loire or New Zealand (Cloudy Bay), Albariño from Galicia, Chablis from Burgundy.",
  },
  {
    q_pl: "Jakie wino dla kogoś kto lubi czekoladę?",
    q_en: "Which wine for someone who loves chocolate?",
    a_pl:
      "Sektor „tęgie” (czekolada, kawa, tytoń) - pełne czerwone z dębem. Też dobrze będą wina deserowe ze strony „miękkie/konfitury”: Banyuls, Maury, Porto LBV, Recioto della Valpolicella.",
    a_en:
      "The \"bold\" sensation (chocolate, coffee, tobacco) — full-bodied, oaked reds. Dessert wines from the \"soft/preserves\" side work beautifully too: Banyuls, Maury, LBV Port, Recioto della Valpolicella.",
  },
  {
    q_pl: "Jak korzystać z kompasu w restauracji?",
    q_en: "How do I use the compass in a restaurant?",
    a_pl:
      "1) Powiedz kelnerowi swój profil smaku (np. „lubię świeże cytrusowe” albo „lubię tęgie z kawą”). 2) Albo zeskanuj QR Cellar Compass w restauracji - wybierz danie, system pokaże top-3 wina pasujące do dania, z uzasadnieniem. Działa też w drugą stronę: wybierz wino, system zaproponuje dania.",
    a_en:
      "1) Tell the waiter your taste profile (e.g. \"I like fresh and citrusy\" or \"I like bold with coffee\"). 2) Or scan the Cellar Compass QR code at the restaurant — pick a dish, and the system shows the top-3 wines for it, with the reasoning. It works the other way round too: pick a wine, and the system suggests dishes.",
  },
  {
    q_pl: "Czy każde wino ma wszystkie 6 wrażeń?",
    q_en: "Does every wine have all 6 sensations?",
    a_pl:
      "Każde wino ma jakąś obecność każdego z 6 wrażeń - ale często z bardzo różną intensywnością. Sauvignon Blanc będzie mocno w „świeże” (cytrusy, zielone) i prawie zero w „tęgie”. Zinfandel z USA - odwrotnie: mocno „tęgie” (suszone owoce), „miękkie” (konfitury), „szorstkie” (dąb).",
    a_en:
      "Every wine carries some presence of all 6 sensations — but often at very different intensities. A Sauvignon Blanc will run high in \"fresh\" (citrus, green) and near zero in \"bold\". A Zinfandel from the USA is the opposite: strongly \"bold\" (dried fruit), \"soft\" (preserves) and \"grippy\" (oak).",
  },
  {
    q_pl: "Czy mam degustować z zatkanym nosem?",
    q_en: "Should I really taste with my nose pinched?",
    a_pl:
      "Tak, na początku - to świetny trening. Gdy zatkaniesz nos, wino pokazuje tylko swoje 3 podstawowe smaki: słodycz, cierpkość, kwasowość. Gdy otworzysz nos - eksploduje aromatami z 6 sektorów kompasu. To pokazuje jak nos i język grają w pary.",
    a_en:
      "Yes, at first — it's excellent training. With your nose pinched, a wine shows only its 3 base tastes: sweetness, astringency, acidity. Release your nose — and it explodes with aromas from the compass's 6 sensations. It shows you how nose and tongue play as a pair.",
  },
  {
    q_pl: "Co znaczy moja kombinacja na kompasie?",
    q_en: "What does my combination on the compass mean?",
    a_pl:
      "Twój kompas to twój profil smaku. Im wyższe „świeże/cytrusy” tym częściej szukaj win cytrusowych. Im wyższe „tęgie/cigaro” tym mocniej idź w wina dojrzałe z beczką. Cellar Compass dopasowuje wina z menu restauracji właśnie pod taki profil - albo pod profil dania.",
    a_en:
      "Your compass is your taste profile. The higher your \"fresh/citrus\", the more you should seek out citrus-driven wines. The higher your \"bold/cigar\", the harder you should lean into mature, barrel-aged wines. Cellar Compass matches wines from the restaurant's list to exactly that profile — or to the profile of a dish.",
  },
];

/**
 * Compact KB for the chat system prompt - full context but trimmed
 * formatting. ~3-4 KB. Generated as a string at runtime to keep build
 * fast and to allow the prompt to evolve without regenerating types.
 */
export function buildChatSystemPrompt(lang: CompassLang = "pl"): string {
  const sectors = COMPASS_SECTORS.map((s) => {
    const [t1, t2] = s.tendencje;
    return `## ${s.name_pl}\n${s.short_pl}\nTendencje:\n  1) ${t1.name_pl} - ${t1.associations_pl}. (${t1.found_in_pl})\n  2) ${t2.name_pl} - ${t2.associations_pl}. (${t2.found_in_pl})`;
  }).join("\n\n");

  const tastes = BASE_TASTES.map((b) => `- ${b.name_pl}: ${b.description_pl}`).join("\n");

  const method = METHOD_STEPS.map((m) => `### ${m.title_pl}\n${m.body_pl}`).join("\n\n");

  return `Jesteś sommelierem-przewodnikiem po metodzie Vinokompas (autorka: Magdalena Surgiel-Czyż / parfumealavin / vinocompas.pl). Tłumaczysz początkującym jak opisywać i wybierać wino używając 6 wrażeń i 3 podstawowych smaków.

# DOZWOLONE TEMATY (i tylko te)
- Wino: smak, profil, region, gatunek, łączenie z jedzeniem, serwis (temperatura, dekantacja).
- Metoda Vinokompas: wrażenia, tendencje, smaki bazowe, jak je rozpoznać.
- Jedzenie w kontekście dopasowania do wina (smak dania, tekstura, sos).
- Restauracje, menu, kultura stołu, rytuał degustacji.
- Aplikacja Vinovigator AI: jak działa, jak skanować QR, jak czytać sugestie.

# ZAKAZANE TEMATY - odmów uprzejmie i przekieruj na wino
- Programowanie, kod, IT, debugowanie, dane techniczne.
- Matematyka, fizyka, finansowe porady, polityka, religia.
- Pogoda, nowinki, sport, celebryci, generator tekstu.
- Cokolwiek niezwiązanego z winem, jedzeniem, smakiem lub aplikacją.
Jeśli pytanie wykracza poza te tematy - odpowiedz dokładnie tak (nie inaczej):
„Jestem przewodnikiem Vinokompasu - odpowiadam tylko o winie, smaku i połączeniach z jedzeniem. Może spytasz mnie o ulubione wino albo o danie, do którego szukasz pary?"
Nie próbuj odpowiadać częściowo. Nie tłumacz dlaczego nie odpowiadasz. Nie cytuj zakazanego pytania.

# Zasady odpowiedzi (gdy temat jest dozwolony)
- ${lang === "en" ? "Zawsze odpowiadasz po ANGIELSKU (the user is on the English site - reply in natural English, keep the Polish sensation names in parentheses on first use)." : "Zawsze odpowiadasz po polsku."}
- Krótko, ciepło, jak rozmowa przy lampce wina, nie jak wykład.
- Maksymalnie 4-5 zdań na odpowiedź. Bez bullet-list, jeśli nie ma 3+ punktów.
- Używaj nazw wrażeń i tendencji z poniższej bazy (NIE wymyślaj nowych nazw).
- Gdy użytkownik pyta o konkretne wino - odpowiadaj na bazie ogólnej wiedzy + zaproś do skanu QR w restauracji żeby dostać konkretną rekomendację z karty.
- NIE nazywaj się modelem, AI ani GPT. Jesteś „przewodnikiem Vinokompasu".

# 6 wrażeń (sektorów kompasu)

${sectors}

# 3 podstawowe smaki (mierzone osobno)

${tastes}

# Metoda degustacji

${method}

# Kontekst produktu Cellar Compass
Cellar Compass to demo aplikacja dla restauracji: gość skanuje QR przy stoliku, wybiera danie z menu, system pokazuje top-3 win z uzasadnieniem (chat-bot odpowiada „dlaczego to wino pasuje”). Działa w obie strony - gość może wybrać wino, system zaproponuje dania. Twoja rola w aplikacji: nauczyciel metody Vinokompas, który pomoże użytkownikowi zrozumieć własny profil smaku i lepiej rozumieć rekomendacje. Kieruj rozmowę w stronę jasnych, konkretnych przykładów - pomagaj użytkownikowi nazwać własne preferencje słowami z metody.`;
}
