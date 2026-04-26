#!/usr/bin/env node
// Replace each `pl: "<English>"` placeholder produced by migrate-seed-restaurants.mjs
// with a hand-written Polish translation. Run once; subsequent runs are no-ops
// for entries already translated.
//
// Translations produced by Anthropic LLM as a first pass. Wine producer/cuvée
// names and proper nouns (Sangiovese, Sauvignon Blanc, Sancerre, etc.) are
// kept in their original form per industry convention.
//
// CAVEAT for commercial pitch: vetting by a Polish-speaking sommelier is
// REQUIRED before customer-facing presentation. Wine vocabulary is precise
// and a single mistranslation ("mineral" → "mineralny" lacks the wine
// connotation; correct is "mineralny" but contextually "kamienisty"/"krzemienna nuta")
// can read amateurish to a wine professional.
import fs from "node:fs";
import path from "node:path";

const TRANSLATIONS = {
  // ── Restaurant descriptions
  "Warm Tuscan comfort food with classic pasta, seafood, and regional bottles.":
    "Domowa kuchnia toskańska — klasyczne makarony, owoce morza i regionalne wina.",
  "Modern Japanese kitchen in Copenhagen with robata grill, pristine seafood, and precise pairings.":
    "Nowoczesna kuchnia japońska w Kopenhadze — grill robata, świeże owoce morza i precyzyjne łączenia z winami.",
  "Spanish tapas and grill house focused on coastal seafood and cast-iron fire.":
    "Hiszpańskie tapas i grill house z naciskiem na nadmorskie owoce morza i ogień z żeliwnego paleniska.",
  "French bistro classics with seafood focus and cellar-style old world labels.":
    "Klasyka francuskiego bistro — owoce morza i piwniczne etykiety ze starego świata.",
  "Peruvian and Nikkei signatures in Lisbon with bright citrus, chili, and charcoal notes.":
    "Peruwiańskie i Nikkei popisy w Lizbonie — żywe cytrusy, papryczki chili i nuty z węgla drzewnego.",

  // ── Wine notes (40 wines)
  "Dark cherry, cedar, tobacco, and polished tannins.":
    "Ciemna wiśnia, cedr, tytoń i wypolerowane taniny.",
  "Bright sour cherry, herbs, and savory spice.":
    "Świeża kwaśna wiśnia, zioła i wytrawne korzenne nuty.",
  "Citrus peel, white flowers, and mineral finish.":
    "Skórka cytrusów, białe kwiaty i mineralne wykończenie.",
  "Ripe stone fruit, vanilla, and balanced acidity.":
    "Dojrzałe owoce pestkowe, wanilia i zbalansowana kwasowość.",
  "Fine bubbles, green apple, brioche, and crisp finish.":
    "Drobne bąbelki, zielone jabłko, brioszka i świeże wykończenie.",
  "Apricot, candied orange, honey, and saffron.":
    "Morela, kandyzowana pomarańcza, miód i szafran.",
  "Black cherry, leather, dried herbs, and firm structure.":
    "Czarna wiśnia, skóra, suszone zioła i mocna struktura.",
  "Pear, lemon zest, and saline minerality.":
    "Gruszka, skórka cytryny i słona mineralność.",
  "Grapefruit, lime leaf, and bright herbal lift.":
    "Grejpfrut, liść limonki i świeży ziołowy charakter.",
  "Taut citrus, oyster shell, and chalky texture.":
    "Napięte cytrusy, muszla ostrygi i kredowa tekstura.",
  "Green apple, peach, and off-dry precision.":
    "Zielone jabłko, brzoskwinia i półwytrawna precyzja.",
  "Lemon curd, almond, and chalky bubbles.":
    "Lemon curd, migdał i kredowe bąbelki.",
  "Wild strawberry, citrus peel, and elegant mousse.":
    "Poziomka, skórka cytrusów i elegancki mus.",
  "Ripe berry, mocha, and silky tannins.":
    "Dojrzałe jagody, mocha i jedwabiste taniny.",
  "Blackberry, pepper, and savory spice.":
    "Jeżyna, pieprz i wytrawne korzenne nuty.",
  "Red berries, melon, and dry floral finish.":
    "Czerwone owoce, melon i wytrawne kwiatowe wykończenie.",
  "Red fruit, vanilla, and dried herbs.":
    "Czerwone owoce, wanilia i suszone zioła.",
  "Plum, cedar, tobacco, and polished tannins.":
    "Śliwka, cedr, tytoń i wypolerowane taniny.",
  "Dark berries, graphite, and long savory finish.":
    "Ciemne owoce, grafit i długie wytrawne wykończenie.",
  "Lime, peach, saline freshness, and floral notes.":
    "Limonka, brzoskwinia, słona świeżość i kwiatowe nuty.",
  "Citrus, stone fruit, subtle oak, and crisp finish.":
    "Cytrusy, owoce pestkowe, subtelny dąb i świeże wykończenie.",
  "Baked apple, brioche, and persistent bubbles.":
    "Pieczone jabłko, brioszka i wytrwałe bąbelki.",
  "Black cherry, cacao, and gentle oak spice.":
    "Czarna wiśnia, kakao i delikatna dębowa korzenność.",
  "Nuts, dried citrus, and layered oxidative complexity.":
    "Orzechy, suszone cytrusy i warstwowa oksydacyjna złożoność.",
  "Lemon zest, gooseberry, and flinty minerality.":
    "Skórka cytryny, agrest i krzemienna mineralność.",
  "Crisp citrus, oyster shell, and linear acidity.":
    "Świeże cytrusy, muszla ostrygi i liniowa kwasowość.",
  "Red cherry, forest floor, and gentle spice.":
    "Czerwona wiśnia, ściółka leśna i delikatne korzenne nuty.",
  "Black fruit, garrigue herbs, and structured finish.":
    "Czarne owoce, zioła garrigue i strukturalne wykończenie.",
  "Strawberry, peach, and dry mineral finish.":
    "Truskawka, brzoskwinia i wytrawne mineralne wykończenie.",
  "Apple, brioche, toasted nuts, and long mousse.":
    "Jabłko, brioszka, prażone orzechy i długi mus.",
  "Citrus, white peach, and subtle oak smoke.":
    "Cytrusy, biała brzoskwinia i subtelny dąb z dymem.",
  "Plum, cocoa, and velvety tannins.":
    "Śliwka, kakao i aksamitne taniny.",
  "Black plum, violet, and smooth dense finish.":
    "Czarna śliwka, fiołek i gładkie, gęste wykończenie.",
  "Cassis, cedar, and firm tannin backbone.":
    "Cassis, cedr i mocna tanniczna struktura.",
  "Citrus curd, stone fruit, and creamy texture.":
    "Cytrusowy curd, owoce pestkowe i kremowa tekstura.",
  "Blackberries, pepper, and smoky herbal finish.":
    "Jeżyny, pieprz i dymne ziołowe wykończenie.",
  "Lime zest, white peach, and saline edge.":
    "Skórka limonki, biała brzoskwinia i słony akcent.",
  "Dark fruit, graphite, and polished oak.":
    "Ciemne owoce, grafit i wypolerowany dąb.",
  "Jasmine, grapefruit, and aromatic lift.":
    "Jaśmin, grejpfrut i aromatyczny charakter.",
  "Black cherry, cocoa, and structured mouthfeel.":
    "Czarna wiśnia, kakao i strukturalna wyrazistość w ustach.",

  // ── Dish names (50)
  "Pizza Margherita": "Pizza Margherita",
  "Cacio e Pepe": "Cacio e Pepe",
  "Tagliatelle al Ragu": "Tagliatelle al ragù",
  "Osso Buco alla Milanese": "Osso Buco po mediolańsku",
  "Risotto alla Milanese": "Risotto po mediolańsku",
  "Branzino al Forno": "Pieczony labraks",
  "Vitello Tonnato": "Vitello Tonnato",
  "Melanzane alla Parmigiana": "Bakłażan alla Parmigiana",
  "Burrata e Pomodori": "Burrata z pomidorami",
  Tiramisu: "Tiramisu",
  "Hamachi Crudo": "Hamachi Crudo",
  "Omakase Nigiri Set": "Zestaw nigiri omakase",
  "Sashimi Moriawase": "Sashimi moriawase",
  "Yakitori Thigh": "Yakitori z udka",
  "Miso Black Cod": "Czarny dorsz miso",
  "Tempura Moriawase": "Tempura moriawase",
  "Unagi Don": "Unagi don",
  "Wagyu Tataki": "Wagyu tataki",
  "Shoyu Ramen": "Ramen shoyu",
  "Matcha Basque Cheesecake": "Sernik baskijski matcha",
  "Patatas Bravas": "Patatas Bravas",
  "Gambas al Ajillo": "Gambas al ajillo",
  "Tortilla Espanola": "Hiszpańska tortilla",
  "Pulpo a la Gallega": "Pulpo a la Gallega",
  "Paella Valenciana": "Paella valenciana",
  "Bacalao al Pil Pil": "Bacalao al Pil Pil",
  "Cochinillo Asado": "Pieczone prosię",
  "Croquetas de Jamon": "Krokiety z szynką jamón",
  "Chuleton a la Brasa": "Chuletón z grilla",
  "Basque Cheesecake": "Sernik baskijski",
  "French Onion Soup": "Francuska zupa cebulowa",
  "Steak Frites": "Stek z frytkami",
  "Duck Confit": "Konfitowana kaczka",
  Bouillabaisse: "Bouillabaisse",
  "Ratatouille Tart": "Tarta ratatouille",
  "Coq au Vin": "Coq au vin",
  "Sole Meuniere": "Sola meunière",
  "Nicoise Salad": "Sałatka niçoise",
  "Truffle Brie Ravioli": "Ravioli z brie i truflą",
  "Creme Brulee": "Crème brûlée",
  "Ceviche Clasico": "Ceviche clásico",
  "Tiradito Nikkei": "Tiradito Nikkei",
  "Lomo Saltado": "Lomo saltado",
  "Aji de Gallina": "Ají de gallina",
  "Causa Limena": "Causa limeña",
  "Anticuchos de Corazon": "Anticuchos de corazón",
  "Arroz con Mariscos": "Arroz con mariscos",
  "Seco de Cordero": "Seco de cordero",
  "Tacu Tacu": "Tacu tacu",
  Picarones: "Picarones",

  // ── Dish descriptions (50)
  "San Marzano tomato, fior di latte, basil, and olive oil.":
    "Pomidor San Marzano, fior di latte, bazylia i oliwa z oliwek.",
  "Handmade tonnarelli with pecorino romano and black pepper.":
    "Ręcznie robione tonnarelli z pecorino romano i czarnym pieprzem.",
  "Slow-cooked beef and pork ragu with egg tagliatelle.":
    "Wolno duszony ragù z wołowiny i wieprzowiny z makaronem tagliatelle z jajkami.",
  "Braised veal shank, saffron jus, and gremolata.":
    "Duszona pręga cielęca, sos szafranowy i gremolata.",
  "Carnaroli rice with saffron, butter, and parmigiano.":
    "Ryż carnaroli z szafranem, masłem i parmigiano.",
  "Oven-roasted sea bass, lemon, capers, and herbs.":
    "Pieczony labraks z piekarnika, cytryna, kapary i zioła.",
  "Cold sliced veal with creamy tuna-caper sauce.":
    "Zimna plasterkowana cielęcina z kremowym sosem tuńczykowo-kaparowym.",
  "Layered eggplant, tomato sauce, mozzarella, and basil.":
    "Warstwowy bakłażan, sos pomidorowy, mozzarella i bazylia.",
  "Creamy burrata, heirloom tomatoes, basil, and aged balsamic.":
    "Kremowa burrata, pomidory dziedziczne, bazylia i dojrzewający balsamico.",
  "Mascarpone cream, espresso-soaked savoiardi, and cocoa.":
    "Krem mascarpone, savoiardi nasączone espresso i kakao.",
  "Yellowtail, yuzu kosho, shiso, and citrus soy.":
    "Seriola, yuzu kosho, shiso i sos sojowy z cytrusami.",
  "Chef selection of seasonal nigiri, wasabi, and nikiri glaze.":
    "Wybór szefa kuchni — sezonowe nigiri, wasabi i glazura nikiri.",
  "Bluefin tuna, salmon, scallop, and madai sashimi.":
    "Sashimi z tuńczyka błękitnopłetwego, łososia, przegrzebka i madai.",
  "Binchotan grilled chicken thigh with tare and sansho.":
    "Udko kurczaka z grilla binchōtan z sosem tare i pieprzem sanshō.",
  "Saikyo miso marinated cod, pickled daikon, and ginger.":
    "Dorsz marynowany w saikyō miso, kiszony daikon i imbir.",
  "Shrimp and seasonal vegetables in light tempura batter.":
    "Krewetki i sezonowe warzywa w lekkim cieście tempura.",
  "Charcoal grilled eel over rice with tare and sansho.":
    "Węgorz z grilla na węglu drzewnym na ryżu z sosem tare i pieprzem sanshō.",
  "Seared wagyu, ponzu, daikon, and garlic chips.":
    "Smażone wagyu, ponzu, daikon i chipsy czosnkowe.",
  "Chicken broth ramen with chashu, ajitama, and nori.":
    "Ramen na bulionie z kurczaka z chashū, ajitamą i nori.",
  "Burnt cheesecake with ceremonial matcha cream.":
    "Przypalany sernik baskijski z ceremonialnym kremem matcha.",
  "Crisp potatoes, smoked paprika brava sauce, and aioli.":
    "Chrupiące ziemniaki, sos brava z wędzoną papryką i aioli.",
  "Shrimp sauteed in olive oil, garlic, and dried chili.":
    "Krewetki podsmażane na oliwie z czosnkiem i suszonym chili.",
  "Potato and onion omelet with olive oil confit texture.":
    "Omlet z ziemniakami i cebulą o teksturze konfitowanej w oliwie.",
  "Tender octopus, smoked paprika, potato, and olive oil.":
    "Delikatna ośmiornica, wędzona papryka, ziemniak i oliwa.",
  "Saffron rice with chicken, rabbit, and green beans.":
    "Ryż z szafranem, kurczak, królik i zielona fasolka.",
  "Salt cod with emulsified garlic and olive oil sauce.":
    "Solony dorsz z emulgowanym sosem z czosnku i oliwy.",
  "Slow-roasted suckling pig with crackling skin.":
    "Wolno pieczone prosię z chrupiącą skórką.",
  "Creamy Iberico ham croquettes with crisp crust.":
    "Kremowe krokiety z szynką ibérico w chrupiącej panierce.",
  "Dry-aged rib steak cooked over oak embers.":
    "Stek żebrowy dojrzewający na sucho, pieczony nad dębowym żarem.",
  "Burnt-top cheesecake with creamy center.":
    "Sernik z przypalonym wierzchem i kremowym środkiem.",
  "Caramelized onion broth, crouton, and gruyere gratin.":
    "Bulion z karmelizowanej cebuli, grzanka i zapiekanka z gruyère.",
  "Striploin, pommes frites, and cafe de paris butter.":
    "Rostbef, pommes frites i masło Café de Paris.",
  "Slow-cooked duck leg, lentils, and mustard jus.":
    "Wolno pieczone udko kaczki, soczewica i sos musztardowy.",
  "Marseille fish stew with saffron rouille.":
    "Marsylski gulasz rybny z szafranowym rouille.",
  "Tomato tart with confit zucchini and eggplant.":
    "Tarta pomidorowa z konfitowaną cukinią i bakłażanem.",
  "Red wine braised chicken, mushrooms, and pearl onions.":
    "Kurczak duszony w czerwonym winie z grzybami i perłową cebulą.",
  "Pan-seared sole, browned butter, lemon, and parsley.":
    "Smażona sola, masło orzechowe, cytryna i pietruszka.",
  "Tuna, egg, olives, green beans, and anchovy dressing.":
    "Tuńczyk, jajko, oliwki, fasolka szparagowa i sos anchois.",
  "Fresh ravioli, truffle cream, and aged comte.":
    "Świeże ravioli, krem truflowy i dojrzewające comté.",
  "Vanilla custard with caramelized sugar crust.":
    "Krem waniliowy z karmelizowaną skorupką cukrową.",
  "Fresh white fish, leche de tigre, red onion, and cancha.":
    "Świeża biała ryba, leche de tigre, czerwona cebula i kukurydza cancha.",
  "Sliced tuna with ponzu, aji amarillo, and sesame.":
    "Plastry tuńczyka z ponzu, ají amarillo i sezamem.",
  "Stir-fried beef, tomato, onion, soy, and fries.":
    "Wołowina z woka z pomidorem, cebulą, sosem sojowym i frytkami.",
  "Creamy chicken stew with aji amarillo and walnuts.":
    "Kremowy gulasz z kurczaka z ají amarillo i orzechami włoskimi.",
  "Layered potato terrine with crab, avocado, and lime.":
    "Warstwowy terrine ziemniaczany z krabem, awokado i limonką.",
  "Beef heart skewers with aji panca glaze.":
    "Szaszłyki z serca wołowego w glazurze ají panca.",
  "Seafood rice with saffron, peas, and rocoto.":
    "Ryż z owocami morza, szafranem, groszkiem i papryczką rocoto.",
  "Braised lamb with cilantro, beer, and beans.":
    "Duszona jagnięcina z kolendrą, piwem i fasolą.",
  "Crisp rice-bean cake with fried egg and salsa criolla.":
    "Chrupiący placek z ryżu i fasoli z sadzonym jajkiem i salsa criolla.",
  "Pumpkin-sweet potato fritters with chancaca syrup.":
    "Pączki z dyni i batata z syropem chancaca.",

  // ── Pairing reasons (~100)
  "Sangiovese acidity mirrors tomato and refreshes melted cheese.":
    "Kwasowość Sangiovese odpowiada pomidorowi i odświeża stopiony ser.",
  "Sparkling bubbles cut richness and keep basil flavors bright.":
    "Bąbelki musującego wina rozcinają tłustość i utrzymują świeży aromat bazylii.",
  "Mineral white wine balances salty pecorino and pepper heat.":
    "Mineralne białe wino równoważy słone pecorino i ostrość pieprzu.",
  "Pinot Grigio keeps the dish airy and highlights pepper aroma.":
    "Pinot Grigio utrzymuje danie lekkim i podkreśla aromat pieprzu.",
  "Structured tannins match ragu depth and savory meat notes.":
    "Strukturalne taniny pasują do głębi ragù i wytrawnych mięsnych nut.",
  "Chianti herbs and cherry pair naturally with tomato-based sauce.":
    "Zioła i wiśnia w Chianti naturalnie łączą się z sosem na bazie pomidorów.",
  "Brunello structure stands up to gelatin-rich braised veal.":
    "Struktura Brunello dorównuje bogatej w żelatynę duszonej cielęcinie.",
  "Tignanello adds spice and depth to saffron and bone marrow.":
    "Tignanello dodaje korzenności i głębi szafranowi oraz szpikowi.",
  "Creamy Chardonnay texture echoes risotto body and saffron notes.":
    "Kremowa tekstura Chardonnay odpowiada treściwości risotto i nutom szafranu.",
  "Brut freshness cleans palate between buttery spoonfuls.":
    "Świeżość brutu oczyszcza podniebienie między maślanymi łyżkami.",
  "Citrus and minerality amplify delicate sea bass flavors.":
    "Cytrusy i mineralność wzmacniają delikatne nuty labraksa.",
  "Light body keeps fish and herbs in focus.":
    "Lekka treściwość trzyma rybę i zioła w centrum uwagi.",
  "High acidity sharpens the rich tuna emulsion.":
    "Wysoka kwasowość wyostrza bogatą emulsję tuńczykową.",
  "Fine mousse lightens the texture of chilled veal.":
    "Drobny mus rozjaśnia teksturę zimnej cielęciny.",
  "Acid-driven red supports tomato while keeping eggplant balanced.":
    "Kwasowe czerwone wspiera pomidor, zachowując równowagę bakłażana.",
  "Earthy Brunello complements roasted eggplant depth.":
    "Ziemiste Brunello uzupełnia głębię pieczonego bakłażana.",
  "Crisp pear and citrus cut through burrata creaminess.":
    "Świeża gruszka i cytrusy przecinają kremowość burraty.",
  "Bubbles and acidity refresh after each rich bite.":
    "Bąbelki i kwasowość odświeżają po każdym treściwym kęsie.",
  "Sweet apricot and honey tones complement cocoa and coffee.":
    "Słodkie nuty moreli i miodu uzupełniają kakao i kawę.",
  "A dry sparkling contrast keeps dessert from feeling heavy.":
    "Wytrawny musujący kontrast nie pozwala deserowi sprawiać wrażenia ciężkiego.",
  "Zesty citrus profile mirrors yuzu and lifts raw fish sweetness.":
    "Pikantny cytrusowy profil odpowiada yuzu i podkreśla słodycz surowej ryby.",
  "Fine bubbles cleanse palate after rich hamachi texture.":
    "Drobne bąbelki oczyszczają podniebienie po bogatej teksturze hamachi.",
  "Chablis minerality mirrors the oceanic purity of nigiri.":
    "Mineralność Chablis odpowiada oceanicznej czystości nigiri.",
  "Champagne acidity resets the palate between different fish cuts.":
    "Kwasowość Champagne resetuje podniebienie między różnymi rodzajami ryb.",
  "Lean mineral structure supports delicate sashimi without masking it.":
    "Smukła mineralna struktura wspiera delikatne sashimi, nie tłumiąc go.",
  "Slight sweetness softens soy salt and enhances umami.":
    "Lekka słodycz łagodzi sól sojową i wzmacnia umami.",
  "Silky Pinot fruit balances smoky grill char and sweet tare.":
    "Jedwabista owocowość Pinot równoważy dymne nuty grilla i słodkie tare.",
  "Peppery red blend handles caramelized glaze intensity.":
    "Pieprzowy red blend radzi sobie z intensywnością karmelizowanej glazury.",
  "Off-dry Riesling balances sweet-salty miso glaze.":
    "Półwytrawny Riesling równoważy słodko-słoną glazurę miso.",
  "Herbal citrus notes brighten rich buttery cod.":
    "Ziołowo-cytrusowe nuty rozjaśniają tłustego, maślanego dorsza.",
  "Lively mousse cuts fried texture and keeps flavors clean.":
    "Żywy mus rozcina smażoną teksturę i utrzymuje czystość smaków.",
  "Rose Champagne adds freshness and subtle berry lift.":
    "Champagne rosé dodaje świeżości i subtelnej owocowej nuty.",
  "Residual sugar balances sweet soy glaze and eel fat.":
    "Resztkowy cukier równoważy słodką glazurę sojową i tłustość węgorza.",
  "Soft red fruit complements smoky caramelized eel.":
    "Miękkie czerwone owoce uzupełniają dymnego, karmelizowanego węgorza.",
  "Concentrated fruit and spice stand up to wagyu richness.":
    "Skoncentrowana owocowość i korzenność dorównują tłustości wagyu.",
  "Pinot texture supports beef fat without overwhelming ponzu.":
    "Tekstura Pinot wspiera tłustość wołowiny, nie tłumiąc ponzu.",
  "Acidic lift cuts broth richness and highlights aromatics.":
    "Kwasowy charakter rozcina bogactwo bulionu i podkreśla aromaty.",
  "Riesling softness complements salty soy depth.":
    "Miękkość Rieslinga uzupełnia słoną głębię sosu sojowego.",
  "Red berry mousse offsets the earthy matcha edge.":
    "Owocowy mus z czerwonych jagód niweluje ziemisty akcent matchy.",
  "Delicate sweetness smooths the cheesecake bitterness.":
    "Delikatna słodycz łagodzi gorycz sernika.",
  "Cava bubbles clean up aioli richness and spice oil.":
    "Bąbelki Cavy oczyszczają tłustość aioli i pikantnej oliwy.",
  "Citrus-driven Albarino cools paprika heat.":
    "Cytrusowy Albariño chłodzi ostrość papryki.",
  "Saline white enhances sweet shrimp and garlic oil.":
    "Słone białe wino wzmacnia słodkie krewetki i czosnkową oliwę.",
  "Layered white handles intensity of garlic and chili.":
    "Warstwowe białe wino radzi sobie z intensywnością czosnku i chili.",
  "Medium-bodied white complements egg richness.":
    "Średnio treściwe białe wino uzupełnia bogactwo jajek.",
  "Sparkling acidity keeps each bite light.":
    "Musująca kwasowość utrzymuje każdy kęs lekkim.",
  "Albarino minerality complements octopus sweetness.":
    "Mineralność Albariño uzupełnia słodycz ośmiornicy.",
  "Subtle oak adds body for paprika and oil.":
    "Subtelny dąb dodaje treściwości pod paprykę i oliwę.",
  "Rioja fruit and spice match saffron and roasted meat notes.":
    "Owocowość i korzenność Rioja pasują do szafranu i pieczonych mięsnych nut.",
  "Bright acidity keeps the rice dish lively.":
    "Świeża kwasowość utrzymuje danie z ryżu pełnym życia.",
  "Complex aged white supports garlic-driven richness.":
    "Złożone, dojrzewające białe wino wspiera bogactwo czosnku.",
  "Fresh saline profile balances cod salinity.":
    "Świeży słony profil równoważy słoność dorsza.",
  "Concentrated red with structure matches crispy pork richness.":
    "Skoncentrowane czerwone wino ze strukturą odpowiada chrupiącej tłustości wieprzowiny.",
  "Reserva acidity cuts through rendered fat.":
    "Kwasowość Reserva przecina wytopiony tłuszcz.",
  "Sparkling texture clears bechamel richness.":
    "Musująca tekstura oczyszcza bogactwo beszamelu.",
  "White fruit notes offset savory ham intensity.":
    "Nuty białych owoców równoważą wytrawną intensywność szynki.",
  "Dense tannic frame is ideal for charred beef.":
    "Gęsta tanniczna struktura jest idealna dla wołowiny z grilla.",
  "Ripe fruit and spice echo grilled crust flavors.":
    "Dojrzała owocowość i korzenność odpowiadają nutom grillowanej skórki.",
  "Brut bubbles refresh palate after rich creamy texture.":
    "Bąbelki brutu odświeżają podniebienie po bogatej kremowej teksturze.",
  "Fresh fruit notes brighten caramelized top.":
    "Świeże owocowe nuty rozjaśniają karmelizowany wierzch.",
  "Pinot earthiness mirrors caramelized onion depth.":
    "Ziemistość Pinota odpowiada głębi karmelizowanej cebuli.",
  "Sparkling acidity cuts melted cheese richness.":
    "Musująca kwasowość przecina bogactwo stopionego sera.",
  "Merlot blend tannins handle beef and butter intensity.":
    "Taniny mieszanki Merlot radzą sobie z intensywnością wołowiny i masła.",
  "Rhone spice amplifies seared crust and pepper.":
    "Korzenność Rodanu wzmacnia smażoną skórkę i pieprz.",
  "Savory Rhone profile matches crispy duck skin.":
    "Wytrawny profil Rodanu pasuje do chrupiącej skórki kaczki.",
  "Pinot brightness lifts the rich confit fat.":
    "Świeżość Pinota podnosi bogaty tłuszcz konfitu.",
  "Mineral Chablis supports shellfish and saffron broth.":
    "Mineralne Chablis wspiera skorupiaki i bulion z szafranem.",
  "Layered white has enough body for rich rouille.":
    "Warstwowe białe wino ma wystarczająco treściwości dla bogatego rouille.",
  "Dry rose complements roasted vegetables and herbs.":
    "Wytrawne rosé uzupełnia pieczone warzywa i zioła.",
  "Crisp Loire white lifts tomato sweetness.":
    "Świeże białe wino z Loary podnosi słodycz pomidora.",
  "Soft tannins and plum fruit align with braising sauce.":
    "Miękkie taniny i nuty śliwki pasują do sosu z duszenia.",
  "Rhone herbs deepen mushroom and onion notes.":
    "Zioła Rodanu pogłębiają nuty grzybów i cebuli.",
  "Precise acidity balances beurre noisette richness.":
    "Precyzyjna kwasowość równoważy bogactwo masła orzechowego.",
  "Citrus and minerality keep fish flavors focused.":
    "Cytrusy i mineralność utrzymują smaki ryby w centrum.",
  "Sancerre acidity handles salty anchovy and tuna.":
    "Kwasowość Sancerre radzi sobie ze słonymi anchois i tuńczykiem.",
  "Rose offers fruit contrast for briny olives.":
    "Rosé oferuje owocowy kontrast dla słonych oliwek.",
  "Oak-kissed white matches truffle and creamy cheese.":
    "Lekko dębowane białe pasuje do trufli i kremowego sera.",
  "Champagne bubbles reduce richness and reset palate.":
    "Bąbelki Champagne redukują tłustość i resetują podniebienie.",
  "Toasty notes mirror caramelized top while staying fresh.":
    "Tostowe nuty odpowiadają karmelizowanemu wierzchu, pozostając świeże.",
  "Dry rose adds berry lift without oversweetening dessert.":
    "Wytrawne rosé dodaje owocowej nuty bez przesłodzenia deseru.",
  "Zesty acidity mirrors lime and keeps fish ultra fresh.":
    "Pikantna kwasowość odpowiada limonce i utrzymuje rybę w pełnej świeżości.",
  "Aromatic white softens chili heat and citrus bite.":
    "Aromatyczne białe wino łagodzi ostrość chili i cytrusowy akcent.",
  "Textured Chardonnay supports tuna and sesame richness.":
    "Strukturalne Chardonnay wspiera tuńczyka i bogactwo sezamu.",
  "Albarino brightness sharpens ponzu citrus profile.":
    "Świeżość Albariño wyostrza cytrusowy profil ponzu.",
  "Malbec fruit and body hold up to soy-seared beef.":
    "Owocowość i treściwość Malbeca dorównują wołowinie smażonej w sosie sojowym.",
  "Carmenere spice aligns with wok-charred aromatics.":
    "Korzenność Carmenère pasuje do aromatów z woka.",
  "Creamy Chardonnay texture matches sauce body.":
    "Kremowa tekstura Chardonnay odpowiada treściwości sosu.",
  "Floral aromatics cool yellow chili warmth.":
    "Kwiatowe aromaty chłodzą ciepło żółtego chili.",
  "Fresh saline profile complements crab sweetness.":
    "Świeży słony profil uzupełnia słodycz kraba.",
  "Rounded white texture suits creamy avocado.":
    "Zaokrąglona tekstura białego pasuje do kremowego awokado.",
  "Cabernet tannins match grilled protein and char.":
    "Taniny Cabernet pasują do grillowanego białka i nut z węgla.",
  "Bold Malbec fruit balances smoky chili spice.":
    "Wyrazista owocowość Malbeca równoważy dymną korzenność chili.",
  "Crisp acidity keeps shellfish and spice in balance.":
    "Świeża kwasowość utrzymuje skorupiaki i korzenność w równowadze.",
  "Fruit-forward Chardonnay complements saffron rice.":
    "Owocowe Chardonnay uzupełnia ryż z szafranem.",
  "Concentrated Malbec handles lamb and herbal braise.":
    "Skoncentrowany Malbec radzi sobie z jagnięciną i ziołowym duszeniem.",
  "Classic Malbec plushness fits tender slow-cooked meat.":
    "Klasyczna pluszowość Malbeca pasuje do delikatnego, wolno duszonego mięsa.",
  "Spicy red profile matches crispy savory bean cake.":
    "Pikantny czerwony profil pasuje do chrupiącego, wytrawnego placka z fasoli.",
  "Soft tannins and dark fruit complement egg yolk richness.":
    "Miękkie taniny i ciemne owoce uzupełniają bogactwo żółtka.",
  "Floral aromatics add lift to caramelized syrup.":
    "Kwiatowe aromaty dodają lekkości karmelizowanemu syropowi.",
  "Dry acidity balances sweet fried dough texture.":
    "Wytrawna kwasowość równoważy słodką teksturę smażonego ciasta.",
};

const target = path.resolve("src/data/seed-restaurants.ts");
let content = fs.readFileSync(target, "utf-8");

let totalApplied = 0;
const missing = [];

for (const [english, polish] of Object.entries(TRANSLATIONS)) {
  const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Pattern: pl: "<English text>"  → pl: "<Polish text>"
  // Be tight: only replace inside the placeholder produced by migration.
  const pattern = new RegExp(`pl:\\s*"${escaped}"`, "g");
  const before = content;
  content = content.replace(pattern, `pl: "${polish.replace(/"/g, '\\"')}"`);
  if (content === before) {
    missing.push(english);
  } else {
    totalApplied += 1;
  }
}

fs.writeFileSync(target, content, "utf-8");
console.log(`Applied ${totalApplied} translations.`);
if (missing.length > 0) {
  console.log(`Missing matches (${missing.length}):`);
  for (const m of missing.slice(0, 20)) {
    console.log("  - " + m);
  }
  if (missing.length > 20) {
    console.log("  ... and " + (missing.length - 20) + " more");
  }
}
