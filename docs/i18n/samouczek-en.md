# Vinovigator — Samouczek EN translation pack

Complete English translations for every Polish content/UI string in the wine-tutorial flow.
Sources (read 2026-07-06, repo `/Users/Andrey/App/web_wn`, branch `main`):

1. `src/data/wine-compass-kb.ts`
2. `src/components/winocompas/StagedTutorial.tsx`
3. `src/components/winocompas/InteractiveCompass.tsx`
4. `src/app/[locale]/samouczek/SamouczekClient.tsx`
5. `src/lib/dryness.ts` (bucket labels rendered by the DrynessMeter — included for completeness)

## Terminology decisions (keep consistent when wiring)

| PL term | EN term | Note |
|---|---|---|
| Vinokompas (PL spelling) | **Vinocompas** | Canonical brand spelling per vinocompas.pl; proper noun, otherwise unchanged |
| Vinovigator, winnica.pl, parfumealavin, Cellar Compass | unchanged | Proper nouns |
| sektor / wrażenie | **sensation** | The 6 wheel wedges are "sensations"; use "wheel sector" only when describing the SVG geometry |
| tendencja | **tendency** (stage-2 UI voice: **aroma**) | 12 sub-divisions |
| smaki bazowe | **base tastes** | Sweetness / Astringency / Acidity |
| wytrawność | **dryness** | |
| Świeże / Świeżość | **Fresh / Freshness** | |
| Oleiste / Oleistość | **Unctuous / Unctuousness** | Trade term for gęste-lepkie-słodkie richness; "oily" reads negative in EN wine talk |
| Miękkie / Miękkość | **Soft / Softness** | |
| Tęgie / Tęgość | **Bold / Boldness** | "bold reds" register |
| Szorstkie / Szorstkość | **Grippy / Grip** | "tannic grip"; avoids colliding with Astringency (the base taste) |
| Ziemiste / Ziemistość | **Earthy / Earthiness** | |
| Słodycz | **Sweetness** | |
| Cierpkość | **Astringency** | |
| Kwasowość | **Acidity** | |
| Etap | **Stage** | |
| Auto-przewodnik / przewodnik | **auto-guide / guide** | |

Out of scope, flagged for the wiring pass: `src/data/samouczek-wines.ts` (`name_pl`, `region_pl`, `why_pl` of 18 wines — rendered by `InlineProposals`) and the OpenAI system prompt in `buildChatSystemPrompt()` (assembled from the KB fields below plus PL-only prompt scaffolding that instructs the bot to answer in Polish — needs a locale-aware variant, not a string swap).

---

# 1. src/data/wine-compass-kb.ts

## 1.1 COMPASS_SECTORS

### Sector `tegie`

```
tegie.name_pl: sector display name (wheel wedge + panels)
PL: Tęgie
EN: Bold
```

```
tegie.noun_pl: noun form
PL: Tęgość
EN: Boldness
```

```
tegie.short_pl: 1-line essence (side panel, tour typewriter)
PL: Orientalne, ciepłe, ciężkie, intensywne, gęste i słodkie.
EN: Oriental, warm, heavy, intense, dense and sweet.
```

```
tegie.long_pl: full description (details disclosure)
PL: To co jest tęgie jest też w odczuciach orientalne, ciepłe, ciężkie, intensywne, gęste i słodkie. Dwie tendencje: czekolada/kawa/tytoń oraz suszone owoce.
EN: Whatever feels bold also feels oriental, warm, heavy, intense, dense and sweet on the palate. Two tendencies: chocolate/coffee/tobacco and dried fruit.
```

#### Tendencja `tegie.cigaro`

```
tegie.cigaro.name_pl
PL: Czekolada, kawa, tytoń
EN: Chocolate, coffee, tobacco
```

```
tegie.cigaro.shortLabel_pl: compact dial label (1-2 words)
PL: Czekolada
EN: Chocolate
```

```
tegie.cigaro.associations_pl
PL: czekolada, kawa, tytoń, słodkie cygaro
EN: chocolate, coffee, tobacco, a sweet cigar
```

```
tegie.cigaro.examples_pl
PL: Ciężka tendencja, która przywodzi na myśl „klub gentelmena”, „klub golfowy”, „sklep ze słodyczami” czy „sklep z cygarami”. Zwykle w winach czerwonych.
EN: A weighty tendency that calls to mind a gentlemen's club, a golf clubhouse, an old-fashioned sweet shop or a cigar store. Usually found in red wines.
```

```
tegie.cigaro.found_in_pl
PL: wina czerwone (głównie)
EN: red wines (mostly)
```

#### Tendencja `tegie.suszone`

```
tegie.suszone.name_pl
PL: Suszone owoce
EN: Dried fruit
```

```
tegie.suszone.shortLabel_pl
PL: Suszone
EN: Dried fruit
```

```
tegie.suszone.associations_pl
PL: w czerwonych: wędzone śliwki, suszone śliwki, daktyle, żurawina. W białych: suszona morela, rodzynki, daktyle, jabłka, pomarańcze, banany, orientalne przyprawy
EN: in reds: smoked plums, prunes, dates, cranberries. In whites: dried apricot, raisins, dates, apples, oranges, bananas, oriental spices
```

```
tegie.suszone.examples_pl
PL: Intensywne wrażenie. To trochę skojarzenie z wigilijnym suszem.
EN: An intense sensation — think of the dried-fruit compote served on Christmas Eve.
```

```
tegie.suszone.found_in_pl
PL: wina dojrzałe, mocne
EN: mature, powerful wines
```

### Sector `miekkie`

```
miekkie.name_pl
PL: Miękkie
EN: Soft
```

```
miekkie.noun_pl
PL: Miękkość
EN: Softness
```

```
miekkie.short_pl
PL: Skojarzenie z latem i przyjemnościami. Dojrzałe owoce i konfitury.
EN: Think summer and simple pleasures. Ripe fruit and preserves.
```

```
miekkie.long_pl
PL: Myślę, że z tym wrażeniem nie będziecie mieć problemów. To skojarzenie z latem i przyjemnościami. Tendencje: dojrzałe owoce i konfitury.
EN: This is one sensation you won't struggle with. It speaks of summer and pleasure. Tendencies: ripe fruit and preserves.
```

#### Tendencja `miekkie.dojrzale`

```
miekkie.dojrzale.name_pl
PL: Dojrzałe owoce
EN: Ripe fruit
```

```
miekkie.dojrzale.shortLabel_pl
PL: Dojrzałe
EN: Ripe fruit
```

```
miekkie.dojrzale.associations_pl
PL: w czerwonym: śliwki, wiśnie, maliny, jagody, truskawki, jeżyny, figi, porzeczka. W białym: jabłka, gruszki, morele, agrest
EN: in reds: plums, cherries, raspberries, blueberries, strawberries, blackberries, figs, currants. In whites: apples, pears, apricots, gooseberries
```

```
miekkie.dojrzale.examples_pl
PL: Klasyczne owocowe nuty występujące w młodych, owocowych winach.
EN: The classic fruit notes found in young, fruit-forward wines.
```

```
miekkie.dojrzale.found_in_pl
PL: wina czerwone i białe - różne owoce
EN: red and white wines — different fruits in each
```

#### Tendencja `miekkie.konfitury`

```
miekkie.konfitury.name_pl
PL: Konfitury
EN: Preserves
```

```
miekkie.konfitury.shortLabel_pl
PL: Konfitury
EN: Preserves
```

```
miekkie.konfitury.associations_pl
PL: konfitury z jabłka, truskawki - owoce upieczone, usmażone, skarmelizowane
EN: apple or strawberry preserves — fruit that has been baked, stewed or caramelised
```

```
miekkie.konfitury.examples_pl
PL: Konfitury różnią się od dojrzałych owoców intensywnością. Tutaj jabłko czy truskawka są upieczone, usmażone, czy skarmelizowane.
EN: Preserves differ from ripe fruit in intensity. Here the apple or strawberry has been baked, stewed or caramelised.
```

```
miekkie.konfitury.found_in_pl
PL: wina dojrzałe, treściwe
EN: mature, full-bodied wines
```

### Sector `oleiste`

```
oleiste.name_pl
PL: Oleiste
EN: Unctuous
```

```
oleiste.noun_pl
PL: Oleistość
EN: Unctuousness
```

```
oleiste.short_pl
PL: Wszystko co gęste, lepkie, słodkie i żywiczne.
EN: Everything dense, sticky, sweet and resinous.
```

```
oleiste.long_pl
PL: Znajdujemy tu wszystko co gęste, lepkie, słodkie i żywiczne. Mamy tu dwie tendencje: masłowość/tostowość/orzechy oraz owoce tropikalne.
EN: Here you'll find everything dense, sticky, sweet and resinous. Two tendencies live here: butter/toast/nuts and tropical fruit.
```

#### Tendencja `oleiste.maslo`

```
oleiste.maslo.name_pl
PL: Masłowość, tostowość, orzechy
EN: Butter, toast, nuts
```

```
oleiste.maslo.shortLabel_pl
PL: Masło
EN: Butter
```

```
oleiste.maslo.associations_pl
PL: masło, orzechy, tosty, drożdże, ciasteczka maślane, pierniczki
EN: butter, nuts, toast, yeast, butter biscuits, gingerbread
```

```
oleiste.maslo.examples_pl
PL: Różnego rodzaju produkty „tłuste”. Tego rodzaju wrażenia spotykamy w wielu gatunkach win białych jak i czerwonych.
EN: All manner of "rich" flavours. You'll meet these sensations across many white and red wine styles alike.
```

```
oleiste.maslo.found_in_pl
PL: wina białe i czerwone
EN: white and red wines
```

#### Tendencja `oleiste.tropikalne`

```
oleiste.tropikalne.name_pl
PL: Owoce tropikalne
EN: Tropical fruit
```

```
oleiste.tropikalne.shortLabel_pl
PL: Tropikalne
EN: Tropical
```

```
oleiste.tropikalne.associations_pl
PL: mango, ananas, papaja, marakuja, banan, liczi
EN: mango, pineapple, papaya, passion fruit, banana, lychee
```

```
oleiste.tropikalne.examples_pl
PL: Oleistość żywiczna, pełnia słodyczy. Te doznania często odnajdziemy w białych winach.
EN: Resinous unctuousness, sweetness in full. You'll most often find these notes in white wines.
```

```
oleiste.tropikalne.found_in_pl
PL: wina białe (głównie)
EN: white wines (mostly)
```

### Sector `swieze`

```
swieze.name_pl
PL: Świeże
EN: Fresh
```

```
swieze.noun_pl
PL: Świeżość
EN: Freshness
```

```
swieze.short_pl
PL: Wszystko co kwaśne, cierpkie, ale też odświeżające i rześkie. Łatwe skojarzenie to lemoniada albo zielony ogórek.
EN: Everything tart and astringent — yet refreshing and crisp. The easy association: lemonade, or a fresh green cucumber.
```

```
swieze.long_pl
PL: Świeżość to wszystko to co kwaśne, cierpkie, ale też odświeżające i rześkie. Łatwe skojarzenie to lemoniada, albo zielony ogórek. Mamy tu dwie tendencje: zielone warzywa i owoce oraz cytrusy.
EN: Freshness is everything tart and astringent — yet refreshing and crisp. The easiest association is lemonade, or a fresh green cucumber. Two tendencies live here: green vegetables and fruit, and citrus.
```

#### Tendencja `swieze.zielone`

```
swieze.zielone.name_pl
PL: Zielone warzywa i owoce
EN: Green vegetables and fruit
```

```
swieze.zielone.shortLabel_pl
PL: Zielone
EN: Green
```

```
swieze.zielone.associations_pl
PL: melon, winogrona, seler, ogórek, karczoch, szparagi
EN: melon, grapes, celery, cucumber, artichoke, asparagus
```

```
swieze.zielone.examples_pl
PL: Te doznania często odnajdziemy w białych winach, warzywne tendencje spotykamy też często w winach czerwonych.
EN: You'll often find these notes in white wines; vegetal tendencies also appear frequently in reds.
```

```
swieze.zielone.found_in_pl
PL: wina białe (głównie) i czerwone
EN: white wines (mostly) and reds
```

#### Tendencja `swieze.cytrusy`

```
swieze.cytrusy.name_pl
PL: Cytrusy
EN: Citrus
```

```
swieze.cytrusy.shortLabel_pl
PL: Cytrusy
EN: Citrus
```

```
swieze.cytrusy.associations_pl
PL: cytryny, grejpfruty, pomarańcze, mandarynki
EN: lemons, grapefruit, oranges, mandarins
```

```
swieze.cytrusy.examples_pl
PL: Tego rodzaju wrażenia spotykamy w wielu gatunkach win białych jak i czerwonych.
EN: You'll meet these sensations across many white and red wine styles alike.
```

```
swieze.cytrusy.found_in_pl
PL: wina białe i czerwone
EN: white and red wines
```

### Sector `ziemiste`

```
ziemiste.name_pl
PL: Ziemiste
EN: Earthy
```

```
ziemiste.noun_pl
PL: Ziemistość
EN: Earthiness
```

```
ziemiste.short_pl
PL: Wyobraź sobie, że kładziesz się na ziemi: las, łąka, rzeka, świeża ziemia.
EN: Imagine lying down on the ground: forest, meadow, riverbank, freshly turned earth.
```

```
ziemiste.long_pl
PL: Wrażenie ziemistości najłatwiej pojąć gdy wyobrazimy sobie, że kładziemy się na ziemi. Może to być las, łąka, okolice rzeki, trawnik, pole czy też świeżo wysypana ziemia. Mamy tu dwie tendencje: minerały oraz ściółka leśna.
EN: Earthiness is easiest to grasp if you imagine lying down on the ground. It might be a forest, a meadow, a riverbank, a lawn, a field, or freshly turned soil. Two tendencies live here: minerals and forest floor.
```

#### Tendencja `ziemiste.mineraly`

```
ziemiste.mineraly.name_pl
PL: Minerały
EN: Minerals
```

```
ziemiste.mineraly.shortLabel_pl
PL: Minerały
EN: Minerals
```

```
ziemiste.mineraly.associations_pl
PL: kamienie, rzeka, akweny wodne, woda mineralna - bąbelki na języku, „szczypanie”
EN: stones, rivers, open water, sparkling mineral water — the prickle of bubbles on the tongue
```

```
ziemiste.mineraly.examples_pl
PL: Pamiętacie jak pachnie morze? Ten zapach też.
EN: Remember what the sea smells like? That scent belongs here too.
```

```
ziemiste.mineraly.found_in_pl
PL: wina białe i czerwone
EN: white and red wines
```

#### Tendencja `ziemiste.sciolka`

```
ziemiste.sciolka.name_pl
PL: Ściółka leśna
EN: Forest floor
```

```
ziemiste.sciolka.shortLabel_pl
PL: Ściółka
EN: Forest floor
```

```
ziemiste.sciolka.associations_pl
PL: ściółka leśna, ścięta trawa, fiołki, lawenda
EN: forest floor, cut grass, violets, lavender
```

```
ziemiste.sciolka.examples_pl
PL: Wrażenia kojarzone z lasem, glebą zwykle znajdujemy w winach czerwonych; trawę mamy w białych jak Sauvignon Blanc.
EN: Notes of forest and soil usually turn up in red wines; the grass belongs to whites like Sauvignon Blanc.
```

```
ziemiste.sciolka.found_in_pl
PL: wina czerwone (las/gleba), białe (trawa)
EN: red wines (forest/soil), whites (grass)
```

### Sector `szorstkie`

```
szorstkie.name_pl
PL: Szorstkie
EN: Grippy
```

```
szorstkie.noun_pl
PL: Szorstkość
EN: Grip
```

```
szorstkie.short_pl
PL: Uczucie cierpkości, suchości na języku. Powąchaj skórę albo kawałek deski.
EN: That astringent, drying feel on the tongue. Smell a piece of leather, or a plank of raw wood.
```

```
szorstkie.long_pl
PL: Wrażenie szorstkości odpowiada za uczucie cierpkości, suchości na języku. Jak sobie je wyobrazić? Powąchajcie skórę, albo kawałek deski. Spróbujcie aronii albo cierpkiej, czarnej porzeczki, która aż ściąga całą buzię w dzióbek. Mamy tu dwie tendencje: piżmo/skóra oraz dąb/dym/garbniki.
EN: Grip is what gives that astringent, drying feel on the tongue. How to picture it? Smell a piece of leather, or a plank of raw wood. Taste chokeberries, or blackcurrants so tart they pucker your whole mouth. Two tendencies live here: musk/leather and oak/smoke/tannins.
```

#### Tendencja `szorstkie.pizmo`

```
szorstkie.pizmo.name_pl
PL: Piżmo, skóra
EN: Musk, leather
```

```
szorstkie.pizmo.shortLabel_pl
PL: Piżmo
EN: Musk
```

```
szorstkie.pizmo.associations_pl
PL: skojarzenia zwierzęce - zapach mokrego psa, konia, stajni, skóry
EN: animal associations — the smell of wet dog, horse, stable, leather
```

```
szorstkie.pizmo.examples_pl
PL: Tego rodzaju wrażenia spotykamy w czerwonych winach.
EN: You'll meet these sensations in red wines.
```

```
szorstkie.pizmo.found_in_pl
PL: wina czerwone
EN: red wines
```

#### Tendencja `szorstkie.dab`

```
szorstkie.dab.name_pl
PL: Dąb, dym, garbniki
EN: Oak, smoke, tannins
```

```
szorstkie.dab.shortLabel_pl
PL: Dąb
EN: Oak
```

```
szorstkie.dab.associations_pl
PL: drewno, nieheblowana deska, zapach ogniska, tytoń z papierosa, ściąganie na języku przy cierpkich owocach
EN: wood, a rough-sawn plank, the smell of a campfire, cigarette tobacco, the pucker that tart fruit leaves on the tongue
```

```
szorstkie.dab.examples_pl
PL: Szeroka rodzina wrażeń „szorstkich” i „cierpkich”.
EN: A broad family of "grippy" and "astringent" sensations.
```

```
szorstkie.dab.found_in_pl
PL: wina czerwone
EN: red wines
```

## 1.2 BASE_TASTES

```
slodycz.name_pl
PL: Słodycz
EN: Sweetness
```

```
slodycz.description_pl
PL: Naturalny cukier resztkowy w winie. Od wytrawnych (brak słodyczy) po słodkie wina deserowe.
EN: The natural residual sugar in a wine. From dry (no sweetness at all) through to sweet dessert wines.
```

```
cierpkosc.name_pl
PL: Cierpkość
EN: Astringency
```

```
cierpkosc.description_pl
PL: Wrażenie ściągania na języku. W czerwonych winach pochodzi głównie od garbników (tanin), w białych może pochodzić od młodych owoców.
EN: That puckering, drying sensation on the tongue. In red wines it comes mainly from tannins; in whites it can come from young fruit.
```

```
kwasowosc.name_pl
PL: Kwasowość
EN: Acidity
```

```
kwasowosc.description_pl
PL: „Świeżość”, ślinienie podniebienia. Wina o wysokiej kwasowości pijemy z radością - odświeżają jak lemoniada.
EN: "Freshness" — the way a wine makes your mouth water. High-acid wines are a joy to drink: they refresh like lemonade.
```

## 1.3 METHOD_STEPS

```
wzrok.title_pl
PL: Wzrok
EN: Sight
```

```
wzrok.body_pl
PL: Spójrz na wino: jaki ma kolor (głębia, intensywność), gęstość (czy spływa po szkle wolno czy szybko), czy jest spokojne czy musujące?
EN: Look at the wine: what colour is it (depth, intensity)? How viscous — do the legs run down the glass slowly or quickly? Is it still or sparkling?
```

```
dotyk.title_pl
PL: Dotyk (w ustach)
EN: Touch (in the mouth)
```

```
dotyk.body_pl
PL: Zwróć uwagę na gęstość i konsystencję - czy wino jest lekkie i wodniste, czy gęste i oleiste?
EN: Pay attention to body and texture — is the wine light and watery, or dense and unctuous?
```

```
zapach.title_pl
PL: Zapach - bez nosa i z nosem
EN: Smell — nose pinched, then open
```

```
zapach.body_pl
PL: Tutaj robi się ciekawie. Najpierw zatkaj nos i wypij łyk - to oddaje czysty smak (słodycz, cierpkość, kwasowość). Potem otwórz nos i powąchaj - wszystkie wrażenia z 6 sektorów kompasu pojawią się w nosie.
EN: This is where it gets interesting. First pinch your nose and take a sip — that gives you pure taste (sweetness, astringency, acidity). Then release your nose and smell — all six sensations of the compass will arrive through the nose.
```

```
smak.title_pl
PL: Smak
EN: Taste
```

```
smak.body_pl
PL: Gdyby wino składało się tylko ze smaku, mówilibyśmy że wyczuwamy w nim: słodycz, cierpkość lub kwasowość. To są 3 podstawowe wrażenia smakowe - niezależne od 6 wrażeń aromatycznych z kompasu.
EN: If wine were made of taste alone, all we could say is that we detect sweetness, astringency or acidity. These are the 3 base tastes — independent of the compass's 6 aromatic sensations.
```

```
kompas.title_pl
PL: Ułóż na kompasie
EN: Plot it on the compass
```

```
kompas.body_pl
PL: Każde z 6 wrażeń (świeże, oleiste, miękkie, tęgie, szorstkie, ziemiste) ma 2 tendencje. Zaznacz na kompasie intensywność każdej tendencji (od 0 do 5). To jest twój profil smaku tego wina.
EN: Each of the 6 sensations (fresh, unctuous, soft, bold, grippy, earthy) has 2 tendencies. Mark the intensity of each tendency on the compass (from 0 to 5). That is your taste profile of this wine.
```

```
porownaj.title_pl
PL: Porównaj wina
EN: Compare wines
```

```
porownaj.body_pl
PL: Zakręć kieliszkiem, powąchaj, spróbuj win, powąchaj jeszcze raz. Na podstawie znanych już wrażeń i tendencji opisz wina i to, czym się różnią. Stwórz własny Vinokompas i znajdź wina, które naprawdę lubisz.
EN: Swirl the glass, nose it, taste the wines, nose them again. Using the sensations and tendencies you now know, describe the wines and how they differ. Build your own Vinocompas and find the wines you truly love.
```

## 1.4 FAQ_ITEMS

```
faq[0].q_pl
PL: Co to jest Vinokompas?
EN: What is Vinocompas?
```

```
faq[0].a_pl
PL: To system opisu wina oparty na 6 wrażeniach zmysłowych (świeże, oleiste, miękkie, tęgie, szorstkie, ziemiste) i 3 podstawowych smakach (słodycz, cierpkość, kwasowość). Każde wrażenie ma 2 tendencje. Po zaznaczeniu intensywności każdej tendencji otrzymujesz unikalny profil smakowy wina - i możesz szukać innych win do niego podobnych.
EN: It's a system for describing wine built on 6 sensory sensations (fresh, unctuous, soft, bold, grippy, earthy) and 3 base tastes (sweetness, astringency, acidity). Each sensation has 2 tendencies. Once you've marked the intensity of each tendency, you get a unique taste profile of the wine — and you can go looking for other wines that resemble it.
```

```
faq[1].q_pl
PL: Co to jest tendencja?
EN: What is a tendency?
```

```
faq[1].a_pl
PL: Tendencja to skojarzenie, które przeważa w danym wrażeniu. Na przykład wrażenie „świeże” ma 2 tendencje: cytrusy i zielone warzywa/owoce. Każde wrażenie ma 2 wyraźne tendencje - to cała filozofia.
EN: A tendency is the association that dominates within a given sensation. The "fresh" sensation, for instance, has 2 tendencies: citrus and green vegetables/fruit. Every sensation has 2 distinct tendencies — that's the whole philosophy.
```

```
faq[2].q_pl
PL: Jak rozróżnić wrażenia od tendencji?
EN: How do I tell sensations from tendencies?
```

```
faq[2].a_pl
PL: Wrażenie to ogólna kategoria (np. „świeże”). Tendencja to konkretne skojarzenie wewnątrz tej kategorii (np. „cytrusy” albo „zielone warzywa”). Jedno wino może być świeże w stronę cytrusów (jak Riesling), inne świeże w stronę zielonych warzyw (jak Sauvignon Blanc).
EN: A sensation is the broad category (e.g. "fresh"). A tendency is the specific association inside that category (e.g. "citrus" or "green vegetables"). One wine can be fresh leaning towards citrus (like a Riesling), another fresh leaning towards green vegetables (like a Sauvignon Blanc).
```

```
faq[3].q_pl
PL: Co znaczy „cierpkość”?
EN: What does "astringency" mean?
```

```
faq[3].a_pl
PL: Cierpkość to uczucie ściągania na języku. W czerwonych winach pochodzi głównie od garbników (tanin) zawartych w skórkach winogron i drewnie beczki. Pomyśl o aronii albo czarnej porzeczce - aż ściąga buzię.
EN: Astringency is that puckering, drying grip on the tongue. In red wines it comes mainly from the tannins in grape skins and barrel wood. Think of chokeberries or blackcurrants — the way they pull your mouth tight.
```

```
faq[4].q_pl
PL: Czym różni się „świeże” od „oleiste”?
EN: What's the difference between "fresh" and "unctuous"?
```

```
faq[4].a_pl
PL: Świeże wino jest kwaśne, rześkie, lekkie - jak lemoniada. Oleiste wino jest gęste, lepkie, słodkie - jak masło, orzechy, mango. Świeże orzeźwia, oleiste otula. Można też mieć wino które jednocześnie świeże i lekko oleiste - wtedy zaznacz oba sektory na kompasie z różną intensywnością.
EN: A fresh wine is tart, crisp, light — like lemonade. An unctuous wine is dense, sticky, sweet — think butter, nuts, mango. Fresh refreshes; unctuous envelops. A wine can also be fresh and lightly unctuous at once — in that case mark both sensations on the compass at different intensities.
```

```
faq[5].q_pl
PL: Czym różni się „miękkie” od „tęgie”?
EN: What's the difference between "soft" and "bold"?
```

```
faq[5].a_pl
PL: Miękkie to dojrzałe owoce i konfitury - letnie, przyjemne, owocowe. Tęgie to czekolada, kawa, tytoń i suszone owoce - orientalne, ciężkie, intensywne. Wino miękkie pijemy łatwo, wino tęgie wymaga uwagi i często długiego oddychania w karafce.
EN: Soft means ripe fruit and preserves — summery, easy, fruit-driven. Bold means chocolate, coffee, tobacco and dried fruit — oriental, heavy, intense. A soft wine drinks easily; a bold wine demands attention, and often a long breathe in the decanter.
```

```
faq[6].q_pl
PL: Czym różni się „szorstkie” od „ziemiste”?
EN: What's the difference between "grippy" and "earthy"?
```

```
faq[6].a_pl
PL: Szorstkie to wrażenie cierpkości, suchości - piżmo, skóra, dąb, dym, garbniki. Ziemiste to wrażenie ziemi, lasu, minerałów. Szorstkie wina mają taniny i drewno; ziemiste mają nuty terroir - kamienia, ściółki leśnej, kwiatów polnych.
EN: Grippy is the sensation of astringency and dryness — musk, leather, oak, smoke, tannins. Earthy is the sensation of soil, forest and minerals. Grippy wines carry tannin and wood; earthy wines carry notes of terroir — stone, forest floor, wildflowers.
```

```
faq[7].q_pl
PL: Jakie wino dla kogoś kto lubi tytoń i kawę?
EN: Which wine for someone who loves tobacco and coffee?
```

```
faq[7].a_pl
PL: Szukaj wina z wysokim wskaźnikiem w sektorze „tęgie” (tendencja czekolada/kawa/tytoń) i często też „szorstkie” (dąb, garbniki). To zwykle dojrzałe czerwone wina z beczki: Cabernet Sauvignon, Brunello di Montalcino, Tignanello, Vega Sicilia, Chateauneuf-du-Pape.
EN: Look for a wine scoring high in the "bold" sensation (the chocolate/coffee/tobacco tendency), and often "grippy" too (oak, tannins). That usually means mature, barrel-aged reds: Cabernet Sauvignon, Brunello di Montalcino, Tignanello, Vega Sicilia, Châteauneuf-du-Pape.
```

```
faq[8].q_pl
PL: Jakie wino dla kogoś kto lubi cytrusy?
EN: Which wine for someone who loves citrus?
```

```
faq[8].a_pl
PL: Szukaj wina z wysokim wskaźnikiem w sektorze „świeże” (tendencja cytrusy). Klasyki to Riesling z Alzacji albo Mozeli, Sauvignon Blanc z Loary lub Nowej Zelandii (Cloudy Bay), Albarino z Galicji, Chablis z Burgundii.
EN: Look for a wine scoring high in the "fresh" sensation (the citrus tendency). The classics: Riesling from Alsace or the Mosel, Sauvignon Blanc from the Loire or New Zealand (Cloudy Bay), Albariño from Galicia, Chablis from Burgundy.
```

```
faq[9].q_pl
PL: Jakie wino dla kogoś kto lubi czekoladę?
EN: Which wine for someone who loves chocolate?
```

```
faq[9].a_pl
PL: Sektor „tęgie” (czekolada, kawa, tytoń) - pełne czerwone z dębem. Też dobrze będą wina deserowe ze strony „miękkie/konfitury”: Banyuls, Maury, Porto LBV, Recioto della Valpolicella.
EN: The "bold" sensation (chocolate, coffee, tobacco) — full-bodied, oaked reds. Dessert wines from the "soft/preserves" side work beautifully too: Banyuls, Maury, LBV Port, Recioto della Valpolicella.
```

```
faq[10].q_pl
PL: Jak korzystać z kompasu w restauracji?
EN: How do I use the compass in a restaurant?
```

```
faq[10].a_pl
PL: 1) Powiedz kelnerowi swój profil smaku (np. „lubię świeże cytrusowe” albo „lubię tęgie z kawą”). 2) Albo zeskanuj QR Cellar Compass w restauracji - wybierz danie, system pokaże top-3 wina pasujące do dania, z uzasadnieniem. Działa też w drugą stronę: wybierz wino, system zaproponuje dania.
EN: 1) Tell the waiter your taste profile (e.g. "I like fresh and citrusy" or "I like bold with coffee"). 2) Or scan the Cellar Compass QR code at the restaurant — pick a dish, and the system shows the top-3 wines for it, with the reasoning. It works the other way round too: pick a wine, and the system suggests dishes.
```

```
faq[11].q_pl
PL: Czy każde wino ma wszystkie 6 wrażeń?
EN: Does every wine have all 6 sensations?
```

```
faq[11].a_pl
PL: Każde wino ma jakąś obecność każdego z 6 wrażeń - ale często z bardzo różną intensywnością. Sauvignon Blanc będzie mocno w „świeże” (cytrusy, zielone) i prawie zero w „tęgie”. Zinfandel z USA - odwrotnie: mocno „tęgie” (suszone owoce), „miękkie” (konfitury), „szorstkie” (dąb).
EN: Every wine carries some presence of all 6 sensations — but often at very different intensities. A Sauvignon Blanc will run high in "fresh" (citrus, green) and near zero in "bold". A Zinfandel from the USA is the opposite: strongly "bold" (dried fruit), "soft" (preserves) and "grippy" (oak).
```

```
faq[12].q_pl
PL: Czy mam degustować z zatkanym nosem?
EN: Should I really taste with my nose pinched?
```

```
faq[12].a_pl
PL: Tak, na początku - to świetny trening. Gdy zatkaniesz nos, wino pokazuje tylko swoje 3 podstawowe smaki: słodycz, cierpkość, kwasowość. Gdy otworzysz nos - eksploduje aromatami z 6 sektorów kompasu. To pokazuje jak nos i język grają w pary.
EN: Yes, at first — it's excellent training. With your nose pinched, a wine shows only its 3 base tastes: sweetness, astringency, acidity. Release your nose — and it explodes with aromas from the compass's 6 sensations. It shows you how nose and tongue play as a pair.
```

```
faq[13].q_pl
PL: Co znaczy moja kombinacja na kompasie?
EN: What does my combination on the compass mean?
```

```
faq[13].a_pl
PL: Twój kompas to twój profil smaku. Im wyższe „świeże/cytrusy” tym częściej szukaj win cytrusowych. Im wyższe „tęgie/cigaro” tym mocniej idź w wina dojrzałe z beczką. Cellar Compass dopasowuje wina z menu restauracji właśnie pod taki profil - albo pod profil dania.
EN: Your compass is your taste profile. The higher your "fresh/citrus", the more you should seek out citrus-driven wines. The higher your "bold/cigar", the harder you should lean into mature, barrel-aged wines. Cellar Compass matches wines from the restaurant's list to exactly that profile — or to the profile of a dish.
```

---

# 2. src/components/winocompas/StagedTutorial.tsx

## 2.1 STYLE_LABEL_PL (wine-style badges on proposal cards)

```
STYLE_LABEL.white: style badge
PL: białe
EN: white
```

```
STYLE_LABEL.red: style badge
PL: czerwone
EN: red
```

```
STYLE_LABEL.rose: style badge
PL: różowe
EN: rosé
```

```
STYLE_LABEL.sparkling: style badge
PL: musujące
EN: sparkling
```

```
STYLE_LABEL.dessert: style badge
PL: deserowe
EN: dessert
```

## 2.2 InlineProposals (live wine proposals block)

```
InlineProposals.srStatus: screen-reader announcement (role="status"), ${matches.length} interpolated
PL: {n} propozycje win dopasowane do Twojego profilu
EN: {n} wine suggestions matched to your profile
```

```
InlineProposals.eyebrow: block eyebrow
PL: Twoje propozycje
EN: Your suggestions
```

```
InlineProposals.h3.enough: heading when matches are confident
PL: Wina dopasowane do Twojego smaku
EN: Wines matched to your taste
```

```
InlineProposals.h3.empty: heading when profile is empty (filled === 0)
PL: Ustaw Vinokompas, a wina pojawią się tutaj
EN: Set your Vinocompas and the wines will appear here
```

```
InlineProposals.h3.tuning: heading when profile is partial
PL: Jeszcze chwila - dobór się dostraja
EN: Almost there — the matching is fine-tuning
```

```
InlineProposals.p.enough: sub-copy when matches shown; ${filled}/${TARGET_FILLED} interpolated
PL: Liczba przy winie to podobieństwo profilu w %. Twój profil opisany w {filled}/{target} wymiarach - im pełniejszy, tym pewniejszy dobór.
EN: The number beside each wine is your profile similarity in %. Your profile is described across {filled}/{target} dimensions — the fuller it gets, the more confident the match.
```

```
InlineProposals.p.sparse: sub-copy (guardrail nudge); ${MIN_FILLED}, ${filled} interpolated
PL: Profil jest jeszcze zbyt ubogi na trafny dobór. Ustaw co najmniej {min} elementów (smaki wokół koła lub wrażenia-sektory) - masz {filled}/{min}. Jak w oryginalnym Vinokompasie: im więcej skojarzeń, tym celniej.
EN: Your profile is still too sparse for an accurate match. Set at least {min} elements (the tastes around the wheel, or the sensation sectors) — you have {filled}/{min}. Just like the original Vinocompas: the more associations, the sharper the aim.
```

```
InlineProposals.progressbar.ariaLabel: completeness meter aria-label
PL: Kompletność profilu
EN: Profile completeness
```

```
InlineProposals.ctaPairing: ghost CTA linking to /pairing
PL: Pełny dobór
EN: Full pairing
```

```
InlineProposals.priceFrom: price line on wine card; ${wine.priceFrom} interpolated, currency stays zł
PL: od {price} zł
EN: from {price} zł
```

```
InlineProposals.placeholderCard: ghosted placeholder caption; ${i + 1} interpolated
PL: Propozycja {n}
EN: Suggestion {n}
```

```
InlineProposals.footer: attribution footnote (winnica.pl is a link, keep as proper noun)
PL: Propozycje pochodzą z oferty winnica.pl - twórców metody Vinokompas. Dopasowanie liczone na żywo z Twojego profilu smaku.
EN: Suggestions come from the range at winnica.pl — the creators of the Vinocompas method. Matching is calculated live from your taste profile.
```

## 2.3 StageNav (stage tabs)

```
StageNav.item1.label: stage-1 tab title
PL: VINOKOMPAS
EN: VINOCOMPAS
```

```
StageNav.item1.sub: stage-1 tab subtitle
PL: smaki + 6 wrażeń
EN: tastes + 6 sensations
```

```
StageNav.item2.label: stage-2 tab title
PL: AROMATY
EN: AROMAS
```

```
StageNav.item2.sub: stage-2 tab subtitle
PL: 12 aromatów
EN: 12 aromas
```

```
StageNav.etap: tab kicker; ${it.n} interpolated
PL: ETAP {n}
EN: STAGE {n}
```

## 2.4 Stage controls (pinned top row)

```
controls.prev: previous-stage button
PL: ← Poprzedni etap
EN: ← Previous stage
```

```
controls.skip: skip-stage button
PL: Pomiń etap, pokaż wina →
EN: Skip stage, show wines →
```

```
controls.next: primary next-stage CTA
PL: Następny etap
EN: Next stage
```

```
controls.showWines: primary CTA on final stage (links to /pairing)
PL: Pokaż wina
EN: Show wines
```

## 2.5 StageVinokompas (stage 1)

```
stage1.eyebrow
PL: Etap I · Vinokompas
EN: Stage I · Vinocompas
```

```
stage1.h2
PL: Smak i sześć wrażeń
EN: Taste and the six sensations
```

```
stage1.intro: header paragraph (Słodycz/Cierpkość/Kwasowość rendered as <strong>)
PL: Najpierw trzy smaki bazowe - Słodycz, Cierpkość, Kwasowość - klikaj ich podpisy wokół koła, aby ustawić siłę (0-5; kolejne kliknięcie zaczyna od zera). Wskaźnik pod kołem od razu pokazuje, jak wytrawne jest Twoje wino. Potem klikaj sześć wrażeń na samym kole, aby dostroić profil. Nie wiesz od czego zacząć? Auto-przewodnik oprowadzi Cię po wszystkich sześciu.
EN: Start with the three base tastes — Sweetness, Astringency, Acidity — tap their labels around the wheel to set the strength (0-5; the next tap starts over from zero). The meter beneath the wheel shows straight away how dry your wine is. Then tap the six sensations on the wheel itself to fine-tune your profile. Not sure where to begin? The auto-guide will walk you through all six.
```

```
stage1.cue.tastes: tongue/nose method cue, first line (smaki rendered as <strong>)
PL: Podpisy wokół koła = smaki (język)
EN: Labels around the wheel = tastes (tongue)
```

```
stage1.cue.sensations: tongue/nose method cue, second line (wrażenia rendered as <strong>)
PL: Sektory koła = wrażenia (nos · aromaty)
EN: Wheel sectors = sensations (nose · aromas)
```

## 2.6 DrynessMeter

```
dryness.title: meter heading
PL: Wytrawność wina
EN: Wine dryness
```

```
dryness.zone.left: rail zone label (left end)
PL: Bardzo wytrawne
EN: Bone dry
```

```
dryness.zone.mid: rail zone label (centre, hidden on mobile)
PL: Półwytrawne
EN: Off-dry
```

```
dryness.zone.right: rail zone label (right end)
PL: Bardzo słodkie
EN: Lusciously sweet
```

```
dryness.disclaimer: honest-framing footnote
PL: Szacunek na podstawie trzech smaków bazowych - model poglądowy; pełny algorytm wytrawności w przygotowaniu.
EN: An estimate based on the three base tastes — an illustrative model; the full dryness algorithm is in the works.
```

### src/lib/dryness.ts — bucket labels (displayed live in the meter; MUST match the zone labels above)

```
dryness.label.bardzoWytrawne: bucket label, score < 8
PL: Bardzo wytrawne
EN: Bone dry
```

```
dryness.label.wytrawne: bucket label, score < 25
PL: Wytrawne
EN: Dry
```

```
dryness.label.polwytrawne: bucket label, score < 45
PL: Półwytrawne
EN: Off-dry
```

```
dryness.label.polslodkie: bucket label, score < 65
PL: Półsłodkie
EN: Medium sweet
```

```
dryness.label.slodkie: bucket label, score < 85
PL: Słodkie
EN: Sweet
```

```
dryness.label.bardzoSlodkie: bucket label, score >= 85
PL: Bardzo słodkie
EN: Lusciously sweet
```

## 2.7 StageAromaty (stage 2)

```
stage2.eyebrow
PL: Etap II · Aromaty
EN: Stage II · Aromas
```

```
stage2.h2
PL: Dwanaście aromatów
EN: Twelve aromas
```

```
stage2.intro: header paragraph (Auto-przewodnik rendered as <strong>)
PL: Tryb dla zaawansowanych: każde wrażenie ma dwa aromaty. Kliknij konkretny aromat na kole, aby dostroić profil (0-5). Po prawej - pełny opis i skojarzenia każdej z 12. Auto-przewodnik pokaże je po kolei.
EN: Advanced mode: each sensation has two aromas. Tap a specific aroma on the wheel to fine-tune your profile (0-5). On the right — the full description and associations for each of the 12. The auto-guide will present them one by one.
```

## 2.8 ChatToggle

```
chatToggle.title.enable: button title attribute when chat is off
PL: Włącz przewodnika
EN: Turn the guide on
```

```
chatToggle.title.disable: button title attribute when chat is on
PL: Wyłącz przewodnika
EN: Turn the guide off
```

```
chatToggle.label: visible toggle label
PL: Czat
EN: Chat
```

---

# 3. src/components/winocompas/InteractiveCompass.tsx

## 3.1 INTENSITY_COMMENTS (guide's reaction to the set intensity, 0-5)

```
intensity[0]
PL: Jeszcze nie zaznaczone - kliknij koło, aby ustawić siłę (0-5).
EN: Not set yet — tap the wheel to set the strength (0-5).
```

```
intensity[1]
PL: Ledwo wyczuwalne - subtelny akcent w tle.
EN: Barely perceptible — a subtle accent in the background.
```

```
intensity[2]
PL: Delikatne - lekko zaznaczone.
EN: Gentle — lightly present.
```

```
intensity[3]
PL: Umiarkowane - wyraźnie obecne, ale nie dominuje.
EN: Moderate — clearly present, but not dominating.
```

```
intensity[4]
PL: Mocne - jeden z głównych charakterów Twojego wina.
EN: Strong — one of your wine's defining characters.
```

```
intensity[5]
PL: Dominujące - definiuje styl, którego szukasz.
EN: Dominant — it defines the style you're after.
```

## 3.2 onAskGuide (chat prefill dispatched via `wn:open-chat`)

```
askGuide.prefill: chat prefill message; ${label} interpolated (sector/tendency/base-taste name)
PL: Opowiedz mi więcej o wrażeniu „{label}" - czego szukać w winie?
EN: Tell me more about the "{label}" sensation — what should I look for in a wine?
```

## 3.3 Under-compass hints

```
compass.tourHint: shown only while the auto-tour is running
PL: Każdą tendencję ustawiasz od 1 (ledwo wyczuwalna) do 5 (dominująca) - kliknij koło, aby wybrać siłę.
EN: You set each tendency from 1 (barely perceptible) to 5 (dominant) — tap the wheel to choose the strength.
```

```
compass.interactHint: persistent uppercase hint under the dial
PL: Najedź lub kliknij, aby ustawić intensywność
EN: Hover or tap to set the intensity
```

## 3.4 FocusedCard (side info panel)

```
focused.eyebrow.base: kind eyebrow for a base taste
PL: Smak bazowy
EN: Base taste
```

```
focused.eyebrow.sektor: kind eyebrow for a sensation (sector)
PL: Wrażenie
EN: Sensation
```

```
focused.eyebrow.tendencja: kind eyebrow for a tendency
PL: Tendencja
EN: Tendency
```

```
focused.eyebrow.tour: eyebrow while the auto-tour narrates
PL: Przewodnik mówi…
EN: The guide says…
```

```
focused.baseFootnote: extra paragraph under base-taste description
PL: Trzy smaki bazowe - cierpkość, słodycz, kwasowość - to podstawa rozumienia każdego wina. Im wyżej je zaznaczysz, tym wyraźniej dominują w twoim ulubionym profilu.
EN: The three base tastes — astringency, sweetness, acidity — are the foundation for understanding any wine. The higher you set them, the more clearly they dominate your favourite profile.
```

```
focused.fullDescription: <details> summary (appears twice: sektor view and tendencja view — same string)
PL: ❦ Pełny opis wrażenia
EN: ❦ Full sensation description
```

```
focused.dt.associations: definition-list label (tendencja view)
PL: Skojarzenia
EN: Associations
```

```
focused.dt.example: definition-list label (tendencja view)
PL: Przykład
EN: Example
```

```
focused.dt.foundIn: definition-list label (tendencja view)
PL: Spotkasz w
EN: Found in
```

```
focused.askCta: chat CTA button
PL: Zapytaj Vinovigatora
EN: Ask Vinovigator
```

```
focused.restartTour: persistent tour-restart button (shows after first pin)
PL: ▶ Przewodnik od nowa
EN: ▶ Restart the guide
```

Note: `SelectionComment` renders "{label} · {v}/5." + the intensity comment — format string only, label and comment translated elsewhere. The panel's sr-only status is composed from KB fields (name + description / short) — no extra strings.

## 3.5 IdleCard (panel before any focus)

```
idle.eyebrow
PL: Vinokompas
EN: Vinocompas
```

```
idle.h3: heading (has a <br/> between the two halves)
PL: Najedź na koło lub<br/>uruchom przewodnika
EN: Hover over the wheel or<br/>start the guide
```

```
idle.body: paragraph; {plural} interpolated from idle.plural.* below
PL: Tarcza Vinokompasu pokaże opis każdego elementu. Możesz też pozwolić, by przewodnik przeszedł przez {plural} automatycznie - wystarczy nacisnąć przycisk poniżej.
EN: The Vinocompas dial will show you a description of every element. Or let the guide walk through {plural} automatically — just press the button below.
```

```
idle.plural.level1: level-1 count phrase
PL: trzy smaki bazowe
EN: the three base tastes
```

```
idle.plural.level2: level-2 count phrase
PL: sześć wrażeń
EN: the six sensations
```

```
idle.plural.level3: level-3 count phrase
PL: dwanaście tendencji
EN: the twelve tendencies
```

```
idle.startTour: start-tour button
PL: ▶ Uruchom przewodnika
EN: ▶ Start the guide
```

## 3.6 SelectedProfileBar (chip row under the dial)

```
profileBar.empty: empty-state line
PL: Twój profil pojawi się tutaj - wskaż intensywność dotykiem koła.
EN: Your profile will appear here — tap the wheel to set an intensity.
```

```
profileBar.title: bar heading; ${total} interpolated
PL: Twój profil · {total}
EN: Your profile · {total}
```

```
profileBar.clear: clear-all button
PL: Wyzeruj
EN: Reset
```

---

# 4. src/app/[locale]/samouczek/SamouczekClient.tsx

## 4.1 Hero

```
hero.eyebrow
PL: Samouczek Vinokompas
EN: Vinocompas Tutorial
```

```
hero.h1: split heading — first half plain, second half <em class="block">
PL: 2 etapy. Każde wino dopasowane.
EN: 2 stages. Every wine matched.
```

```
hero.lede
PL: Vinokompas to system, w którym każdy znajdzie swoje wino w 2 prostych krokach. Najpierw ustawiasz smak i sześć wrażeń na kole, a jeśli chcesz - dostrajasz dwanaście aromatów. Po każdym etapie zobaczysz wina dopasowane do twojego profilu.
EN: Vinocompas is a system in which anyone can find their wine in 2 simple steps. First you set taste and the six sensations on the wheel; then, if you like, you fine-tune the twelve aromas. After every stage you'll see wines matched to your profile.
```

```
hero.ctaStart: primary CTA (anchor to #kompas)
PL: Rozpocznij test
EN: Start the test
```

```
hero.ctaPairing: ghost CTA (links to /pairing)
PL: Otwórz Pairing
EN: Open Pairing
```

```
hero.attribution: method-credit line (proper nouns unchanged)
PL: Metoda za zgodą i w hołdzie Magdalenie Surgiel-Czyż / parfumealavin / vinocompas.pl
EN: Method used with the kind permission of, and in tribute to, Magdalena Surgiel-Czyż / parfumealavin / vinocompas.pl
```

## 4.2 Tutorial section

```
tutorialSection.ariaLabel: section aria-label (id="kompas")
PL: Winokompas
EN: Vinocompas
```

## 4.3 Method section (II.)

```
method.h2
PL: Metoda degustacji
EN: The tasting method
```

```
method.lede
PL: Sześć kroków, dzięki którym przestaniesz „tylko pić” a zaczniesz nazywać wrażenia.
EN: Six steps that take you from "just drinking" to putting names to sensations.
```

(Step titles/bodies come from METHOD_STEPS — see section 1.3.)

## 4.4 FAQ section (III.)

```
faqSection.h2
PL: Pytania i odpowiedzi
EN: Questions and answers
```

```
faqSection.lede
PL: Najczęstsze wątpliwości. Jeśli czegoś brakuje - włącz czat przy scenariuszu i zapytaj przewodnika.
EN: The most common doubts. If something's missing — switch on the chat beside the tutorial and ask the guide.
```

(Q&A content comes from FAQ_ITEMS — see section 1.4.)

## 4.5 Final CTA

```
finalCta.eyebrow
PL: Gotowe?
EN: Ready?
```

```
finalCta.h2
PL: Twój profil jest zapisany. Czas znaleźć wina.
EN: Your profile is saved. Time to find the wines.
```

```
finalCta.body
PL: Otwórz widok Pairing i wybierz danie - zobaczysz top-3 win z karty restauracji, dopasowane do tego co właśnie wskazałeś na kompasie.
EN: Open the Pairing view and pick a dish — you'll see the top-3 wines from the restaurant's list, matched to what you've just marked on the compass.
```

```
finalCta.ctaPairing: primary CTA (links to /pairing)
PL: Otwórz Pairing
EN: Open Pairing
```

```
finalCta.ctaBack: ghost CTA (links to /)
PL: Wróć do restauracji
EN: Back to the restaurants
```

---

# Coverage checklist

- wine-compass-kb.ts: 6 sectors × 4 fields (24) + 12 tendencje × 5 fields (60) + 3 base tastes × 2 (6) + 6 method steps × 2 (12) + 14 FAQ × 2 (28) = **130 KB entries** — all translated.
- StagedTutorial.tsx: 5 style labels + 12 InlineProposals strings (incl. SR status, aria-label, placeholder, footer) + 5 StageNav + 4 stage controls + 5 stage-1 strings + 5 DrynessMeter strings + 3 stage-2 strings + 3 ChatToggle = **42 entries** — all translated.
- dryness.ts: **6 bucket labels** — all translated (aligned with the meter's zone labels).
- InteractiveCompass.tsx: 6 intensity comments + 1 chat prefill + 2 hints + 4 eyebrows + 1 base footnote + 1 details summary + 3 dt labels + 2 buttons + 7 IdleCard strings + 3 profile-bar strings = **30 entries** — all translated.
- SamouczekClient.tsx: 6 hero + 1 aria-label + 2 method + 2 FAQ + 5 final CTA = **16 entries** — all translated.

Not translated (out of scope, needs its own pass): `src/data/samouczek-wines.ts` wine copy (`name_pl` / `region_pl` / `why_pl`, 18 entries) rendered inside `InlineProposals`, and the `buildChatSystemPrompt()` Polish system prompt in `wine-compass-kb.ts` (the bot is currently hard-instructed to "Zawsze odpowiadasz po polsku" — the EN locale needs a locale parameter, not just translated strings).
