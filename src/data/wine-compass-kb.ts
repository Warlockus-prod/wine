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
  /** Pełny opis tendencji - the client's immersive scene text (doc
   *  "vinocompas system", 2026-07-21). Shown in the guide card's
   *  "Pełny opis tendencji" collapsible. */
  description_pl: string;
  description_en: string;
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
        name_pl: "Kawa i czekolada",
        name_en: "Coffee & chocolate",
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
        description_pl:
          "To grupa skojarzeń wrażenia Tęgości, która zabiera Cię do eleganckiego klubu dżentelmena. Siadasz w głębokim, skórzanym fotelu. W dłoni trzymasz filiżankę świeżo zaparzonego espresso, obok leży kostka gorzkiej czekolady, a w powietrzu unosi się delikatny aromat cygara i starego drewna. Wszystko jest spokojne, ciężkie, dostojne i pełne klasy. Właśnie taki klimat najlepiej oddaje ten kierunek Tęgości.",
        description_en:
          "A group of associations of the Boldness sensation that takes you to an elegant gentlemen's club. You sink into a deep leather armchair. In your hand a cup of freshly brewed espresso; beside it a square of dark chocolate, and the air carries a faint aroma of cigar and old wood. Everything is calm, heavy, dignified and full of class. That is the climate this direction of Boldness captures best.",
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
        description_pl:
          "To grupa skojarzeń wrażenia Tęgości, która przenosi Cię na orientalny targ pełen przypraw i suszonych owoców. Wokół piętrzą się figi, daktyle, rodzynki i suszone śliwki, a w powietrzu unosi się zapach cynamonu, goździków i kardamonu. Jest ciepło, intensywnie i niemal duszno od bogactwa aromatów. To drugi kierunek Tęgości – równie głęboki i skoncentrowany, ale bardziej korzenny i owocowy.",
        description_en:
          "A group of associations of the Boldness sensation that carries you to an oriental market piled with spices and dried fruit. Figs, dates, raisins and dried plums tower around you, and the air smells of cinnamon, cloves and cardamom. It is warm, intense and almost heady with the richness of aromas. This is the second direction of Boldness – just as deep and concentrated, but more spicy and fruity.",
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
        description_pl:
          "To grupa skojarzeń wrażenia Miękkości, która przenosi Cię do sadu na początku lata. Sięgasz po dojrzałą brzoskwinię lub gruszkę zerwaną prosto z drzewa. Owoce są soczyste, słodkie i delikatne, a ich miąższ niemal rozpływa się w ustach. Wszystko jest lekkie, harmonijne i naturalnie przyjemne. Tak właśnie objawia się najbardziej świeże oblicze Miękkości.",
        description_en:
          "A group of associations of the Softness sensation that takes you to an orchard at the start of summer. You reach for a ripe peach or a pear picked straight from the tree. The fruit is juicy, sweet and delicate, its flesh all but melting in the mouth. Everything is light, harmonious and naturally pleasant. That is the freshest face of Softness.",
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
        description_pl:
          "To grupa skojarzeń wrażenia Miękkości, która przenosi Cię do domu pod koniec lata. W piekarniku rumieni się ciasto z owocami, a na kuchence powoli gotują się domowe konfitury. Owoce są nadal miękkie i słodkie, ale bardziej otulające, ciepłe i skoncentrowane. To spokojniejsze, bardziej domowe oblicze Miękkości.",
        description_en:
          "A group of associations of the Softness sensation that brings you home at the end of summer. A fruit cake is browning in the oven while homemade preserves simmer slowly on the stove. The fruit is still soft and sweet, but more enveloping, warm and concentrated. This is the calmer, more homely face of Softness.",
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
        name_pl: "Masło i orzechy",
        name_en: "Butter & nuts",
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
        description_pl:
          "To grupa skojarzeń wrażenia Oleistości, która zabiera Cię do piekarni o poranku. Pachnie świeżą chałką, ciepłym masłem, maślanymi rogalikami i prażonymi orzechami. Wszystko wydaje się kremowe, aksamitne i otulające. Tak właśnie objawia się najbardziej maślane i eleganckie oblicze Oleistości.",
        description_en:
          "A group of associations of the Unctuousness sensation that takes you to a bakery in the morning. It smells of fresh challah, warm butter, buttery croissants and roasted nuts. Everything feels creamy, velvety and enveloping. That is the most buttery, elegant face of Unctuousness.",
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
        description_pl:
          "To grupa skojarzeń wrażenia Oleistości, która przenosi Cię na tropikalną wyspę. Na stole leżą soczyste mango, ananas, marakuja i papaja. Powietrze jest ciepłe, a owoce pełne egzotycznej słodyczy i soczystości. To bardziej egzotyczna, bogata i słoneczna odsłona Oleistości.",
        description_en:
          "A group of associations of the Unctuousness sensation that carries you to a tropical island. On the table lie juicy mango, pineapple, passion fruit and papaya. The air is warm and the fruit full of exotic sweetness and juiciness. This is the more exotic, rich and sunny face of Unctuousness.",
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
        name_pl: "Warzywa",
        name_en: "Vegetables",
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
        description_pl:
          "To grupa skojarzeń wrażenia Świeżości, która przenosi Cię do letniego ogrodu. Kroisz chrupiącego ogórka, zieloną paprykę i świeże zioła, a obok stoi szklanka domowej lemoniady ogórkowej. Wszystko jest lekkie, zielone i pełne naturalnej świeżości. To spokojniejsze i bardziej roślinne oblicze Świeżości.",
        description_en:
          "A group of associations of the Freshness sensation that takes you to a summer garden. You slice a crunchy cucumber, green pepper and fresh herbs, with a glass of homemade cucumber lemonade standing nearby. Everything is light, green and full of natural freshness. This is the calmer, more botanical face of Freshness.",
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
        description_pl:
          "To grupa skojarzeń wrażenia Świeżości, która zabiera Cię na taras w upalne popołudnie. W dłoni trzymasz szklankę lodowatej lemoniady z cytryny, limonki i grejpfruta. Każdy łyk przynosi przyjemne orzeźwienie i przypływ energii. To najbardziej rześka, soczysta i pobudzająca odsłona Świeżości.",
        description_en:
          "A group of associations of the Freshness sensation that takes you to a terrace on a hot afternoon. In your hand a glass of ice-cold lemonade of lemon, lime and grapefruit. Every sip brings pleasant refreshment and a surge of energy. This is the briskest, juiciest, most invigorating face of Freshness.",
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
        description_pl:
          "To grupa skojarzeń wrażenia Ziemistości, która przenosi Cię na skaliste wybrzeże tuż po deszczu. Czujesz wilgoć kamieni, słoną bryzę, zapach skał i morskiego powietrza. Wszystko jest spokojne, surowe i niezwykle czyste. To chłodniejsze i bardziej mineralne oblicze Ziemistości.",
        description_en:
          "A group of associations of the Earthiness sensation that carries you to a rocky coastline just after rain. You sense the dampness of stones, the salty breeze, the smell of rock and sea air. Everything is calm, raw and remarkably clean. This is the cooler, more mineral face of Earthiness.",
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
        description_pl:
          "To grupa skojarzeń wrażenia Ziemistości, która zabiera Cię na spacer przez las. Pod stopami miękka ściółka, wokół mech, szyszki, grzyby i wilgotna ziemia. Powietrze pachnie naturą, spokojem i lasem po deszczu. To cieplejsze i bardziej naturalne oblicze Ziemistości.",
        description_en:
          "A group of associations of the Earthiness sensation that takes you on a walk through the forest. Soft litter underfoot; moss, pine cones, mushrooms and damp earth all around. The air smells of nature, calm and woodland after rain. This is the warmer, more natural face of Earthiness.",
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
        name_pl: "Piżmo i skóra",
        name_en: "Musk & leather",
        shortLabel_pl: "Piżmo i skóra",
        shortLabel_en: "Musk & leather",
        associations_pl: "skojarzenia zwierzęce - zapach mokrego psa, konia, stajni, skóry",
        associations_en:
          "animal associations — the smell of wet dog, horse, stable, leather",
        examples_pl: "Tego rodzaju wrażenia spotykamy w czerwonych winach.",
        examples_en: "You'll meet these sensations in red wines.",
        found_in_pl: "wina czerwone",
        found_in_en: "red wines",
        description_pl:
          "To grupa skojarzeń wrażenia Szorstkości, która przenosi Cię do starej stajni lub pracowni rymarskiej. Wokół pachnie naturalną skórą, stodołą i końskim siodłem. To świat surowy, dziki i autentyczny, w którym wszystko ma wyraźny charakter. Tak objawia się bardziej zwierzęca odsłona Szorstkości.",
        description_en:
          "A group of associations of the Grippiness sensation that carries you to an old stable or a saddler's workshop. It smells of natural leather, barn and horse saddle. It is a raw, wild, authentic world where everything has a distinct character. That is the more animal face of Grippiness.",
      },
      {
        id: "szorstkie.dab",
        name_pl: "Dąb i dym",
        name_en: "Oak & smoke",
        shortLabel_pl: "Dąb i dym",
        shortLabel_en: "Oak & smoke",
        associations_pl:
          "drewno, nieheblowana deska, zapach ogniska, tytoń z papierosa, ściąganie na języku przy cierpkich owocach",
        associations_en:
          "wood, a rough-sawn plank, the smell of a campfire, cigarette tobacco, the pucker that tart fruit leaves on the tongue",
        examples_pl: "Szeroka rodzina wrażeń „szorstkich” i „cierpkich”.",
        examples_en: "A broad family of \"grippy\" and \"astringent\" sensations.",
        found_in_pl: "wina czerwone",
        found_in_en: "red wines",
        description_pl:
          "To grupa skojarzeń wrażenia Szorstkości, która zabiera Cię do dębowego lasu, gdzie płonie niewielkie ognisko. W powietrzu unosi się zapach dymu, drewna, pieprzu i beczki. Wszystko jest wytrawne, zdecydowane i szlachetne. To bardziej drzewna i przyprawowa odsłona Szorstkości.",
        description_en:
          "A group of associations of the Grippiness sensation that takes you to an oak forest where a small campfire burns. The air carries smoke, wood, pepper and barrel. Everything is dry, resolute and noble. This is the more woody, spicy face of Grippiness.",
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
    id: "obejrzyj",
    title_pl: "Obejrzyj wino",
    title_en: "Look at the wine",
    body_pl:
      "Spójrz na jego kolor, intensywność i przejrzystość. Delikatnie zakręć kieliszkiem i obserwuj, jak spływa po ściankach. Już na tym etapie wino zdradza wiele o swoim stylu.",
    body_en:
      "Study its colour, intensity and clarity. Swirl the glass gently and watch how the wine runs down the sides. Even at this stage a wine reveals a lot about its style.",
  },
  {
    id: "powachaj",
    title_pl: "Powąchaj wino",
    title_en: "Smell the wine",
    body_pl:
      "Najpierw delikatnie zakręć kieliszkiem i wykonaj krótki wdech. Następnie zakręć nim ponownie i poświęć aromatom więcej czasu. Nie próbuj od razu ich nazywać – po prostu je zapamiętaj.",
    body_en:
      "First swirl the glass gently and take a short sniff. Then swirl it again and give the aromas more time. Don't try to name them straight away – simply remember them.",
  },
  {
    id: "sprobuj",
    title_pl: "Spróbuj",
    title_en: "Take a sip",
    body_pl:
      "Weź pierwszy łyk i pozwól winu rozlać się po całych ustach. Dopiero teraz rozpoczyna się analiza metodą Vinocompas.",
    body_en:
      "Take the first sip and let the wine spread across your whole mouth. Only now does the Vinocompas analysis begin.",
  },
  {
    id: "okresl-smak",
    title_pl: "Określ smak",
    title_en: "Set the taste",
    body_pl:
      "Zaznacz intensywność słodyczy, kwasowości i cierpkości. To trzy podstawowe odczucia, które wpływają na odbiór wytrawności i stanowią fundament Twojego profilu.",
    body_en:
      "Mark the intensity of sweetness, acidity and astringency. These are the three basic perceptions that shape how dry a wine seems and form the foundation of your profile.",
  },
  {
    id: "odkryj-wrazenia",
    title_pl: "Odkryj wrażenia",
    title_en: "Discover the sensations",
    body_pl:
      "Na podstawie wybranego smaku określ intensywność sześciu wrażeń: Tęgości, Szorstkości, Miękkości, Oleistości, Świeżości i Ziemistości. To one opisują charakter wina znacznie dokładniej niż sam podział na wytrawne czy słodkie.",
    body_en:
      "Based on the taste you've set, mark the intensity of the six sensations: Boldness, Grippiness, Softness, Unctuousness, Freshness and Earthiness. They describe a wine's character far more precisely than a simple dry-or-sweet divide.",
  },
  {
    id: "doprecyzuj-tendencje",
    title_pl: "Doprecyzuj tendencje",
    title_en: "Fine-tune the tendencies",
    body_pl:
      "Każde wrażenie rozwija się w dwóch kierunkach. Wybierz tendencje, które najlepiej opisują Twoje skojarzenia z degustowanym winem.",
    body_en:
      "Each sensation develops in two directions. Choose the tendencies that best describe your associations with the wine you're tasting.",
  },
  {
    id: "profil-wina",
    title_pl: "Zobacz profil wina",
    title_en: "See the wine's profile",
    body_pl:
      "Po zaznaczeniu smaków, wrażeń i tendencji Vinocompas tworzy pełny profil degustowanego wina. Dzięki temu możesz łatwo porównywać je z innymi.",
    body_en:
      "Once tastes, sensations and tendencies are set, Vinocompas builds a full profile of the wine you're tasting. That makes it easy to compare it with others.",
  },
  {
    id: "podobne-wina",
    title_pl: "Odkrywaj podobne wina",
    title_en: "Discover similar wines",
    body_pl:
      "Na podstawie stworzonego profilu Vinocompas wyszukuje wina o najbardziej zbliżonym charakterze. Dzięki temu łatwiej znajdziesz kolejne etykiety, które odpowiadają Twojemu winiarskiemu gustowi.",
    body_en:
      "Based on the profile you've created, Vinocompas searches for wines with the closest character. That makes it easier to find more labels that match your taste in wine.",
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
    q_pl: "Czym jest Vinocompas?",
    q_en: "What is Vinocompas?",
    a_pl:
      "Vinocompas to metoda opisywania i porównywania win oparta na tym, jak je odbieramy. Zamiast skupiać się wyłącznie na szczepach, regionach czy ocenach ekspertów, pomaga zrozumieć charakter wina i odkryć własny winiarski gust. Dzięki temu łatwiej znajdziesz kolejne wina, które naprawdę będą Ci smakować.",
    a_en:
      "Vinocompas is a method of describing and comparing wines based on how we experience them. Rather than focusing solely on grape varieties, regions or expert scores, it helps you understand a wine's character and discover your own taste in wine. That makes it easier to find more wines you will genuinely enjoy.",
  },
  {
    q_pl: "Jak działa Vinocompas?",
    q_en: "How does Vinocompas work?",
    a_pl:
      "Vinocompas prowadzi Cię przez trzy etapy. Najpierw określasz trzy podstawowe smaki: słodycz, kwasowość i cierpkość. Następnie opisujesz sześć wrażeń, które budują charakter wina. Na końcu wybierasz tendencje – obrazy i skojarzenia najlepiej oddające jego styl. Na podstawie Twojego winiarskiego gustu Vinocompas znajduje wina o najbardziej zbliżonym charakterze.",
    a_en:
      "Vinocompas takes you through three stages. First you set the three base tastes: sweetness, acidity and astringency. Then you describe the six sensations that build a wine's character. Finally you choose tendencies – the images and associations that best capture its style. Based on your taste in wine, Vinocompas then finds wines with the closest character.",
  },
  {
    q_pl: "Co oznacza mój winiarski gust?",
    q_en: "What does my taste in wine mean?",
    a_pl:
      "Twój winiarski gust pokazuje, jakie smaki, wrażenia i tendencje najbardziej odpowiadają winom, które lubisz. Nie ocenia, czy wino jest lepsze lub gorsze – opisuje jego charakter i porównuje go z tysiącami innych win, aby znaleźć te najlepiej dopasowane do Twoich preferencji.",
    a_en:
      "Your taste in wine shows which tastes, sensations and tendencies best match the wines you love. It doesn't judge whether a wine is better or worse – it describes its character and compares it with thousands of other wines to find those best matched to your preferences.",
  },
  {
    q_pl: "Czym różni się smak od wrażenia?",
    q_en: "What's the difference between a taste and a sensation?",
    a_pl:
      "Smak to to, co odczuwamy najbardziej bezpośrednio – słodycz, kwasowość i cierpkość. Wrażenie powstaje z ich wzajemnego połączenia. To ono opisuje charakter wina, dlatego dwa równie wytrawne wina mogą sprawiać zupełnie inne wrażenie.",
    a_en:
      "Taste is what we perceive most directly – sweetness, acidity and astringency. A sensation arises from their interplay. It is what describes a wine's character, which is why two equally dry wines can leave completely different impressions.",
  },
  {
    q_pl: "Czym różni się wrażenie od tendencji?",
    q_en: "What's the difference between a sensation and a tendency?",
    a_pl:
      "Wrażenie opisuje charakter wina. Tendencja rozwija dane wrażenie w jednym z dwóch kierunków. To grupa skojarzeń i obrazów, które pomagają łatwiej zrozumieć, zapamiętać i rozpoznać charakter wina.",
    a_en:
      "A sensation describes a wine's character. A tendency develops that sensation in one of two directions. It is a group of associations and images that make a wine's character easier to understand, remember and recognise.",
  },
  {
    q_pl: "Co oznacza cierpkość?",
    q_en: "What does astringency mean?",
    a_pl:
      "Cierpkość to uczucie delikatnego ściągania i suchości w ustach. Możesz je znać z mocnej czarnej herbaty, kakao lub skórki orzecha włoskiego. To właśnie ona odpowiada za strukturę i zdecydowany charakter wielu win, szczególnie czerwonych.",
    a_en:
      "Astringency is the feeling of gentle puckering and dryness in the mouth. You may know it from strong black tea, cocoa or walnut skin. It is what gives many wines – especially reds – their structure and resolute character.",
  },
  {
    q_pl: "Dlaczego zmienia się wytrawność, gdy zmieniam słodycz, kwasowość lub cierpkość?",
    q_en: "Why does dryness change when I adjust sweetness, acidity or astringency?",
    a_pl:
      "Ponieważ wytrawność nie zależy wyłącznie od ilości cukru w winie. To sposób, w jaki odbieramy wzajemne proporcje słodyczy, kwasowości i cierpkości. Nawet niewielka zmiana jednej z tych cech może sprawić, że wino będzie wydawało się bardziej lub mniej wytrawne.",
    a_en:
      "Because dryness doesn't depend on the amount of sugar alone. It is how we perceive the mutual proportions of sweetness, acidity and astringency. Even a small change in one of them can make a wine seem more or less dry.",
  },
  {
    q_pl: "Dlaczego nie mogę zaznaczyć tylko jednego wrażenia?",
    q_en: "Why can't I mark just one sensation?",
    a_pl:
      "Ponieważ każde wino zawiera wszystkie sześć wrażeń. Różni się jedynie ich intensywność. Jedne są dominujące, inne subtelne, ale dopiero ich wzajemne proporcje tworzą charakter wina.",
    a_en:
      "Because every wine contains all six sensations. They differ only in intensity. Some dominate, others stay subtle, but it is their mutual proportions that create a wine's character.",
  },
  {
    q_pl: "Czy mogę lubić jednocześnie wina świeże i tęgie?",
    q_en: "Can I like both fresh and bold wines at once?",
    a_pl:
      "Oczywiście. Winiarski gust rzadko ogranicza się do jednego wrażenia. Większość osób lubi różne style win, a Vinocompas pozwala pokazać, które cechy są dla Ciebie najważniejsze i jak się ze sobą łączą.",
    a_en:
      "Of course. A taste in wine is rarely limited to a single sensation. Most people enjoy several styles, and Vinocompas lets you show which traits matter most to you and how they combine.",
  },
  {
    q_pl: "Dlaczego Vinocompas poleca mi właśnie te wina?",
    q_en: "Why does Vinocompas recommend these particular wines?",
    a_pl:
      "Każde polecane wino ma charakter najbardziej zbliżony do Twojego winiarskiego gustu. Vinocompas porównuje wybrane przez Ciebie smaki, wrażenia i tendencje z opisami wszystkich win w bazie. Im większe podobieństwo, tym wyżej dane wino pojawi się na liście rekomendacji.",
    a_en:
      "Every recommended wine has the character closest to your taste in wine. Vinocompas compares the tastes, sensations and tendencies you chose with the descriptions of every wine in the base. The greater the similarity, the higher a wine appears on the list.",
  },
  {
    q_pl: "Dlaczego nie pytacie o szczep, kraj lub producenta?",
    q_en: "Why don't you ask about grape, country or producer?",
    a_pl:
      "Bo Vinocompas opisuje charakter wina, a nie jego pochodzenie. Dwa wina z różnych krajów lub szczepów mogą mieć bardzo podobny charakter, a dwa wina z tego samego szczepu mogą różnić się diametralnie. Dlatego zaczynamy od tego, co naprawdę odczuwasz podczas degustacji.",
    a_en:
      "Because Vinocompas describes a wine's character, not its origin. Two wines from different countries or grapes can share a very similar character, while two wines of the same grape can differ completely. That's why we start from what you actually perceive while tasting.",
  },
  {
    q_pl: "Jak korzystać z Vinocompasu podczas zakupów lub w restauracji?",
    q_en: "How do I use Vinocompas while shopping or in a restaurant?",
    a_pl:
      "Jeśli degustujesz wino lub znasz je z wcześniejszych doświadczeń, opisz je w Vinocompasie. Następnie porównaj jego charakter z innymi winami. Im bardziej zbliżony charakter, tym większa szansa, że nowe wino również przypadnie Ci do gustu.",
    a_en:
      "If you're tasting a wine, or know it from experience, describe it in Vinocompas. Then compare its character with other wines. The closer the character, the better the chance the new wine will suit you too.",
  },
  {
    q_pl: "Czy nie wystarczy znać wytrawność wina?",
    q_en: "Isn't knowing a wine's dryness enough?",
    a_pl:
      "Wytrawność to dopiero początek. Dwa równie wytrawne wina mogą mieć zupełnie inny charakter – jedno będzie świeże i cytrusowe, drugie pełne, tęgie i korzenne. Vinocompas pomaga odkryć te różnice i znaleźć wina, które naprawdę odpowiadają Twojemu gustowi.",
    a_en:
      "Dryness is only the beginning. Two equally dry wines can have entirely different characters – one fresh and citrusy, the other full, bold and spicy. Vinocompas helps you uncover those differences and find wines that genuinely match your taste.",
  },
  {
    q_pl: "Czy muszę znać aromaty, żeby korzystać z Vinocompasu?",
    q_en: "Do I need to know aromas to use Vinocompas?",
    a_pl:
      "Nie. Vinocompas został stworzony po to, aby każdy mógł opisywać wino bez znajomości profesjonalnego słownictwa. Wystarczą Twoje odczucia i skojarzenia.",
    a_en:
      "No. Vinocompas was created so that anyone can describe wine without professional vocabulary. Your perceptions and associations are enough.",
  },
  {
    q_pl: "Czy istnieją złe odpowiedzi?",
    q_en: "Are there wrong answers?",
    a_pl:
      "Nie. Vinocompas nie ocenia, czy degustujesz „poprawnie”. Opisuje Twój sposób odbierania wina. To właśnie on pozwala odkryć Twój winiarski gust i znaleźć kolejne wina, które będą Ci smakować.",
    a_en:
      "No. Vinocompas doesn't judge whether you taste “correctly”. It describes the way you perceive wine. That is what reveals your taste in wine and finds more wines you'll enjoy.",
  },
  {
    q_pl: "Czy Vinocompas zastąpi wiedzę o winie?",
    q_en: "Will Vinocompas replace wine knowledge?",
    a_pl:
      "Nie. Vinocompas nie zastępuje wiedzy o winie – pomaga ją uporządkować. To narzędzie, które ułatwia rozpoznawanie charakteru win, porównywanie ich i odkrywanie własnego winiarskiego gustu.",
    a_en:
      "No. Vinocompas doesn't replace wine knowledge – it helps organise it. It is a tool that makes it easier to recognise wines' characters, compare them and discover your own taste in wine.",
  },
  {
    q_pl: "Czy mój winiarski gust może się zmieniać?",
    q_en: "Can my taste in wine change?",
    a_pl:
      "Tak. Winiarski gust zmienia się wraz z doświadczeniem, porą roku, okazją, a nawet nastrojem. Dlatego warto wracać do Vinocompasu i opisywać różne wina. Z czasem lepiej poznasz swoje preferencje i odkryjesz style, po które wcześniej być może nigdy byś nie sięgnął.",
    a_en:
      "Yes. A taste in wine changes with experience, season, occasion and even mood. That's why it's worth coming back to Vinocompas and describing different wines. Over time you'll know your preferences better and discover styles you might never have reached for.",
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

  return `Jesteś sommelierem-przewodnikiem po metodzie Vinocompas (autorka: Magdalena Surgiel-Czyż / parfumealavin / vinocompas.pl). Tłumaczysz początkującym jak opisywać i wybierać wino używając 6 wrażeń i 3 podstawowych smaków.

# DOZWOLONE TEMATY (i tylko te)
- Wino: smak, profil, region, gatunek, łączenie z jedzeniem, serwis (temperatura, dekantacja).
- Metoda Vinocompas: wrażenia, tendencje, smaki bazowe, jak je rozpoznać.
- Jedzenie w kontekście dopasowania do wina (smak dania, tekstura, sos).
- Restauracje, menu, kultura stołu, rytuał degustacji.
- Aplikacja Vinovigator AI: jak działa, jak skanować QR, jak czytać sugestie.

# ZAKAZANE TEMATY - odmów uprzejmie i przekieruj na wino
- Programowanie, kod, IT, debugowanie, dane techniczne.
- Matematyka, fizyka, finansowe porady, polityka, religia.
- Pogoda, nowinki, sport, celebryci, generator tekstu.
- Cokolwiek niezwiązanego z winem, jedzeniem, smakiem lub aplikacją.
Jeśli pytanie wykracza poza te tematy - odpowiedz dokładnie tak (nie inaczej):
„Jestem przewodnikiem Vinocompasu - odpowiadam tylko o winie, smaku i połączeniach z jedzeniem. Może spytasz mnie o ulubione wino albo o danie, do którego szukasz pary?"
Nie próbuj odpowiadać częściowo. Nie tłumacz dlaczego nie odpowiadasz. Nie cytuj zakazanego pytania.

# Zasady odpowiedzi (gdy temat jest dozwolony)
- ${lang === "en" ? "Zawsze odpowiadasz po ANGIELSKU (the user is on the English site - reply in natural English, keep the Polish sensation names in parentheses on first use)." : "Zawsze odpowiadasz po polsku."}
- Krótko, ciepło, jak rozmowa przy lampce wina, nie jak wykład.
- Maksymalnie 4-5 zdań na odpowiedź. Bez bullet-list, jeśli nie ma 3+ punktów.
- Używaj nazw wrażeń i tendencji z poniższej bazy (NIE wymyślaj nowych nazw).
- Gdy użytkownik pyta o konkretne wino - odpowiadaj na bazie ogólnej wiedzy + zaproś do skanu QR w restauracji żeby dostać konkretną rekomendację z karty.
- NIE nazywaj się modelem, AI ani GPT. Jesteś „przewodnikiem Vinocompasu".

# 6 wrażeń (sektorów kompasu)

${sectors}

# 3 podstawowe smaki (mierzone osobno)

${tastes}

# Metoda degustacji

${method}

# Filozofia metody (dokument klienta, 2026-07)
Vinocompas nie uczy języka sommelierów. Pomaga zrozumieć własny winiarski gust, wykorzystując doświadczenia, które każdy z nas już zna. Etap I nie uczy degustacji - pokazuje, że wytrawność to coś więcej niż ilość cukru. Etap II nie uczy terminologii - pomaga rozpoznać charakter wina. Etap III nie uczy aromatów - buduje obrazy i skojarzenia, dzięki którym łatwiej zapamiętać własny winiarski gust. Vinocompas nie pyta, jakie wino powinieneś lubić: pokazuje, dlaczego lubisz właśnie takie wina i pomaga znaleźć kolejne o podobnym charakterze.

# Kontekst produktu Cellar Compass
Cellar Compass to demo aplikacja dla restauracji: gość skanuje QR przy stoliku, wybiera danie z menu, system pokazuje top-3 win z uzasadnieniem (chat-bot odpowiada „dlaczego to wino pasuje”). Działa w obie strony - gość może wybrać wino, system zaproponuje dania. Twoja rola w aplikacji: nauczyciel metody Vinocompas, który pomoże użytkownikowi zrozumieć własny profil smaku i lepiej rozumieć rekomendacje. Kieruj rozmowę w stronę jasnych, konkretnych przykładów - pomagaj użytkownikowi nazwać własne preferencje słowami z metody.`;
}
