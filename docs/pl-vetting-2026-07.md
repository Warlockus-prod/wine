# PL seed vetting — 2026-07 (AI first-pass, awaiting sommelier sign-off)

**Status: AI first-pass. NOT a substitute for the human sommelier review** required
by CLAUDE.md before any commercial pitch — this pass hunts English calques,
grammar/case errors and wine-vocabulary misuse in the `.pl` values of
`src/data/seed-restaurants.ts` and `src/data/seed-pairing.ts`. A Polish-speaking
sommelier should read every line below, veto or improve, and initial the sheet.

Scope: only `LocalizedString.pl` values (dish/wine name/description/notes, pairing
reason). No `en` values, ids, prices or structure touched. Vocabulary anchored to
`src/data/wine-compass-kb.ts` (cierpkość / kwasowość / słodycz, tendencje, garbniki/taniny,
"finisz" register). Project dash policy (" - ", never " — ") already held; no dash fixes needed.

Counts: **108 strings changed in seed-restaurants.ts, 7 in seed-pairing.ts (115 total)**.
Validation: `npx tsc --noEmit` ✅ · `npm run lint` ✅ (0 errors) · `npm run build` ✅.

Systematic patterns fixed across the file (each occurrence listed below):

- **"odpowiada/odpowiadają" as calque of "echo/mirror"** → `współgra z` (11×)
- **"uzupełnia" as calque of "complement"** → `dopełnia` (9×)
- **"rozcina / redukuje / resetuje / oczyszcza tłustość"** → `przecina …` / `odświeża podniebienie` (7×)
- **"mus" for sparkling-wine mousse** (in PL = deser/przecier) → `perlaż` (5×)
- **"wytrawny" misused for EN "savory"** (wytrawny = dry) → `pikantny / słony / treściwy` (6×)
- **"dorównuje" as calque of "matches / stands up to"** → `udźwignie / dotrzymuje kroku / współgra` (6×)
- **"wypolerowane taniny/dąb" ("polished")** → `gładkie, dojrzałe taniny` / `gładka dębowa nuta` (3×)
- **"podnosi" as calque of "lifts"** → `podkreśla / przełamuje` (3×)
- **"zakończenie" for finish** → `finisz` (2×, consistency with the rest of the card)

---

## src/data/seed-restaurants.ts

### r1 — Atelier Amaro (24)

| # | Old → New | Reason |
|---|---|---|
| 1 | "…dzika zwierzyna, zioła z lasu i **spokojne** europejskie wina" → "…dziczyzna, zioła prosto z lasu i **niekrzykliwe** europejskie wina" | calque ("quiet bottles") + pleonazm "dzika zwierzyna" |
| 2 | "…tytoń i **wypolerowane** taniny" → "…tytoń i **gładkie, dojrzałe** taniny" | calque |
| 3 | "Świeża kwaśna wiśnia, zioła i **wytrawne korzenne nuty**" → "Soczysta kwaśna wiśnia, zioła i **pikantne nuty przypraw**" | savory≠wytrawny |
| 4 | "…podany na **chmurze** wędzonego jogurtu z **grzanką żytnią**" → "…na **obłoku** … z **żytnią kruszonką**" | rejestr + crumb≠grzanka |
| 5 | "**Nuta białego kwiatu** … kontrastuje" → "**Nuty białych kwiatów** … kontrastują" | liczba |
| 6 | "Wiśnia i zioła Sangiovese **odpowiadają nutom**…" → "…**współgrają z nutami**…" | calque (echo) |
| 7 | "…przecinają **sytość zakwasu**…" → "…przecinają **treściwość żurku**…" | zła kolokacja |
| 8 | "…z **jasną** kwasowością żurku" → "…z **żywą** kwasowością żurku" | calque (bright) |
| 9 | "Mineralne cytrusy Gavi **odpowiadają świeżości**…" → "…**współgrają ze świeżością**…" | calque |
| 10 | "…Chardonnay **otacza** szczupaka…" → "…**otula** szczupaka i koperkowe masło" | calque (wraps) |
| 11 | "…popiół koprowy i **skóra** z buraka" → "…**skórka** z buraka" | leather-calque |
| 12 | "Gruszka i **nuty słone** wydobywają górską **klarowność**…" → "…**słone nuty** … górską **czystość**…" | szyk + dobór słowa |
| 13 | "…popiół koprowy i **olej iglasty**" → "…**olej z igliwia**" | błędny przymiotnik + spójność z opisem dania |
| 14 | "…nuty Brunello **niosą** wędzoną kaczkę…" → "…**dopełniają**…" | calque (carry) |
| 15 | "Głębia Tignanello **dorównuje sosowi**…" → "…**współgra z sosem** … i kaszą pęczak" | calque (matches) |
| 16 | "…i **chleb na jałowcu**" → "…i **chleb jałowcowy**" | naturalna nazwa |
| 17 | "Tytoń i cedr Tignanello **otaczają**…" → "…**otulają**…" | calque (wrap) |
| 18 | "łopatka **jagnięcia podhalańskiego**" → "łopatka **jagnięciny podhalańskiej**" | nazwa surowca (ChNP) |
| 19 | "**Jasna wiśnia** Chianti Rufina przecina tłuszcz…" → "**Żywa, wiśniowa kwasowość** Chianti Rufina przecina tłuszcz…" | calque (bright cherry) |
| 20 | "Struktura Brunello **dorównuje kiszonej kapuście**…" → "…**udźwignie kiszoną kapustę i kozi ser**" | calque |
| 21 | "…i **miód z łąki**" → "…i **miód łąkowy**" | kolokacja |
| 22 | "…**odpowiadają glazurze** z miodu łąkowego" → "…**współgrają z glazurą** z łąkowego miodu" | calque |
| 23 | "…z gruszką **na czarnym bzie**" → "…z gruszką **w syropie z czarnego bzu**" | niejasne wyrażenie |
| 24 | "…**podwaja owocowy rdzeń** deseru" → "…**wzmacnia owocowy charakter** deseru" | calque (doubles/core) |

### r2 — Izakaya Senses (19)

| # | Old → New | Reason |
|---|---|---|
| 25 | "…skórka cytrusów i elegancki **mus**" → "…elegancki **perlaż**" | mousse≠mus |
| 26 | "Dojrzałe **jagody, mocha**…" → "Dojrzałe **owoce jagodowe, mokka**…" | pisownia + precyzja |
| 27 | "Jeżyna, pieprz i **wytrawne korzenne nuty**" → "…i **pikantne nuty przypraw**" | savory≠wytrawny |
| 28 | "**Pikantny** cytrusowy profil **odpowiada** yuzu…" → "**Rześki** cytrusowy profil **współgra z** yuzu…" | zesty≠pikantny + calque |
| 29 | "Mineralność Chablis **odpowiada** oceanicznej czystości…" → "…**współgra z** oceaniczną czystością…" | calque |
| 30 | "…**resetuje** podniebienie między **różnymi**…" → "…**odświeża** podniebienie między **kolejnymi**…" | anglicyzm |
| 31 | "…łagodzi **sól sojową**…" → "…łagodzi **słoność sosu sojowego**…" | calque (soy salt) |
| 32 | "Dorsz marynowany w saikyō miso, **kiszony** daikon…" → "Dorsz **w marynacie** saikyō miso, **marynowany** daikon…" | pickled≠kiszony |
| 33 | "**Żywy mus rozcina smażoną teksturę**…" → "**Żywy perlaż przecina tłustość tempury**…" | mus + kolokacja |
| 34 | "Węgorz z grilla na węglu drzewnym na ryżu…" → "Węgorz grillowany nad węglem drzewnym, podany na ryżu…" | zbitka "na…na" |
| 35 | "**Resztkowy cukier**…" → "**Cukier resztkowy**…" | termin fachowy (szyk) |
| 36 | "…owoce **uzupełniają** … węgorza" → "…**dopełniają**…" | kolokacja |
| 37 | "**Smażone** wagyu…" → "**Obsmażane** wagyu…" | tataki = seared |
| 38 | "…korzenność **dorównują tłustości** wagyu" → "…**dotrzymują kroku tłustości** wagyu" | calque |
| 39 | "Tekstura **Pinot wspiera** tłustość…, nie **tłumiąc** ponzu" → "Tekstura **Pinota dźwiga** tłustość…, nie **zagłuszając** ponzu" | deklinacja + kolokacja |
| 40 | "**Kwasowy charakter rozcina**…" → "**Żywa kwasowość przecina**…" | kolokacja |
| 41 | "Miękkość Rieslinga **uzupełnia**…" → "…**dopełnia**…" | kolokacja |
| 42 | "…z **ceremonialnym kremem matcha**" → "…z **kremem z ceremonialnej matchy**" | błędne przyporządkowanie przydawki |
| 43 | "**Owocowy mus z czerwonych jagód niweluje**…" → "**Czerwone owoce i perlaż rosé równoważą**…" | mus + urzędowe "niweluje" |

### r3 — Bodega 1881 (20)

| # | Old → New | Reason |
|---|---|---|
| 44 | "…mięsa **z ognia** i **głęboka karta** Riojy…" → "…mięsa **z żywego ognia** i **obszerna karta win z** Riojy…" | calque (deep list) |
| 45 | "Śliwka, cedr, tytoń i **wypolerowane** taniny" → "…**gładkie, dojrzałe** taniny" | calque |
| 46 | "…**warstwowa** oksydacyjna złożoność" → "…**wielowarstwowa,** oksydacyjna złożoność" | calque (layered) |
| 47 | "Bąbelki Cavy **oczyszczają** tłustość…" → "…**przecinają** tłustość…" | kolokacja |
| 48 | "…wino **wzmacnia słodkie krewetki**…" → "…**podkreśla słodycz krewetek**…" | kolokacja |
| 49 | "**Warstwowe** białe wino…" → "**Wielowarstwowe** białe wino…" | calque |
| 50 | "Omlet … **o teksturze konfitowanej w oliwie**" → "Omlet z ziemniakami i cebulą **konfitowanymi w oliwie**" | niegramatyczna kalka |
| 51 | "…wino **uzupełnia bogactwo** jajek" → "…**dopełnia kremowość** jajek" | kolokacja |
| 52 | "…**utrzymuje każdy kęs lekkim**" → "…**sprawia, że każdy kęs pozostaje lekki**" | rusycyzm składniowy |
| 53 | "Mineralność Albariño **uzupełnia**…" → "…**dopełnia**…" | kolokacja |
| 54 | "…korzenność **Rioja** … i **pieczonych mięsnych nut**" → "…korzenność **Riojy** … i **nut pieczonego mięsa**" | deklinacja + szyk |
| 55 | "Świeża kwasowość **utrzymuje danie z ryżu pełnym życia**" → "Rześka kwasowość **dodaje daniu z ryżu lekkości i życia**" | calque (keeps lively) |
| 56 | "Złożone, **dojrzewające** białe wino **wspiera bogactwo czosnku**" → "Złożone, **dojrzałe** białe wino **udźwignie czosnkowe bogactwo dania**" | aged=dojrzałe + calque |
| 57 | "Świeży słony profil **równoważy słoność**…" → "Świeży, słony profil **współgra ze słonością**…" | logika (sól nie równoważy soli) |
| 58 | "Skoncentrowane czerwone wino **ze strukturą odpowiada chrupiącej tłustości wieprzowiny**" → "Skoncentrowane, **dobrze zbudowane** czerwone wino **udźwignie tłustość chrupiącego prosięcia**" | niegramatyczna kalka |
| 59 | nazwa: "Krokiety z **szynką jamón**" → "Krokiety z **jamón ibérico**" | pleonazm (jamón=szynka) |
| 60 | "Musująca tekstura **oczyszcza bogactwo** beszamelu" → "…**przełamuje kremowe bogactwo** beszamelu" | kolokacja |
| 61 | "…równoważą **wytrawną** intensywność szynki" → "…**słoną** intensywność szynki" | savory≠wytrawny |
| 62 | "**Stek żebrowy dojrzewający na sucho**, pieczony…" → "**Sezonowany na sucho antrykot z kością**, pieczony…" | terminologia steków |
| 63 | "…korzenność **odpowiadają nutom grillowanej skórki**" → "…**współgrają z nutami przypieczonej skorupki**" | calque + skórka≠skorupka steku |

### r4 — Lasserre (24)

| # | Old → New | Reason |
|---|---|---|
| 64 | "słynny **otwierany** dach" → "słynny **rozsuwany** dach" | retractable |
| 65 | "…i **liniowa** kwasowość" → "…**precyzyjna** kwasowość" | geometryczna kalka |
| 66 | "…prażone orzechy i **długi mus**" → "…i **długi, kremowy perlaż**" | mousse≠mus |
| 67 | "…i **subtelny dąb z dymem**" → "…i **subtelna, dymna nuta dębu**" | zbitka |
| 68 | "Ziemistość Pinota **odpowiada głębi**…" → "…**współgra z głębią**…" | calque |
| 69 | "Taniny **mieszanki Merlot**…" → "Taniny **kupażu na bazie Merlota**…" | terminologia (kupaż) + deklinacja |
| 70 | "Korzenność Rodanu **wzmacnia smażoną skórkę** i pieprz" → "…**podkreśla przypieczoną skorupkę steku** i pieprz" | kolokacja |
| 71 | "**Wolno pieczone** udko kaczki…" → "**Konfitowane** udko kaczki…" | confit≠pieczenie |
| 72 | "**Wytrawny** profil Rodanu…" → "**Ziołowo-pikantny** profil Rodanu…" | savory≠wytrawny |
| 73 | "Świeżość Pinota **podnosi bogaty tłuszcz** konfitu" → "…**przełamuje tłustość** konfitu" | calque (lifts the fat) |
| 74 | "Marsylski **gulasz rybny**…" → "Marsylska **zupa rybna**…" | bouillabaisse to zupa |
| 75 | "Mineralne Chablis **wspiera** skorupiaki i **bulion z szafranem**" → "…**dopełnia** skorupiaki i **szafranowy bulion**" | calque (supports) |
| 76 | "**Warstwowe** białe wino **ma wystarczająco treściwości dla**…" → "**Wielowarstwowe** białe wino **ma dość treściwości, by udźwignąć**…" | calque + składnia |
| 77 | "Wytrawne rosé **uzupełnia**…" → "…**dopełnia**…" | kolokacja |
| 78 | "…**podnosi słodycz pomidora**" → "…**podkreśla słodycz pomidorów**" | calque + liczba |
| 79 | "…z grzybami i **perłową cebulą**" → "…i **cebulkami perłowymi**" | nazwa kulinarna |
| 80 | "…nuty śliwki **pasują do sosu z duszenia**" → "…**wtapiają się w winny sos**" | "sos z duszenia" — kalka |
| 81 | "…mineralność **utrzymują smaki ryby w centrum**" → "…**zachowują czystość smaku ryby**" | calque (focused) |
| 82 | "…i **sos anchois**" → "…i **sos z anchois**" | składnia |
| 83 | "Rosé **oferuje owocowy kontrast**…" → "Rosé **daje owocowy kontrapunkt**…" | handlowe "oferuje" |
| 84 | "…krem truflowy i **dojrzewające** comté" → "…**długo dojrzewające** comté" | aged=długo dojrzewający |
| 85 | "Bąbelki Champagne **redukują** tłustość i **resetują**…" → "…**przecinają** tłustość i **odświeżają**…" | anglicyzmy |
| 86 | "Tostowe nuty **odpowiadają karmelizowanemu wierzchu, pozostając świeże**" → "…**współgrają z karmelizowanym wierzchem, zachowując świeżość**" | calque + błędny celownik |
| 87 | "…owocowej nuty **bez przesłodzenia deseru**" → "…owocowej nuty, **nie dosładzając deseru**" | zgrabniejsza składnia |

### r5 — Maido (21)

| # | Old → New | Reason |
|---|---|---|
| 88 | "…(Nikkei) **restauracja degustacyjna**…" → "…**restauracja z menu degustacyjnym**…" | kalka (tasting house) |
| 89 | "**Cytrusowy curd**, owoce pestkowe…" → "**Lemon curd**, owoce pestkowe…" | spójność z resztą kart |
| 90 | "…grafit i **wypolerowany dąb**" → "…grafit i **gładka dębowa nuta**" | calque (polished oak) |
| 91 | "…kakao i **strukturalna wyrazistość w ustach**" → "…kakao i **zwarta struktura w ustach**" | kalka (structured mouthfeel) |
| 92 | "**Pikantna** kwasowość **odpowiada** limonce i **utrzymuje rybę w pełnej świeżości**" → "**Rześka** kwasowość **współgra z** limonką i **podkreśla świeżość ryby**" | zesty≠pikantny + calque |
| 93 | "**Strukturalne** Chardonnay **wspiera**…" → "**Treściwe** Chardonnay **dopełnia**…" | textured/supports — kalki |
| 94 | "…treściwość Malbeca **dorównują wołowinie**…" → "…**dotrzymują kroku wołowinie**…" | calque |
| 95 | "Kremowy **gulasz** z kurczaka…" → "Kremowa **potrawka** z kurczaka…" | ají de gallina = potrawka |
| 96 | "Kremowa tekstura Chardonnay **odpowiada treściwości**…" → "…**współgra z treściwością**…" | calque |
| 97 | "Kwiatowe aromaty **chłodzą ciepło** żółtego chili" → "…**studzą pikantność** żółtego chili" | kalka (warmth) |
| 98 | "**Warstwowy terrine ziemniaczany**…" → "**Warstwowa terrina ziemniaczana**…" | rodzaj gramatyczny |
| 99 | "Świeży słony profil **uzupełnia**…" → "Świeży, słony profil **dopełnia**…" | kolokacja |
| 100 | "**Zaokrąglona tekstura białego** pasuje…" → "**Krągła tekstura białego wina** pasuje…" | kalka (rounded) + elipsa |
| 101 | "Taniny Cabernet pasują do **grillowanego białka i nut z węgla**" → "…do **mięsa z grilla i dymnych nut węgla**" | laboratoryjne "białko" |
| 102 | "Owocowe Chardonnay **uzupełnia**…" → "…**dopełnia**…" | kolokacja |
| 103 | "…radzi sobie z jagnięciną i **ziołowym duszeniem**" → "…**udźwignie jagnięcinę i ziołową głębię sosu**" | kalka (herbal braise) |
| 104 | "…miękkość **malbeca**…" → "…miękkość **Malbeca**…" | spójność zapisu w pliku |
| 105 | "…z sadzonym jajkiem i **salsa criolla**" → "…i **salsą criolla**" | deklinacja |
| 106 | "…chrupiącego, **wytrawnego** placka z fasoli" → "…**treściwego** placka z fasoli" | savory≠wytrawny |
| 107 | "…ciemne owoce **uzupełniają**…" → "…**dopełniają**…" | kolokacja |
| 108 | "…równoważy **słodką teksturę** smażonego ciasta" → "…równoważy **słodycz** smażonego ciasta" | kalka (sweet texture) |

## src/data/seed-pairing.ts (7)

| # | Old → New | Reason |
|---|---|---|
| 109 | "…z mineralnym **zakończeniem** i **wyraźną**…" → "…z mineralnym **finiszem** i **wyrazistą**…" | finisz (spójność) |
| 110 | "…muszli ostrygi i **napięte, słone zakończenie**" → "…i **napięty, słony finisz**" | finisz |
| 111 | "Riesling … **przebija** masło czosnkowo-ziołowe…" → "…**przecina** masło…" | przebić≠cut through |
| 112 | "**Czerwono-owocowy rdzeń** i miękkie taniny **odpowiadają** …, nie **dominując dania**" → "**Czerwone owoce** i miękkie taniny **współgrają z** …, nie **przytłaczając dania**" | kalki (core/echo) + rekcja "dominować" |
| 113 | "Półwytrawny Riesling **rozcina**…" → "…**przecina**…" | kolokacja |
| 114 | "…wydobywa szalotkę i kapary, nie **miażdżąc** ich" → "…nie **przytłaczając** ich" | kalka (crushing) |
| 115 | "Truskawka i **cytrus** … **podnoszą** oliwę truflową, **zachowując delikatność dla przegrzebków**" → "Truskawka i **cytrusy** … **podkreślają** oliwę truflową, **pozostając dość delikatne dla przegrzebków**" | kalki (lift / delicate for) |

---

Left intentionally untouched (defensible as-is, sommelier may still veto):
"napięta struktura/cytrusy" (używane w polskim języku winiarskim), "nerw cytrusowy",
"pod treściwe dania", nieodmienne "Champagne"/"Sancerre"/"Chablis" (nazwy apelacji),
"dębowane" (żargon akceptowalny), "pikantny finisz" (Vega Sicilia), "espuma"/"tuile"/
"leche de tigre" i inne zapożyczenia menu, "risotto z kaszy pęczak".
