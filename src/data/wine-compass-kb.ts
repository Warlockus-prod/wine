/**
 * Wine Compass — Vinocompas methodology knowledge base.
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

export interface Tendencja {
  id: TendencjaId;
  name_pl: string;
  associations_pl: string;
  examples_pl: string;
  found_in_pl: string; // "wina czerwone" | "wina białe" | etc
}

export interface CompassSector {
  id: SectorId;
  name_pl: string;
  /** "świeżość" / "tęgość" — adjective form */
  noun_pl: string;
  short_pl: string; // 1-line essence
  long_pl: string; // 2-3 paragraphs description
  color: string; // hex — used in SVG compass
  tendencje: [Tendencja, Tendencja];
}

export const COMPASS_SECTORS: CompassSector[] = [
  {
    id: "swieze",
    name_pl: "Świeże",
    noun_pl: "Świeżość",
    short_pl: "Wszystko co kwaśne, cierpkie, ale też odświeżające i rześkie. Łatwe skojarzenie to lemoniada albo zielony ogórek.",
    long_pl:
      "Świeżość to wszystko to co kwaśne, cierpkie, ale też odświeżające i rześkie. Łatwe skojarzenie to lemoniada, albo zielony ogórek. Mamy tu dwie tendencje: cytrusy oraz zielone warzywa i owoce.",
    color: "#9bc24a",
    tendencje: [
      {
        id: "swieze.cytrusy",
        name_pl: "Cytrusy",
        associations_pl: "cytryny, grejpfruty, pomarańcze, mandarynki",
        examples_pl: "Tego rodzaju wrażenia spotykamy w wielu gatunkach win białych jak i czerwonych.",
        found_in_pl: "wina białe i czerwone",
      },
      {
        id: "swieze.zielone",
        name_pl: "Zielone warzywa i owoce",
        associations_pl: "melon, winogrona, seler, ogórek, karczoch, szparagi",
        examples_pl:
          "Te doznania często odnajdziemy w białych winach, warzywne tendencje spotykamy też często w winach czerwonych.",
        found_in_pl: "wina białe (głównie) i czerwone",
      },
    ],
  },
  {
    id: "oleiste",
    name_pl: "Oleiste",
    noun_pl: "Oleistość",
    short_pl: "Wszystko co gęste, lepkie, słodkie i żywiczne.",
    long_pl:
      "Znajdujemy tu wszystko co gęste, lepkie, słodkie i żywiczne. Mamy tu dwie tendencje: masłowość/tostowość/orzechy oraz owoce tropikalne.",
    color: "#f4c84a",
    tendencje: [
      {
        id: "oleiste.maslo",
        name_pl: "Masłowość, tostowość, orzechy",
        associations_pl: "masło, orzechy, tosty, drożdże, ciasteczka maślane, pierniczki",
        examples_pl:
          "Różnego rodzaju produkty „tłuste”. Tego rodzaju wrażenia spotykamy w wielu gatunkach win białych jak i czerwonych.",
        found_in_pl: "wina białe i czerwone",
      },
      {
        id: "oleiste.tropikalne",
        name_pl: "Owoce tropikalne",
        associations_pl: "mango, ananas, papaja, marakuja, banan, liczi",
        examples_pl:
          "Oleistość żywiczna, pełnia słodyczy. Te doznania często odnajdziemy w białych winach.",
        found_in_pl: "wina białe (głównie)",
      },
    ],
  },
  {
    id: "miekkie",
    name_pl: "Miękkie",
    noun_pl: "Miękkość",
    short_pl: "Skojarzenie z latem i przyjemnościami. Dojrzałe owoce i konfitury.",
    long_pl:
      "Myślę, że z tym wrażeniem nie będziecie mieć problemów. To skojarzenie z latem i przyjemnościami. Tendencje: dojrzałe owoce i konfitury.",
    color: "#e74c3c",
    tendencje: [
      {
        id: "miekkie.dojrzale",
        name_pl: "Dojrzałe owoce",
        associations_pl:
          "w czerwonym: śliwki, wiśnie, maliny, jagody, truskawki, jeżyny, figi, porzeczka. W białym: jabłka, gruszki, morele, agrest",
        examples_pl: "Klasyczne owocowe nuty występujące w młodych, owocowych winach.",
        found_in_pl: "wina czerwone i białe — różne owoce",
      },
      {
        id: "miekkie.konfitury",
        name_pl: "Konfitury",
        associations_pl: "konfitury z jabłka, truskawki — owoce upieczone, usmażone, skarmelizowane",
        examples_pl:
          "Konfitury różnią się od dojrzałych owoców intensywnością. Tutaj jabłko czy truskawka są upieczone, usmażone, czy skarmelizowane.",
        found_in_pl: "wina dojrzałe, treściwe",
      },
    ],
  },
  {
    id: "tegie",
    name_pl: "Tęgie",
    noun_pl: "Tęgość",
    short_pl: "Orientalne, ciepłe, ciężkie, intensywne, gęste i słodkie.",
    long_pl:
      "To co jest tęgie jest też w odczuciach orientalne, ciepłe, ciężkie, intensywne, gęste i słodkie. Dwie tendencje: czekolada/kawa/tytoń oraz suszone owoce.",
    color: "#8a4b2a",
    tendencje: [
      {
        id: "tegie.cigaro",
        name_pl: "Czekolada, kawa, tytoń",
        associations_pl: "czekolada, kawa, tytoń, słodkie cygaro",
        examples_pl:
          "Ciężka tendencja, która przywodzi na myśl „klub gentelmena”, „klub golfowy”, „sklep ze słodyczami” czy „sklep z cygarami”. Zwykle w winach czerwonych.",
        found_in_pl: "wina czerwone (głównie)",
      },
      {
        id: "tegie.suszone",
        name_pl: "Suszone owoce",
        associations_pl:
          "w czerwonych: wędzone śliwki, suszone śliwki, daktyle, żurawina. W białych: suszona morela, rodzynki, daktyle, jabłka, pomarańcze, banany, orientalne przyprawy",
        examples_pl: "Intensywne wrażenie. To trochę skojarzenie z wigilijnym suszem.",
        found_in_pl: "wina dojrzałe, mocne",
      },
    ],
  },
  {
    id: "szorstkie",
    name_pl: "Szorstkie",
    noun_pl: "Szorstkość",
    short_pl: "Uczucie cierpkości, suchości na języku. Powąchaj skórę albo kawałek deski.",
    long_pl:
      "Wrażenie szorstkości odpowiada za uczucie cierpkości, suchości na języku. Jak sobie je wyobrazić? Powąchajcie skórę, albo kawałek deski. Spróbujcie aronii albo cierpkiej, czarnej porzeczki, która aż ściąga całą buzię w dzióbek. Mamy tu dwie tendencje: piżmo/skóra oraz dąb/dym/garbniki.",
    color: "#5a2c5e",
    tendencje: [
      {
        id: "szorstkie.pizmo",
        name_pl: "Piżmo, skóra",
        associations_pl: "skojarzenia zwierzęce — zapach mokrego psa, konia, stajni, skóry",
        examples_pl: "Tego rodzaju wrażenia spotykamy w czerwonych winach.",
        found_in_pl: "wina czerwone",
      },
      {
        id: "szorstkie.dab",
        name_pl: "Dąb, dym, garbniki",
        associations_pl:
          "drewno, nieheblowana deska, zapach ogniska, tytoń z papierosa, ściąganie na języku przy cierpkich owocach",
        examples_pl: "Szeroka rodzina wrażeń „szorstkich” i „cierpkich”.",
        found_in_pl: "wina czerwone",
      },
    ],
  },
  {
    id: "ziemiste",
    name_pl: "Ziemiste",
    noun_pl: "Ziemistość",
    short_pl: "Wyobraź sobie, że kładziesz się na ziemi: las, łąka, rzeka, świeża ziemia.",
    long_pl:
      "Wrażenie ziemistości najłatwiej pojąć gdy wyobrazimy sobie, że kładziemy się na ziemi. Może to być las, łąka, okolice rzeki, trawnik, pole czy też świeżo wysypana ziemia. Mamy tu dwie tendencje: minerały oraz ściółka leśna.",
    color: "#2c5d8e",
    tendencje: [
      {
        id: "ziemiste.mineraly",
        name_pl: "Minerały",
        associations_pl:
          "kamienie, rzeka, akweny wodne, woda mineralna — bąbelki na języku, „szczypanie”",
        examples_pl: "Pamiętacie jak pachnie morze? Ten zapach też.",
        found_in_pl: "wina białe i czerwone",
      },
      {
        id: "ziemiste.sciolka",
        name_pl: "Ściółka leśna",
        associations_pl: "ściółka leśna, ścięta trawa, fiołki, lawenda",
        examples_pl:
          "Wrażenia kojarzone z lasem, glebą zwykle znajdujemy w winach czerwonych; trawę mamy w białych jak Sauvignon Blanc.",
        found_in_pl: "wina czerwone (las/gleba), białe (trawa)",
      },
    ],
  },
];

export interface BaseTasteInfo {
  id: BaseTaste;
  name_pl: string;
  description_pl: string;
}

export const BASE_TASTES: BaseTasteInfo[] = [
  {
    id: "slodycz",
    name_pl: "Słodycz",
    description_pl:
      "Naturalny cukier resztkowy w winie. Od wytrawnych (brak słodyczy) po słodkie wina deserowe.",
  },
  {
    id: "cierpkosc",
    name_pl: "Cierpkość",
    description_pl:
      "Wrażenie ściągania na języku. W czerwonych winach pochodzi głównie od garbników (tanin), w białych może pochodzić od młodych owoców.",
  },
  {
    id: "kwasowosc",
    name_pl: "Kwasowość",
    description_pl:
      "„Świeżość”, ślinienie podniebienia. Wina o wysokiej kwasowości pijemy z radością — odświeżają jak lemoniada.",
  },
];

export interface MethodStep {
  id: string;
  title_pl: string;
  body_pl: string;
}

export const METHOD_STEPS: MethodStep[] = [
  {
    id: "wzrok",
    title_pl: "Wzrok",
    body_pl:
      "Spójrz na wino: jaki ma kolor (głębia, intensywność), gęstość (czy spływa po szkle wolno czy szybko), czy jest spokojne czy musujące?",
  },
  {
    id: "dotyk",
    title_pl: "Dotyk (w ustach)",
    body_pl:
      "Zwróć uwagę na gęstość i konsystencję — czy wino jest lekkie i wodniste, czy gęste i oleiste?",
  },
  {
    id: "zapach",
    title_pl: "Zapach — bez nosa i z nosem",
    body_pl:
      "Tutaj robi się ciekawie. Najpierw zatkaj nos i wypij łyk — to oddaje czysty smak (słodycz, cierpkość, kwasowość). Potem otwórz nos i powąchaj — wszystkie wrażenia z 6 sektorów kompasu pojawią się w nosie.",
  },
  {
    id: "smak",
    title_pl: "Smak",
    body_pl:
      "Gdyby wino składało się tylko ze smaku, mówilibyśmy że wyczuwamy w nim: słodycz, cierpkość lub kwasowość. To są 3 podstawowe wrażenia smakowe — niezależne od 6 wrażeń aromatycznych z kompasu.",
  },
  {
    id: "kompas",
    title_pl: "Ułóż na kompasie",
    body_pl:
      "Każde z 6 wrażeń (świeże, oleiste, miękkie, tęgie, szorstkie, ziemiste) ma 2 tendencje. Zaznacz na kompasie intensywność każdej tendencji (od 0 do 4). To jest twój profil smaku tego wina.",
  },
  {
    id: "porownaj",
    title_pl: "Porównaj wina",
    body_pl:
      "Zakręć kieliszkiem, powąchaj, spróbuj win, powąchaj jeszcze raz. Na podstawie znanych już wrażeń i tendencji opisz wina i to, czym się różnią. Stwórz własny Vinokompas i znajdź wina, które naprawdę lubisz.",
  },
];

export interface FAQItem {
  q_pl: string;
  a_pl: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    q_pl: "Co to jest Vinokompas?",
    a_pl:
      "To system opisu wina oparty na 6 wrażeniach zmysłowych (świeże, oleiste, miękkie, tęgie, szorstkie, ziemiste) i 3 podstawowych smakach (słodycz, cierpkość, kwasowość). Każde wrażenie ma 2 tendencje. Po zaznaczeniu intensywności każdej tendencji otrzymujesz unikalny profil smakowy wina — i możesz szukać innych win do niego podobnych.",
  },
  {
    q_pl: "Co to jest tendencja?",
    a_pl:
      "Tendencja to skojarzenie, które przeważa w danym wrażeniu. Na przykład wrażenie „świeże” ma 2 tendencje: cytrusy i zielone warzywa/owoce. Każde wrażenie ma 2 wyraźne tendencje — to cała filozofia.",
  },
  {
    q_pl: "Jak rozróżnić wrażenia od tendencji?",
    a_pl:
      "Wrażenie to ogólna kategoria (np. „świeże”). Tendencja to konkretne skojarzenie wewnątrz tej kategorii (np. „cytrusy” albo „zielone warzywa”). Jedno wino może być świeże w stronę cytrusów (jak Riesling), inne świeże w stronę zielonych warzyw (jak Sauvignon Blanc).",
  },
  {
    q_pl: "Co znaczy „cierpkość”?",
    a_pl:
      "Cierpkość to uczucie ściągania na języku. W czerwonych winach pochodzi głównie od garbników (tanin) zawartych w skórkach winogron i drewnie beczki. Pomyśl o aronii albo czarnej porzeczce — aż ściąga buzię.",
  },
  {
    q_pl: "Czym różni się „świeże” od „oleiste”?",
    a_pl:
      "Świeże wino jest kwaśne, rześkie, lekkie — jak lemoniada. Oleiste wino jest gęste, lepkie, słodkie — jak masło, orzechy, mango. Świeże orzeźwia, oleiste otula. Można też mieć wino które jednocześnie świeże i lekko oleiste — wtedy zaznacz oba sektory na kompasie z różną intensywnością.",
  },
  {
    q_pl: "Czym różni się „miękkie” od „tęgie”?",
    a_pl:
      "Miękkie to dojrzałe owoce i konfitury — letnie, przyjemne, owocowe. Tęgie to czekolada, kawa, tytoń i suszone owoce — orientalne, ciężkie, intensywne. Wino miękkie pijemy łatwo, wino tęgie wymaga uwagi i często długiego oddychania w karafce.",
  },
  {
    q_pl: "Czym różni się „szorstkie” od „ziemiste”?",
    a_pl:
      "Szorstkie to wrażenie cierpkości, suchości — piżmo, skóra, dąb, dym, garbniki. Ziemiste to wrażenie ziemi, lasu, minerałów. Szorstkie wina mają taniny i drewno; ziemiste mają nuty terroir — kamienia, ściółki leśnej, kwiatów polnych.",
  },
  {
    q_pl: "Jakie wino dla kogoś kto lubi tytoń i kawę?",
    a_pl:
      "Szukaj wina z wysokim wskaźnikiem w sektorze „tęgie” (tendencja czekolada/kawa/tytoń) i często też „szorstkie” (dąb, garbniki). To zwykle dojrzałe czerwone wina z beczki: Cabernet Sauvignon, Brunello di Montalcino, Tignanello, Vega Sicilia, Chateauneuf-du-Pape.",
  },
  {
    q_pl: "Jakie wino dla kogoś kto lubi cytrusy?",
    a_pl:
      "Szukaj wina z wysokim wskaźnikiem w sektorze „świeże” (tendencja cytrusy). Klasyki to Riesling z Alzacji albo Mozeli, Sauvignon Blanc z Loary lub Nowej Zelandii (Cloudy Bay), Albarino z Galicji, Chablis z Burgundii.",
  },
  {
    q_pl: "Jakie wino dla kogoś kto lubi czekoladę?",
    a_pl:
      "Sektor „tęgie” (czekolada, kawa, tytoń) — pełne czerwone z dębem. Też dobrze będą wina deserowe ze strony „miękkie/konfitury”: Banyuls, Maury, Porto LBV, Recioto della Valpolicella.",
  },
  {
    q_pl: "Jak korzystać z kompasu w restauracji?",
    a_pl:
      "1) Powiedz kelnerowi swój profil smaku (np. „lubię świeże cytrusowe” albo „lubię tęgie z kawą”). 2) Albo zeskanuj QR Cellar Compass w restauracji — wybierz danie, system pokaże top-3 wina pasujące do dania, z uzasadnieniem. Działa też w drugą stronę: wybierz wino, system zaproponuje dania.",
  },
  {
    q_pl: "Czy każde wino ma wszystkie 6 wrażeń?",
    a_pl:
      "Każde wino ma jakąś obecność każdego z 6 wrażeń — ale często z bardzo różną intensywnością. Sauvignon Blanc będzie mocno w „świeże” (cytrusy, zielone) i prawie zero w „tęgie”. Zinfandel z USA — odwrotnie: mocno „tęgie” (suszone owoce), „miękkie” (konfitury), „szorstkie” (dąb).",
  },
  {
    q_pl: "Czy mam degustować z zatkanym nosem?",
    a_pl:
      "Tak, na początku — to świetny trening. Gdy zatkaniesz nos, wino pokazuje tylko swoje 3 podstawowe smaki: słodycz, cierpkość, kwasowość. Gdy otworzysz nos — eksploduje aromatami z 6 sektorów kompasu. To pokazuje jak nos i język grają w pary.",
  },
  {
    q_pl: "Co znaczy moja kombinacja na kompasie?",
    a_pl:
      "Twój kompas to twój profil smaku. Im wyższe „świeże/cytrusy” tym częściej szukaj win cytrusowych. Im wyższe „tęgie/cigaro” tym mocniej idź w wina dojrzałe z beczką. Cellar Compass dopasowuje wina z menu restauracji właśnie pod taki profil — albo pod profil dania.",
  },
];

/**
 * Compact KB for the chat system prompt — full context but trimmed
 * formatting. ~3-4 KB. Generated as a string at runtime to keep build
 * fast and to allow the prompt to evolve without regenerating types.
 */
export function buildChatSystemPrompt(): string {
  const sectors = COMPASS_SECTORS.map((s) => {
    const [t1, t2] = s.tendencje;
    return `## ${s.name_pl}\n${s.short_pl}\nTendencje:\n  1) ${t1.name_pl} — ${t1.associations_pl}. (${t1.found_in_pl})\n  2) ${t2.name_pl} — ${t2.associations_pl}. (${t2.found_in_pl})`;
  }).join("\n\n");

  const tastes = BASE_TASTES.map((b) => `- ${b.name_pl}: ${b.description_pl}`).join("\n");

  const method = METHOD_STEPS.map((m) => `### ${m.title_pl}\n${m.body_pl}`).join("\n\n");

  return `Jesteś sommelierem-przewodnikiem po metodzie Vinokompas (autorka: Magdalena Surgiel-Czyż / parfumealavin / vinocompas.pl). Tłumaczysz początkującym jak opisywać i wybierać wino używając 6 wrażeń i 3 podstawowych smaków.

# Zasady odpowiedzi
- Zawsze odpowiadasz po polsku.
- Krótko, ciepło, jak rozmowa przy lampce wina, nie jak wykład.
- Maksymalnie 4-5 zdań na odpowiedź. Bez bullet-list, jeśli nie ma 3+ punktów.
- Używaj nazw wrażeń i tendencji z poniższej bazy (NIE wymyślaj nowych nazw).
- Gdy użytkownik pyta o konkretne wino — odpowiadaj na bazie ogólnej wiedzy + zaproś do skanu QR w restauracji żeby dostać konkretną rekomendację z karty.
- NIE nazywaj się modelem, AI ani GPT. Jesteś „przewodnikiem Cellar Compass”.

# 6 wrażeń (sektorów kompasu)

${sectors}

# 3 podstawowe smaki (mierzone osobno)

${tastes}

# Metoda degustacji

${method}

# Kontekst produktu Cellar Compass
Cellar Compass to demo aplikacja dla restauracji: gość skanuje QR przy stoliku, wybiera danie z menu, system pokazuje top-3 win z uzasadnieniem (chat-bot odpowiada „dlaczego to wino pasuje”). Działa w obie strony — gość może wybrać wino, system zaproponuje dania. Twoja rola w aplikacji: nauczyciel metody Vinokompas, który pomoże użytkownikowi zrozumieć własny profil smaku i lepiej rozumieć rekomendacje. Kieruj rozmowę w stronę jasnych, konkretnych przykładów — pomagaj użytkownikowi nazwać własne preferencje słowami z metody.`;
}
