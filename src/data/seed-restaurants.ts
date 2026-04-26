import { Restaurant } from "@/types/restaurant";

export const seedRestaurants: Restaurant[] = [
  {
    id: "r1",
    slug: "trattoria-bellavista",
    name: { en: "Trattoria Bellavista", pl: "Trattoria Bellavista" },
    cuisine: "Italian",
    city: "Florence",
    description:
      { en: "Warm Tuscan comfort food with classic pasta, seafood, and regional bottles.", pl: "Domowa kuchnia toskańska — klasyczne makarony, owoce morza i regionalne wina." },
    coverGradient: "from-[#8b3a2f] via-[#c66a4b] to-[#f2c38b]",
    wines: [
      {
        id: "r1-w1",
        name: { en: "Marchesi Antinori Tignanello", pl: "Marchesi Antinori Tignanello" },
        region: "Toscana, Italy",
        grape: "Sangiovese Blend",
        style: "Red",
        vintage: "2020",
        notes: { en: "Dark cherry, cedar, tobacco, and polished tannins.", pl: "Ciemna wiśnia, cedr, tytoń i wypolerowane taniny." },
      },
      {
        id: "r1-w2",
        name: { en: "Frescobaldi Nipozzano Chianti Rufina Riserva", pl: "Frescobaldi Nipozzano Chianti Rufina Riserva" },
        region: "Tuscany, Italy",
        grape: "Sangiovese",
        style: "Red",
        vintage: "2021",
        notes: { en: "Bright sour cherry, herbs, and savory spice.", pl: "Świeża kwaśna wiśnia, zioła i wytrawne korzenne nuty." },
      },
      {
        id: "r1-w3",
        name: { en: "La Scolca Gavi dei Gavi Black Label", pl: "La Scolca Gavi dei Gavi Black Label" },
        region: "Piedmont, Italy",
        grape: "Cortese",
        style: "White",
        vintage: "2023",
        notes: { en: "Citrus peel, white flowers, and mineral finish.", pl: "Skórka cytrusów, białe kwiaty i mineralne wykończenie." },
      },
      {
        id: "r1-w4",
        name: { en: "Planeta Chardonnay", pl: "Planeta Chardonnay" },
        region: "Sicily, Italy",
        grape: "Chardonnay",
        style: "White",
        vintage: "2022",
        notes: { en: "Ripe stone fruit, vanilla, and balanced acidity.", pl: "Dojrzałe owoce pestkowe, wanilia i zbalansowana kwasowość." },
      },
      {
        id: "r1-w5",
        name: { en: "Ferrari Brut Trento DOC", pl: "Ferrari Brut Trento DOC" },
        region: "Trentino, Italy",
        grape: "Chardonnay",
        style: "Sparkling",
        vintage: "NV",
        notes: { en: "Fine bubbles, green apple, brioche, and crisp finish.", pl: "Drobne bąbelki, zielone jabłko, brioszka i świeże wykończenie." },
      },
      {
        id: "r1-w6",
        name: { en: "Donnafugata Ben Rye", pl: "Donnafugata Ben Rye" },
        region: "Pantelleria, Italy",
        grape: "Zibibbo",
        style: "Dessert",
        vintage: "2021",
        notes: { en: "Apricot, candied orange, honey, and saffron.", pl: "Morela, kandyzowana pomarańcza, miód i szafran." },
      },
      {
        id: "r1-w7",
        name: { en: "Castello Banfi Brunello di Montalcino", pl: "Castello Banfi Brunello di Montalcino" },
        region: "Tuscany, Italy",
        grape: "Sangiovese",
        style: "Red",
        vintage: "2019",
        notes: { en: "Black cherry, leather, dried herbs, and firm structure.", pl: "Czarna wiśnia, skóra, suszone zioła i mocna struktura." },
      },
      {
        id: "r1-w8",
        name: { en: "Jermann Pinot Grigio", pl: "Jermann Pinot Grigio" },
        region: "Friuli, Italy",
        grape: "Pinot Grigio",
        style: "White",
        vintage: "2023",
        notes: { en: "Pear, lemon zest, and saline minerality.", pl: "Gruszka, skórka cytryny i słona mineralność." },
      },
    ],
    dishes: [
      {
        id: "r1-d1",
        name: { en: "Pizza Margherita", pl: "Pizza Margherita" },
        category: "Pizza",
        description: { en: "San Marzano tomato, fior di latte, basil, and olive oil.", pl: "Pomidor San Marzano, fior di latte, bazylia i oliwa z oliwek." },
        price: 18,
        pairings: [
          {
            wineId: "r1-w2",
            reason: { en: "Sangiovese acidity mirrors tomato and refreshes melted cheese.", pl: "Kwasowość Sangiovese odpowiada pomidorowi i odświeża stopiony ser." },
          },
          {
            wineId: "r1-w5",
            reason: { en: "Sparkling bubbles cut richness and keep basil flavors bright.", pl: "Bąbelki musującego wina rozcinają tłustość i utrzymują świeży aromat bazylii." },
          },
        ],
      },
      {
        id: "r1-d2",
        name: { en: "Cacio e Pepe", pl: "Cacio e Pepe" },
        category: "Pasta",
        description: { en: "Handmade tonnarelli with pecorino romano and black pepper.", pl: "Ręcznie robione tonnarelli z pecorino romano i czarnym pieprzem." },
        price: 21,
        pairings: [
          {
            wineId: "r1-w3",
            reason: { en: "Mineral white wine balances salty pecorino and pepper heat.", pl: "Mineralne białe wino równoważy słone pecorino i ostrość pieprzu." },
          },
          {
            wineId: "r1-w8",
            reason: { en: "Pinot Grigio keeps the dish airy and highlights pepper aroma.", pl: "Pinot Grigio utrzymuje danie lekkim i podkreśla aromat pieprzu." },
          },
        ],
      },
      {
        id: "r1-d3",
        name: { en: "Tagliatelle al Ragu", pl: "Tagliatelle al ragù" },
        category: "Pasta",
        description: { en: "Slow-cooked beef and pork ragu with egg tagliatelle.", pl: "Wolno duszony ragù z wołowiny i wieprzowiny z makaronem tagliatelle z jajkami." },
        price: 25,
        pairings: [
          {
            wineId: "r1-w1",
            reason: { en: "Structured tannins match ragu depth and savory meat notes.", pl: "Strukturalne taniny pasują do głębi ragù i wytrawnych mięsnych nut." },
          },
          {
            wineId: "r1-w2",
            reason: { en: "Chianti herbs and cherry pair naturally with tomato-based sauce.", pl: "Zioła i wiśnia w Chianti naturalnie łączą się z sosem na bazie pomidorów." },
          },
        ],
      },
      {
        id: "r1-d4",
        name: { en: "Osso Buco alla Milanese", pl: "Osso Buco po mediolańsku" },
        category: "Main",
        description: { en: "Braised veal shank, saffron jus, and gremolata.", pl: "Duszona pręga cielęca, sos szafranowy i gremolata." },
        price: 34,
        pairings: [
          {
            wineId: "r1-w7",
            reason: { en: "Brunello structure stands up to gelatin-rich braised veal.", pl: "Struktura Brunello dorównuje bogatej w żelatynę duszonej cielęcinie." },
          },
          {
            wineId: "r1-w1",
            reason: { en: "Tignanello adds spice and depth to saffron and bone marrow.", pl: "Tignanello dodaje korzenności i głębi szafranowi oraz szpikowi." },
          },
        ],
      },
      {
        id: "r1-d5",
        name: { en: "Risotto alla Milanese", pl: "Risotto po mediolańsku" },
        category: "Rice",
        description: { en: "Carnaroli rice with saffron, butter, and parmigiano.", pl: "Ryż carnaroli z szafranem, masłem i parmigiano." },
        price: 24,
        pairings: [
          {
            wineId: "r1-w4",
            reason: { en: "Creamy Chardonnay texture echoes risotto body and saffron notes.", pl: "Kremowa tekstura Chardonnay odpowiada treściwości risotto i nutom szafranu." },
          },
          {
            wineId: "r1-w5",
            reason: { en: "Brut freshness cleans palate between buttery spoonfuls.", pl: "Świeżość brutu oczyszcza podniebienie między maślanymi łyżkami." },
          },
        ],
      },
      {
        id: "r1-d6",
        name: { en: "Branzino al Forno", pl: "Pieczony labraks" },
        category: "Seafood",
        description: { en: "Oven-roasted sea bass, lemon, capers, and herbs.", pl: "Pieczony labraks z piekarnika, cytryna, kapary i zioła." },
        price: 31,
        pairings: [
          {
            wineId: "r1-w3",
            reason: { en: "Citrus and minerality amplify delicate sea bass flavors.", pl: "Cytrusy i mineralność wzmacniają delikatne nuty labraksa." },
          },
          {
            wineId: "r1-w8",
            reason: { en: "Light body keeps fish and herbs in focus.", pl: "Lekka treściwość trzyma rybę i zioła w centrum uwagi." },
          },
        ],
      },
      {
        id: "r1-d7",
        name: { en: "Vitello Tonnato", pl: "Vitello Tonnato" },
        category: "Starter",
        description: { en: "Cold sliced veal with creamy tuna-caper sauce.", pl: "Zimna plasterkowana cielęcina z kremowym sosem tuńczykowo-kaparowym." },
        price: 22,
        pairings: [
          {
            wineId: "r1-w3",
            reason: { en: "High acidity sharpens the rich tuna emulsion.", pl: "Wysoka kwasowość wyostrza bogatą emulsję tuńczykową." },
          },
          {
            wineId: "r1-w5",
            reason: { en: "Fine mousse lightens the texture of chilled veal.", pl: "Drobny mus rozjaśnia teksturę zimnej cielęciny." },
          },
        ],
      },
      {
        id: "r1-d8",
        name: { en: "Melanzane alla Parmigiana", pl: "Bakłażan alla Parmigiana" },
        category: "Vegetarian",
        description: { en: "Layered eggplant, tomato sauce, mozzarella, and basil.", pl: "Warstwowy bakłażan, sos pomidorowy, mozzarella i bazylia." },
        price: 20,
        pairings: [
          {
            wineId: "r1-w2",
            reason: { en: "Acid-driven red supports tomato while keeping eggplant balanced.", pl: "Kwasowe czerwone wspiera pomidor, zachowując równowagę bakłażana." },
          },
          {
            wineId: "r1-w7",
            reason: { en: "Earthy Brunello complements roasted eggplant depth.", pl: "Ziemiste Brunello uzupełnia głębię pieczonego bakłażana." },
          },
        ],
      },
      {
        id: "r1-d9",
        name: { en: "Burrata e Pomodori", pl: "Burrata z pomidorami" },
        category: "Starter",
        description: { en: "Creamy burrata, heirloom tomatoes, basil, and aged balsamic.", pl: "Kremowa burrata, pomidory dziedziczne, bazylia i dojrzewający balsamico." },
        price: 19,
        pairings: [
          {
            wineId: "r1-w8",
            reason: { en: "Crisp pear and citrus cut through burrata creaminess.", pl: "Świeża gruszka i cytrusy przecinają kremowość burraty." },
          },
          {
            wineId: "r1-w5",
            reason: { en: "Bubbles and acidity refresh after each rich bite.", pl: "Bąbelki i kwasowość odświeżają po każdym treściwym kęsie." },
          },
        ],
      },
      {
        id: "r1-d10",
        name: { en: "Tiramisu", pl: "Tiramisu" },
        category: "Dessert",
        description: { en: "Mascarpone cream, espresso-soaked savoiardi, and cocoa.", pl: "Krem mascarpone, savoiardi nasączone espresso i kakao." },
        price: 14,
        pairings: [
          {
            wineId: "r1-w6",
            reason: { en: "Sweet apricot and honey tones complement cocoa and coffee.", pl: "Słodkie nuty moreli i miodu uzupełniają kakao i kawę." },
          },
          {
            wineId: "r1-w5",
            reason: { en: "A dry sparkling contrast keeps dessert from feeling heavy.", pl: "Wytrawny musujący kontrast nie pozwala deserowi sprawiać wrażenia ciężkiego." },
          },
        ],
      },
    ],
  },
  {
    id: "r2",
    slug: "sakura-ember",
    name: { en: "Sakura Ember", pl: "Sakura Ember" },
    cuisine: "Asian",
    city: "Copenhagen",
    description:
      { en: "Modern Japanese kitchen in Copenhagen with robata grill, pristine seafood, and precise pairings.", pl: "Nowoczesna kuchnia japońska w Kopenhadze — grill robata, świeże owoce morza i precyzyjne łączenia z winami." },
    coverGradient: "from-[#1f3b5f] via-[#3f6d8f] to-[#9cc3d5]",
    wines: [
      {
        id: "r2-w1",
        name: { en: "Cloudy Bay Sauvignon Blanc", pl: "Cloudy Bay Sauvignon Blanc" },
        region: "Marlborough, New Zealand",
        grape: "Sauvignon Blanc",
        style: "White",
        vintage: "2024",
        notes: { en: "Grapefruit, lime leaf, and bright herbal lift.", pl: "Grejpfrut, liść limonki i świeży ziołowy charakter." },
      },
      {
        id: "r2-w2",
        name: { en: "Domaine William Fevre Chablis", pl: "Domaine William Fevre Chablis" },
        region: "Burgundy, France",
        grape: "Chardonnay",
        style: "White",
        vintage: "2023",
        notes: { en: "Taut citrus, oyster shell, and chalky texture.", pl: "Napięte cytrusy, muszla ostrygi i kredowa tekstura." },
      },
      {
        id: "r2-w3",
        name: { en: "Dr. Loosen Riesling Kabinett", pl: "Dr. Loosen Riesling Kabinett" },
        region: "Mosel, Germany",
        grape: "Riesling",
        style: "White",
        vintage: "2023",
        notes: { en: "Green apple, peach, and off-dry precision.", pl: "Zielone jabłko, brzoskwinia i półwytrawna precyzja." },
      },
      {
        id: "r2-w4",
        name: { en: "Ruinart Blanc de Blancs", pl: "Ruinart Blanc de Blancs" },
        region: "Champagne, France",
        grape: "Chardonnay",
        style: "Sparkling",
        vintage: "NV",
        notes: { en: "Lemon curd, almond, and chalky bubbles.", pl: "Lemon curd, migdał i kredowe bąbelki." },
      },
      {
        id: "r2-w5",
        name: { en: "Billecart-Salmon Brut Rose", pl: "Billecart-Salmon Brut Rose" },
        region: "Champagne, France",
        grape: "Pinot Noir Blend",
        style: "Sparkling",
        vintage: "NV",
        notes: { en: "Wild strawberry, citrus peel, and elegant mousse.", pl: "Poziomka, skórka cytrusów i elegancki mus." },
      },
      {
        id: "r2-w6",
        name: { en: "Meiomi Pinot Noir", pl: "Meiomi Pinot Noir" },
        region: "California, USA",
        grape: "Pinot Noir",
        style: "Red",
        vintage: "2022",
        notes: { en: "Ripe berry, mocha, and silky tannins.", pl: "Dojrzałe jagody, mocha i jedwabiste taniny." },
      },
      {
        id: "r2-w7",
        name: { en: "Ridge Geyserville", pl: "Ridge Geyserville" },
        region: "Sonoma, USA",
        grape: "Zinfandel Blend",
        style: "Red",
        vintage: "2022",
        notes: { en: "Blackberry, pepper, and savory spice.", pl: "Jeżyna, pieprz i wytrawne korzenne nuty." },
      },
      {
        id: "r2-w8",
        name: { en: "Gerard Bertrand Cote des Roses Rose", pl: "Gerard Bertrand Cote des Roses Rose" },
        region: "Languedoc, France",
        grape: "Grenache Blend",
        style: "Rose",
        vintage: "2023",
        notes: { en: "Red berries, melon, and dry floral finish.", pl: "Czerwone owoce, melon i wytrawne kwiatowe wykończenie." },
      },
    ],
    dishes: [
      {
        id: "r2-d1",
        name: { en: "Hamachi Crudo", pl: "Hamachi Crudo" },
        category: "Starter",
        description: { en: "Yellowtail, yuzu kosho, shiso, and citrus soy.", pl: "Seriola, yuzu kosho, shiso i sos sojowy z cytrusami." },
        price: 24,
        pairings: [
          {
            wineId: "r2-w1",
            reason: { en: "Zesty citrus profile mirrors yuzu and lifts raw fish sweetness.", pl: "Pikantny cytrusowy profil odpowiada yuzu i podkreśla słodycz surowej ryby." },
          },
          {
            wineId: "r2-w4",
            reason: { en: "Fine bubbles cleanse palate after rich hamachi texture.", pl: "Drobne bąbelki oczyszczają podniebienie po bogatej teksturze hamachi." },
          },
        ],
      },
      {
        id: "r2-d2",
        name: { en: "Omakase Nigiri Set", pl: "Zestaw nigiri omakase" },
        category: "Sushi",
        description: { en: "Chef selection of seasonal nigiri, wasabi, and nikiri glaze.", pl: "Wybór szefa kuchni — sezonowe nigiri, wasabi i glazura nikiri." },
        price: 46,
        pairings: [
          {
            wineId: "r2-w2",
            reason: { en: "Chablis minerality mirrors the oceanic purity of nigiri.", pl: "Mineralność Chablis odpowiada oceanicznej czystości nigiri." },
          },
          {
            wineId: "r2-w4",
            reason: { en: "Champagne acidity resets the palate between different fish cuts.", pl: "Kwasowość Champagne resetuje podniebienie między różnymi rodzajami ryb." },
          },
        ],
      },
      {
        id: "r2-d3",
        name: { en: "Sashimi Moriawase", pl: "Sashimi moriawase" },
        category: "Sushi",
        description: { en: "Bluefin tuna, salmon, scallop, and madai sashimi.", pl: "Sashimi z tuńczyka błękitnopłetwego, łososia, przegrzebka i madai." },
        price: 39,
        pairings: [
          {
            wineId: "r2-w2",
            reason: { en: "Lean mineral structure supports delicate sashimi without masking it.", pl: "Smukła mineralna struktura wspiera delikatne sashimi, nie tłumiąc go." },
          },
          {
            wineId: "r2-w3",
            reason: { en: "Slight sweetness softens soy salt and enhances umami.", pl: "Lekka słodycz łagodzi sól sojową i wzmacnia umami." },
          },
        ],
      },
      {
        id: "r2-d4",
        name: { en: "Yakitori Thigh", pl: "Yakitori z udka" },
        category: "Grill",
        description: { en: "Binchotan grilled chicken thigh with tare and sansho.", pl: "Udko kurczaka z grilla binchōtan z sosem tare i pieprzem sanshō." },
        price: 19,
        pairings: [
          {
            wineId: "r2-w6",
            reason: { en: "Silky Pinot fruit balances smoky grill char and sweet tare.", pl: "Jedwabista owocowość Pinot równoważy dymne nuty grilla i słodkie tare." },
          },
          {
            wineId: "r2-w7",
            reason: { en: "Peppery red blend handles caramelized glaze intensity.", pl: "Pieprzowy red blend radzi sobie z intensywnością karmelizowanej glazury." },
          },
        ],
      },
      {
        id: "r2-d5",
        name: { en: "Miso Black Cod", pl: "Czarny dorsz miso" },
        category: "Main",
        description: { en: "Saikyo miso marinated cod, pickled daikon, and ginger.", pl: "Dorsz marynowany w saikyō miso, kiszony daikon i imbir." },
        price: 38,
        pairings: [
          {
            wineId: "r2-w3",
            reason: { en: "Off-dry Riesling balances sweet-salty miso glaze.", pl: "Półwytrawny Riesling równoważy słodko-słoną glazurę miso." },
          },
          {
            wineId: "r2-w1",
            reason: { en: "Herbal citrus notes brighten rich buttery cod.", pl: "Ziołowo-cytrusowe nuty rozjaśniają tłustego, maślanego dorsza." },
          },
        ],
      },
      {
        id: "r2-d6",
        name: { en: "Tempura Moriawase", pl: "Tempura moriawase" },
        category: "Fried",
        description: { en: "Shrimp and seasonal vegetables in light tempura batter.", pl: "Krewetki i sezonowe warzywa w lekkim cieście tempura." },
        price: 27,
        pairings: [
          {
            wineId: "r2-w4",
            reason: { en: "Lively mousse cuts fried texture and keeps flavors clean.", pl: "Żywy mus rozcina smażoną teksturę i utrzymuje czystość smaków." },
          },
          {
            wineId: "r2-w5",
            reason: { en: "Rose Champagne adds freshness and subtle berry lift.", pl: "Champagne rosé dodaje świeżości i subtelnej owocowej nuty." },
          },
        ],
      },
      {
        id: "r2-d7",
        name: { en: "Unagi Don", pl: "Unagi don" },
        category: "Rice",
        description: { en: "Charcoal grilled eel over rice with tare and sansho.", pl: "Węgorz z grilla na węglu drzewnym na ryżu z sosem tare i pieprzem sanshō." },
        price: 33,
        pairings: [
          {
            wineId: "r2-w3",
            reason: { en: "Residual sugar balances sweet soy glaze and eel fat.", pl: "Resztkowy cukier równoważy słodką glazurę sojową i tłustość węgorza." },
          },
          {
            wineId: "r2-w6",
            reason: { en: "Soft red fruit complements smoky caramelized eel.", pl: "Miękkie czerwone owoce uzupełniają dymnego, karmelizowanego węgorza." },
          },
        ],
      },
      {
        id: "r2-d8",
        name: { en: "Wagyu Tataki", pl: "Wagyu tataki" },
        category: "Main",
        description: { en: "Seared wagyu, ponzu, daikon, and garlic chips.", pl: "Smażone wagyu, ponzu, daikon i chipsy czosnkowe." },
        price: 44,
        pairings: [
          {
            wineId: "r2-w7",
            reason: { en: "Concentrated fruit and spice stand up to wagyu richness.", pl: "Skoncentrowana owocowość i korzenność dorównują tłustości wagyu." },
          },
          {
            wineId: "r2-w6",
            reason: { en: "Pinot texture supports beef fat without overwhelming ponzu.", pl: "Tekstura Pinot wspiera tłustość wołowiny, nie tłumiąc ponzu." },
          },
        ],
      },
      {
        id: "r2-d9",
        name: { en: "Shoyu Ramen", pl: "Ramen shoyu" },
        category: "Noodles",
        description: { en: "Chicken broth ramen with chashu, ajitama, and nori.", pl: "Ramen na bulionie z kurczaka z chashū, ajitamą i nori." },
        price: 23,
        pairings: [
          {
            wineId: "r2-w1",
            reason: { en: "Acidic lift cuts broth richness and highlights aromatics.", pl: "Kwasowy charakter rozcina bogactwo bulionu i podkreśla aromaty." },
          },
          {
            wineId: "r2-w3",
            reason: { en: "Riesling softness complements salty soy depth.", pl: "Miękkość Rieslinga uzupełnia słoną głębię sosu sojowego." },
          },
        ],
      },
      {
        id: "r2-d10",
        name: { en: "Matcha Basque Cheesecake", pl: "Sernik baskijski matcha" },
        category: "Dessert",
        description: { en: "Burnt cheesecake with ceremonial matcha cream.", pl: "Przypalany sernik baskijski z ceremonialnym kremem matcha." },
        price: 15,
        pairings: [
          {
            wineId: "r2-w5",
            reason: { en: "Red berry mousse offsets the earthy matcha edge.", pl: "Owocowy mus z czerwonych jagód niweluje ziemisty akcent matchy." },
          },
          {
            wineId: "r2-w3",
            reason: { en: "Delicate sweetness smooths the cheesecake bitterness.", pl: "Delikatna słodycz łagodzi gorycz sernika." },
          },
        ],
      },
    ],
  },
  {
    id: "r3",
    slug: "brasa-iberica",
    name: { en: "Brasa Iberica", pl: "Brasa Iberica" },
    cuisine: "European Mix",
    city: "Madrid",
    description:
      { en: "Spanish tapas and grill house focused on coastal seafood and cast-iron fire.", pl: "Hiszpańskie tapas i grill house z naciskiem na nadmorskie owoce morza i ogień z żeliwnego paleniska." },
    coverGradient: "from-[#5f2f23] via-[#a04d2b] to-[#e1a65b]",
    wines: [
      {
        id: "r3-w1",
        name: { en: "La Rioja Alta Vina Ardanza Reserva", pl: "La Rioja Alta Vina Ardanza Reserva" },
        region: "Rioja, Spain",
        grape: "Tempranillo Blend",
        style: "Red",
        vintage: "2019",
        notes: { en: "Red fruit, vanilla, and dried herbs.", pl: "Czerwone owoce, wanilia i suszone zioła." },
      },
      {
        id: "r3-w2",
        name: { en: "Marques de Murrieta Reserva", pl: "Marques de Murrieta Reserva" },
        region: "Rioja, Spain",
        grape: "Tempranillo Blend",
        style: "Red",
        vintage: "2020",
        notes: { en: "Plum, cedar, tobacco, and polished tannins.", pl: "Śliwka, cedr, tytoń i wypolerowane taniny." },
      },
      {
        id: "r3-w3",
        name: { en: "Vega Sicilia Valbuena 5", pl: "Vega Sicilia Valbuena 5" },
        region: "Ribera del Duero, Spain",
        grape: "Tempranillo Blend",
        style: "Red",
        vintage: "2018",
        notes: { en: "Dark berries, graphite, and long savory finish.", pl: "Ciemne owoce, grafit i długie wytrawne wykończenie." },
      },
      {
        id: "r3-w4",
        name: { en: "Martin Codax Albarino", pl: "Martin Codax Albarino" },
        region: "Rias Baixas, Spain",
        grape: "Albarino",
        style: "White",
        vintage: "2024",
        notes: { en: "Lime, peach, saline freshness, and floral notes.", pl: "Limonka, brzoskwinia, słona świeżość i kwiatowe nuty." },
      },
      {
        id: "r3-w5",
        name: { en: "Bodegas Muga Blanco", pl: "Bodegas Muga Blanco" },
        region: "Rioja, Spain",
        grape: "Viura Blend",
        style: "White",
        vintage: "2023",
        notes: { en: "Citrus, stone fruit, subtle oak, and crisp finish.", pl: "Cytrusy, owoce pestkowe, subtelny dąb i świeże wykończenie." },
      },
      {
        id: "r3-w6",
        name: { en: "Gramona Imperial Brut", pl: "Gramona Imperial Brut" },
        region: "Penedes, Spain",
        grape: "Cava Blend",
        style: "Sparkling",
        vintage: "2019",
        notes: { en: "Baked apple, brioche, and persistent bubbles.", pl: "Pieczone jabłko, brioszka i wytrwałe bąbelki." },
      },
      {
        id: "r3-w7",
        name: { en: "Torres Celeste Crianza", pl: "Torres Celeste Crianza" },
        region: "Ribera del Duero, Spain",
        grape: "Tempranillo",
        style: "Red",
        vintage: "2021",
        notes: { en: "Black cherry, cacao, and gentle oak spice.", pl: "Czarna wiśnia, kakao i delikatna dębowa korzenność." },
      },
      {
        id: "r3-w8",
        name: { en: "Lopez de Heredia Vina Tondonia Blanco Reserva", pl: "Lopez de Heredia Vina Tondonia Blanco Reserva" },
        region: "Rioja, Spain",
        grape: "Viura Blend",
        style: "White",
        vintage: "2012",
        notes: { en: "Nuts, dried citrus, and layered oxidative complexity.", pl: "Orzechy, suszone cytrusy i warstwowa oksydacyjna złożoność." },
      },
    ],
    dishes: [
      {
        id: "r3-d1",
        name: { en: "Patatas Bravas", pl: "Patatas Bravas" },
        category: "Tapas",
        description: { en: "Crisp potatoes, smoked paprika brava sauce, and aioli.", pl: "Chrupiące ziemniaki, sos brava z wędzoną papryką i aioli." },
        price: 12,
        pairings: [
          {
            wineId: "r3-w6",
            reason: { en: "Cava bubbles clean up aioli richness and spice oil.", pl: "Bąbelki Cavy oczyszczają tłustość aioli i pikantnej oliwy." },
          },
          {
            wineId: "r3-w4",
            reason: { en: "Citrus-driven Albarino cools paprika heat.", pl: "Cytrusowy Albariño chłodzi ostrość papryki." },
          },
        ],
      },
      {
        id: "r3-d2",
        name: { en: "Gambas al Ajillo", pl: "Gambas al ajillo" },
        category: "Tapas",
        description: { en: "Shrimp sauteed in olive oil, garlic, and dried chili.", pl: "Krewetki podsmażane na oliwie z czosnkiem i suszonym chili." },
        price: 18,
        pairings: [
          {
            wineId: "r3-w4",
            reason: { en: "Saline white enhances sweet shrimp and garlic oil.", pl: "Słone białe wino wzmacnia słodkie krewetki i czosnkową oliwę." },
          },
          {
            wineId: "r3-w8",
            reason: { en: "Layered white handles intensity of garlic and chili.", pl: "Warstwowe białe wino radzi sobie z intensywnością czosnku i chili." },
          },
        ],
      },
      {
        id: "r3-d3",
        name: { en: "Tortilla Espanola", pl: "Hiszpańska tortilla" },
        category: "Tapas",
        description: { en: "Potato and onion omelet with olive oil confit texture.", pl: "Omlet z ziemniakami i cebulą o teksturze konfitowanej w oliwie." },
        price: 14,
        pairings: [
          {
            wineId: "r3-w5",
            reason: { en: "Medium-bodied white complements egg richness.", pl: "Średnio treściwe białe wino uzupełnia bogactwo jajek." },
          },
          {
            wineId: "r3-w6",
            reason: { en: "Sparkling acidity keeps each bite light.", pl: "Musująca kwasowość utrzymuje każdy kęs lekkim." },
          },
        ],
      },
      {
        id: "r3-d4",
        name: { en: "Pulpo a la Gallega", pl: "Pulpo a la Gallega" },
        category: "Seafood",
        description: { en: "Tender octopus, smoked paprika, potato, and olive oil.", pl: "Delikatna ośmiornica, wędzona papryka, ziemniak i oliwa." },
        price: 23,
        pairings: [
          {
            wineId: "r3-w4",
            reason: { en: "Albarino minerality complements octopus sweetness.", pl: "Mineralność Albariño uzupełnia słodycz ośmiornicy." },
          },
          {
            wineId: "r3-w5",
            reason: { en: "Subtle oak adds body for paprika and oil.", pl: "Subtelny dąb dodaje treściwości pod paprykę i oliwę." },
          },
        ],
      },
      {
        id: "r3-d5",
        name: { en: "Paella Valenciana", pl: "Paella valenciana" },
        category: "Rice",
        description: { en: "Saffron rice with chicken, rabbit, and green beans.", pl: "Ryż z szafranem, kurczak, królik i zielona fasolka." },
        price: 32,
        pairings: [
          {
            wineId: "r3-w2",
            reason: { en: "Rioja fruit and spice match saffron and roasted meat notes.", pl: "Owocowość i korzenność Rioja pasują do szafranu i pieczonych mięsnych nut." },
          },
          {
            wineId: "r3-w4",
            reason: { en: "Bright acidity keeps the rice dish lively.", pl: "Świeża kwasowość utrzymuje danie z ryżu pełnym życia." },
          },
        ],
      },
      {
        id: "r3-d6",
        name: { en: "Bacalao al Pil Pil", pl: "Bacalao al Pil Pil" },
        category: "Seafood",
        description: { en: "Salt cod with emulsified garlic and olive oil sauce.", pl: "Solony dorsz z emulgowanym sosem z czosnku i oliwy." },
        price: 29,
        pairings: [
          {
            wineId: "r3-w8",
            reason: { en: "Complex aged white supports garlic-driven richness.", pl: "Złożone, dojrzewające białe wino wspiera bogactwo czosnku." },
          },
          {
            wineId: "r3-w4",
            reason: { en: "Fresh saline profile balances cod salinity.", pl: "Świeży słony profil równoważy słoność dorsza." },
          },
        ],
      },
      {
        id: "r3-d7",
        name: { en: "Cochinillo Asado", pl: "Pieczone prosię" },
        category: "Main",
        description: { en: "Slow-roasted suckling pig with crackling skin.", pl: "Wolno pieczone prosię z chrupiącą skórką." },
        price: 36,
        pairings: [
          {
            wineId: "r3-w3",
            reason: { en: "Concentrated red with structure matches crispy pork richness.", pl: "Skoncentrowane czerwone wino ze strukturą odpowiada chrupiącej tłustości wieprzowiny." },
          },
          {
            wineId: "r3-w1",
            reason: { en: "Reserva acidity cuts through rendered fat.", pl: "Kwasowość Reserva przecina wytopiony tłuszcz." },
          },
        ],
      },
      {
        id: "r3-d8",
        name: { en: "Croquetas de Jamon", pl: "Krokiety z szynką jamón" },
        category: "Tapas",
        description: { en: "Creamy Iberico ham croquettes with crisp crust.", pl: "Kremowe krokiety z szynką ibérico w chrupiącej panierce." },
        price: 15,
        pairings: [
          {
            wineId: "r3-w6",
            reason: { en: "Sparkling texture clears bechamel richness.", pl: "Musująca tekstura oczyszcza bogactwo beszamelu." },
          },
          {
            wineId: "r3-w5",
            reason: { en: "White fruit notes offset savory ham intensity.", pl: "Nuty białych owoców równoważą wytrawną intensywność szynki." },
          },
        ],
      },
      {
        id: "r3-d9",
        name: { en: "Chuleton a la Brasa", pl: "Chuletón z grilla" },
        category: "Grill",
        description: { en: "Dry-aged rib steak cooked over oak embers.", pl: "Stek żebrowy dojrzewający na sucho, pieczony nad dębowym żarem." },
        price: 54,
        pairings: [
          {
            wineId: "r3-w3",
            reason: { en: "Dense tannic frame is ideal for charred beef.", pl: "Gęsta tanniczna struktura jest idealna dla wołowiny z grilla." },
          },
          {
            wineId: "r3-w7",
            reason: { en: "Ripe fruit and spice echo grilled crust flavors.", pl: "Dojrzała owocowość i korzenność odpowiadają nutom grillowanej skórki." },
          },
        ],
      },
      {
        id: "r3-d10",
        name: { en: "Basque Cheesecake", pl: "Sernik baskijski" },
        category: "Dessert",
        description: { en: "Burnt-top cheesecake with creamy center.", pl: "Sernik z przypalonym wierzchem i kremowym środkiem." },
        price: 13,
        pairings: [
          {
            wineId: "r3-w6",
            reason: { en: "Brut bubbles refresh palate after rich creamy texture.", pl: "Bąbelki brutu odświeżają podniebienie po bogatej kremowej teksturze." },
          },
          {
            wineId: "r3-w4",
            reason: { en: "Fresh fruit notes brighten caramelized top.", pl: "Świeże owocowe nuty rozjaśniają karmelizowany wierzch." },
          },
        ],
      },
    ],
  },
  {
    id: "r4",
    slug: "bistro-maree",
    name: { en: "Bistro Maree", pl: "Bistro Maree" },
    cuisine: "French",
    city: "Lyon",
    description:
      { en: "French bistro classics with seafood focus and cellar-style old world labels.", pl: "Klasyka francuskiego bistro — owoce morza i piwniczne etykiety ze starego świata." },
    coverGradient: "from-[#2d3b52] via-[#58789a] to-[#c2d4e8]",
    wines: [
      {
        id: "r4-w1",
        name: { en: "Domaine Vacheron Sancerre Blanc", pl: "Domaine Vacheron Sancerre Blanc" },
        region: "Loire, France",
        grape: "Sauvignon Blanc",
        style: "White",
        vintage: "2023",
        notes: { en: "Lemon zest, gooseberry, and flinty minerality.", pl: "Skórka cytryny, agrest i krzemienna mineralność." },
      },
      {
        id: "r4-w2",
        name: { en: "Domaine William Fevre Chablis Premier Cru", pl: "Domaine William Fevre Chablis Premier Cru" },
        region: "Burgundy, France",
        grape: "Chardonnay",
        style: "White",
        vintage: "2022",
        notes: { en: "Crisp citrus, oyster shell, and linear acidity.", pl: "Świeże cytrusy, muszla ostrygi i liniowa kwasowość." },
      },
      {
        id: "r4-w3",
        name: { en: "Louis Jadot Beaune Premier Cru", pl: "Louis Jadot Beaune Premier Cru" },
        region: "Burgundy, France",
        grape: "Pinot Noir",
        style: "Red",
        vintage: "2021",
        notes: { en: "Red cherry, forest floor, and gentle spice.", pl: "Czerwona wiśnia, ściółka leśna i delikatne korzenne nuty." },
      },
      {
        id: "r4-w4",
        name: { en: "Chateau de Beaucastel Chateauneuf-du-Pape", pl: "Chateau de Beaucastel Chateauneuf-du-Pape" },
        region: "Rhone, France",
        grape: "Grenache Blend",
        style: "Red",
        vintage: "2020",
        notes: { en: "Black fruit, garrigue herbs, and structured finish.", pl: "Czarne owoce, zioła garrigue i strukturalne wykończenie." },
      },
      {
        id: "r4-w5",
        name: { en: "Whispering Angel Rose", pl: "Whispering Angel Rose" },
        region: "Provence, France",
        grape: "Grenache Blend",
        style: "Rose",
        vintage: "2024",
        notes: { en: "Strawberry, peach, and dry mineral finish.", pl: "Truskawka, brzoskwinia i wytrawne mineralne wykończenie." },
      },
      {
        id: "r4-w6",
        name: { en: "Bollinger Special Cuvee", pl: "Bollinger Special Cuvee" },
        region: "Champagne, France",
        grape: "Pinot Noir Blend",
        style: "Sparkling",
        vintage: "NV",
        notes: { en: "Apple, brioche, toasted nuts, and long mousse.", pl: "Jabłko, brioszka, prażone orzechy i długi mus." },
      },
      {
        id: "r4-w7",
        name: { en: "Chateau Smith Haut Lafitte Blanc", pl: "Chateau Smith Haut Lafitte Blanc" },
        region: "Bordeaux, France",
        grape: "Sauvignon Blanc Blend",
        style: "White",
        vintage: "2021",
        notes: { en: "Citrus, white peach, and subtle oak smoke.", pl: "Cytrusy, biała brzoskwinia i subtelny dąb z dymem." },
      },
      {
        id: "r4-w8",
        name: { en: "Chateau La Dominique Saint-Emilion Grand Cru", pl: "Chateau La Dominique Saint-Emilion Grand Cru" },
        region: "Bordeaux, France",
        grape: "Merlot Blend",
        style: "Red",
        vintage: "2020",
        notes: { en: "Plum, cocoa, and velvety tannins.", pl: "Śliwka, kakao i aksamitne taniny." },
      },
    ],
    dishes: [
      {
        id: "r4-d1",
        name: { en: "French Onion Soup", pl: "Francuska zupa cebulowa" },
        category: "Starter",
        description: { en: "Caramelized onion broth, crouton, and gruyere gratin.", pl: "Bulion z karmelizowanej cebuli, grzanka i zapiekanka z gruyère." },
        price: 16,
        pairings: [
          {
            wineId: "r4-w3",
            reason: { en: "Pinot earthiness mirrors caramelized onion depth.", pl: "Ziemistość Pinota odpowiada głębi karmelizowanej cebuli." },
          },
          {
            wineId: "r4-w6",
            reason: { en: "Sparkling acidity cuts melted cheese richness.", pl: "Musująca kwasowość przecina bogactwo stopionego sera." },
          },
        ],
      },
      {
        id: "r4-d2",
        name: { en: "Steak Frites", pl: "Stek z frytkami" },
        category: "Main",
        description: { en: "Striploin, pommes frites, and cafe de paris butter.", pl: "Rostbef, pommes frites i masło Café de Paris." },
        price: 39,
        pairings: [
          {
            wineId: "r4-w8",
            reason: { en: "Merlot blend tannins handle beef and butter intensity.", pl: "Taniny mieszanki Merlot radzą sobie z intensywnością wołowiny i masła." },
          },
          {
            wineId: "r4-w4",
            reason: { en: "Rhone spice amplifies seared crust and pepper.", pl: "Korzenność Rodanu wzmacnia smażoną skórkę i pieprz." },
          },
        ],
      },
      {
        id: "r4-d3",
        name: { en: "Duck Confit", pl: "Konfitowana kaczka" },
        category: "Main",
        description: { en: "Slow-cooked duck leg, lentils, and mustard jus.", pl: "Wolno pieczone udko kaczki, soczewica i sos musztardowy." },
        price: 34,
        pairings: [
          {
            wineId: "r4-w4",
            reason: { en: "Savory Rhone profile matches crispy duck skin.", pl: "Wytrawny profil Rodanu pasuje do chrupiącej skórki kaczki." },
          },
          {
            wineId: "r4-w3",
            reason: { en: "Pinot brightness lifts the rich confit fat.", pl: "Świeżość Pinota podnosi bogaty tłuszcz konfitu." },
          },
        ],
      },
      {
        id: "r4-d4",
        name: { en: "Bouillabaisse", pl: "Bouillabaisse" },
        category: "Seafood",
        description: { en: "Marseille fish stew with saffron rouille.", pl: "Marsylski gulasz rybny z szafranowym rouille." },
        price: 37,
        pairings: [
          {
            wineId: "r4-w2",
            reason: { en: "Mineral Chablis supports shellfish and saffron broth.", pl: "Mineralne Chablis wspiera skorupiaki i bulion z szafranem." },
          },
          {
            wineId: "r4-w7",
            reason: { en: "Layered white has enough body for rich rouille.", pl: "Warstwowe białe wino ma wystarczająco treściwości dla bogatego rouille." },
          },
        ],
      },
      {
        id: "r4-d5",
        name: { en: "Ratatouille Tart", pl: "Tarta ratatouille" },
        category: "Vegetarian",
        description: { en: "Tomato tart with confit zucchini and eggplant.", pl: "Tarta pomidorowa z konfitowaną cukinią i bakłażanem." },
        price: 22,
        pairings: [
          {
            wineId: "r4-w5",
            reason: { en: "Dry rose complements roasted vegetables and herbs.", pl: "Wytrawne rosé uzupełnia pieczone warzywa i zioła." },
          },
          {
            wineId: "r4-w1",
            reason: { en: "Crisp Loire white lifts tomato sweetness.", pl: "Świeże białe wino z Loary podnosi słodycz pomidora." },
          },
        ],
      },
      {
        id: "r4-d6",
        name: { en: "Coq au Vin", pl: "Coq au vin" },
        category: "Main",
        description: { en: "Red wine braised chicken, mushrooms, and pearl onions.", pl: "Kurczak duszony w czerwonym winie z grzybami i perłową cebulą." },
        price: 31,
        pairings: [
          {
            wineId: "r4-w8",
            reason: { en: "Soft tannins and plum fruit align with braising sauce.", pl: "Miękkie taniny i nuty śliwki pasują do sosu z duszenia." },
          },
          {
            wineId: "r4-w4",
            reason: { en: "Rhone herbs deepen mushroom and onion notes.", pl: "Zioła Rodanu pogłębiają nuty grzybów i cebuli." },
          },
        ],
      },
      {
        id: "r4-d7",
        name: { en: "Sole Meuniere", pl: "Sola meunière" },
        category: "Seafood",
        description: { en: "Pan-seared sole, browned butter, lemon, and parsley.", pl: "Smażona sola, masło orzechowe, cytryna i pietruszka." },
        price: 36,
        pairings: [
          {
            wineId: "r4-w2",
            reason: { en: "Precise acidity balances beurre noisette richness.", pl: "Precyzyjna kwasowość równoważy bogactwo masła orzechowego." },
          },
          {
            wineId: "r4-w1",
            reason: { en: "Citrus and minerality keep fish flavors focused.", pl: "Cytrusy i mineralność utrzymują smaki ryby w centrum." },
          },
        ],
      },
      {
        id: "r4-d8",
        name: { en: "Nicoise Salad", pl: "Sałatka niçoise" },
        category: "Salad",
        description: { en: "Tuna, egg, olives, green beans, and anchovy dressing.", pl: "Tuńczyk, jajko, oliwki, fasolka szparagowa i sos anchois." },
        price: 24,
        pairings: [
          {
            wineId: "r4-w1",
            reason: { en: "Sancerre acidity handles salty anchovy and tuna.", pl: "Kwasowość Sancerre radzi sobie ze słonymi anchois i tuńczykiem." },
          },
          {
            wineId: "r4-w5",
            reason: { en: "Rose offers fruit contrast for briny olives.", pl: "Rosé oferuje owocowy kontrast dla słonych oliwek." },
          },
        ],
      },
      {
        id: "r4-d9",
        name: { en: "Truffle Brie Ravioli", pl: "Ravioli z brie i truflą" },
        category: "Pasta",
        description: { en: "Fresh ravioli, truffle cream, and aged comte.", pl: "Świeże ravioli, krem truflowy i dojrzewające comté." },
        price: 29,
        pairings: [
          {
            wineId: "r4-w7",
            reason: { en: "Oak-kissed white matches truffle and creamy cheese.", pl: "Lekko dębowane białe pasuje do trufli i kremowego sera." },
          },
          {
            wineId: "r4-w6",
            reason: { en: "Champagne bubbles reduce richness and reset palate.", pl: "Bąbelki Champagne redukują tłustość i resetują podniebienie." },
          },
        ],
      },
      {
        id: "r4-d10",
        name: { en: "Creme Brulee", pl: "Crème brûlée" },
        category: "Dessert",
        description: { en: "Vanilla custard with caramelized sugar crust.", pl: "Krem waniliowy z karmelizowaną skorupką cukrową." },
        price: 13,
        pairings: [
          {
            wineId: "r4-w6",
            reason: { en: "Toasty notes mirror caramelized top while staying fresh.", pl: "Tostowe nuty odpowiadają karmelizowanemu wierzchu, pozostając świeże." },
          },
          {
            wineId: "r4-w5",
            reason: { en: "Dry rose adds berry lift without oversweetening dessert.", pl: "Wytrawne rosé dodaje owocowej nuty bez przesłodzenia deseru." },
          },
        ],
      },
    ],
  },
  {
    id: "r5",
    slug: "andes-fuego",
    name: { en: "Andes Fuego", pl: "Andes Fuego" },
    cuisine: "Asian-Latin Mix",
    city: "Lisbon",
    description:
      { en: "Peruvian and Nikkei signatures in Lisbon with bright citrus, chili, and charcoal notes.", pl: "Peruwiańskie i Nikkei popisy w Lizbonie — żywe cytrusy, papryczki chili i nuty z węgla drzewnego." },
    coverGradient: "from-[#38472f] via-[#6a8b53] to-[#d7c88f]",
    wines: [
      {
        id: "r5-w1",
        name: { en: "Catena Zapata Malbec Argentino", pl: "Catena Zapata Malbec Argentino" },
        region: "Mendoza, Argentina",
        grape: "Malbec",
        style: "Red",
        vintage: "2021",
        notes: { en: "Black plum, violet, and smooth dense finish.", pl: "Czarna śliwka, fiołek i gładkie, gęste wykończenie." },
      },
      {
        id: "r5-w2",
        name: { en: "Montes Alpha Cabernet Sauvignon", pl: "Montes Alpha Cabernet Sauvignon" },
        region: "Colchagua, Chile",
        grape: "Cabernet Sauvignon",
        style: "Red",
        vintage: "2021",
        notes: { en: "Cassis, cedar, and firm tannin backbone.", pl: "Cassis, cedr i mocna tanniczna struktura." },
      },
      {
        id: "r5-w3",
        name: { en: "Marques de Casa Concha Chardonnay", pl: "Marques de Casa Concha Chardonnay" },
        region: "Limari, Chile",
        grape: "Chardonnay",
        style: "White",
        vintage: "2023",
        notes: { en: "Citrus curd, stone fruit, and creamy texture.", pl: "Cytrusowy curd, owoce pestkowe i kremowa tekstura." },
      },
      {
        id: "r5-w4",
        name: { en: "Lapostolle Cuvee Alexandre Carmenere", pl: "Lapostolle Cuvee Alexandre Carmenere" },
        region: "Apalta, Chile",
        grape: "Carmenere",
        style: "Red",
        vintage: "2021",
        notes: { en: "Blackberries, pepper, and smoky herbal finish.", pl: "Jeżyny, pieprz i dymne ziołowe wykończenie." },
      },
      {
        id: "r5-w5",
        name: { en: "Garzon Reserva Albarino", pl: "Garzon Reserva Albarino" },
        region: "Maldonado, Uruguay",
        grape: "Albarino",
        style: "White",
        vintage: "2024",
        notes: { en: "Lime zest, white peach, and saline edge.", pl: "Skórka limonki, biała brzoskwinia i słony akcent." },
      },
      {
        id: "r5-w6",
        name: { en: "Santa Rita Casa Real Cabernet Sauvignon", pl: "Santa Rita Casa Real Cabernet Sauvignon" },
        region: "Maipo, Chile",
        grape: "Cabernet Sauvignon",
        style: "Red",
        vintage: "2020",
        notes: { en: "Dark fruit, graphite, and polished oak.", pl: "Ciemne owoce, grafit i wypolerowany dąb." },
      },
      {
        id: "r5-w7",
        name: { en: "Zuccardi Q Torrontes", pl: "Zuccardi Q Torrontes" },
        region: "Salta, Argentina",
        grape: "Torrontes",
        style: "White",
        vintage: "2024",
        notes: { en: "Jasmine, grapefruit, and aromatic lift.", pl: "Jaśmin, grejpfrut i aromatyczny charakter." },
      },
      {
        id: "r5-w8",
        name: { en: "Vina Cobos Bramare Malbec", pl: "Vina Cobos Bramare Malbec" },
        region: "Mendoza, Argentina",
        grape: "Malbec",
        style: "Red",
        vintage: "2021",
        notes: { en: "Black cherry, cocoa, and structured mouthfeel.", pl: "Czarna wiśnia, kakao i strukturalna wyrazistość w ustach." },
      },
    ],
    dishes: [
      {
        id: "r5-d1",
        name: { en: "Ceviche Clasico", pl: "Ceviche clásico" },
        category: "Cold",
        description: { en: "Fresh white fish, leche de tigre, red onion, and cancha.", pl: "Świeża biała ryba, leche de tigre, czerwona cebula i kukurydza cancha." },
        price: 22,
        pairings: [
          {
            wineId: "r5-w5",
            reason: { en: "Zesty acidity mirrors lime and keeps fish ultra fresh.", pl: "Pikantna kwasowość odpowiada limonce i utrzymuje rybę w pełnej świeżości." },
          },
          {
            wineId: "r5-w7",
            reason: { en: "Aromatic white softens chili heat and citrus bite.", pl: "Aromatyczne białe wino łagodzi ostrość chili i cytrusowy akcent." },
          },
        ],
      },
      {
        id: "r5-d2",
        name: { en: "Tiradito Nikkei", pl: "Tiradito Nikkei" },
        category: "Cold",
        description: { en: "Sliced tuna with ponzu, aji amarillo, and sesame.", pl: "Plastry tuńczyka z ponzu, ají amarillo i sezamem." },
        price: 24,
        pairings: [
          {
            wineId: "r5-w3",
            reason: { en: "Textured Chardonnay supports tuna and sesame richness.", pl: "Strukturalne Chardonnay wspiera tuńczyka i bogactwo sezamu." },
          },
          {
            wineId: "r5-w5",
            reason: { en: "Albarino brightness sharpens ponzu citrus profile.", pl: "Świeżość Albariño wyostrza cytrusowy profil ponzu." },
          },
        ],
      },
      {
        id: "r5-d3",
        name: { en: "Lomo Saltado", pl: "Lomo saltado" },
        category: "Main",
        description: { en: "Stir-fried beef, tomato, onion, soy, and fries.", pl: "Wołowina z woka z pomidorem, cebulą, sosem sojowym i frytkami." },
        price: 29,
        pairings: [
          {
            wineId: "r5-w1",
            reason: { en: "Malbec fruit and body hold up to soy-seared beef.", pl: "Owocowość i treściwość Malbeca dorównują wołowinie smażonej w sosie sojowym." },
          },
          {
            wineId: "r5-w4",
            reason: { en: "Carmenere spice aligns with wok-charred aromatics.", pl: "Korzenność Carmenère pasuje do aromatów z woka." },
          },
        ],
      },
      {
        id: "r5-d4",
        name: { en: "Aji de Gallina", pl: "Ají de gallina" },
        category: "Main",
        description: { en: "Creamy chicken stew with aji amarillo and walnuts.", pl: "Kremowy gulasz z kurczaka z ají amarillo i orzechami włoskimi." },
        price: 25,
        pairings: [
          {
            wineId: "r5-w3",
            reason: { en: "Creamy Chardonnay texture matches sauce body.", pl: "Kremowa tekstura Chardonnay odpowiada treściwości sosu." },
          },
          {
            wineId: "r5-w7",
            reason: { en: "Floral aromatics cool yellow chili warmth.", pl: "Kwiatowe aromaty chłodzą ciepło żółtego chili." },
          },
        ],
      },
      {
        id: "r5-d5",
        name: { en: "Causa Limena", pl: "Causa limeña" },
        category: "Starter",
        description: { en: "Layered potato terrine with crab, avocado, and lime.", pl: "Warstwowy terrine ziemniaczany z krabem, awokado i limonką." },
        price: 19,
        pairings: [
          {
            wineId: "r5-w5",
            reason: { en: "Fresh saline profile complements crab sweetness.", pl: "Świeży słony profil uzupełnia słodycz kraba." },
          },
          {
            wineId: "r5-w3",
            reason: { en: "Rounded white texture suits creamy avocado.", pl: "Zaokrąglona tekstura białego pasuje do kremowego awokado." },
          },
        ],
      },
      {
        id: "r5-d6",
        name: { en: "Anticuchos de Corazon", pl: "Anticuchos de corazón" },
        category: "Grill",
        description: { en: "Beef heart skewers with aji panca glaze.", pl: "Szaszłyki z serca wołowego w glazurze ají panca." },
        price: 21,
        pairings: [
          {
            wineId: "r5-w2",
            reason: { en: "Cabernet tannins match grilled protein and char.", pl: "Taniny Cabernet pasują do grillowanego białka i nut z węgla." },
          },
          {
            wineId: "r5-w8",
            reason: { en: "Bold Malbec fruit balances smoky chili spice.", pl: "Wyrazista owocowość Malbeca równoważy dymną korzenność chili." },
          },
        ],
      },
      {
        id: "r5-d7",
        name: { en: "Arroz con Mariscos", pl: "Arroz con mariscos" },
        category: "Rice",
        description: { en: "Seafood rice with saffron, peas, and rocoto.", pl: "Ryż z owocami morza, szafranem, groszkiem i papryczką rocoto." },
        price: 30,
        pairings: [
          {
            wineId: "r5-w5",
            reason: { en: "Crisp acidity keeps shellfish and spice in balance.", pl: "Świeża kwasowość utrzymuje skorupiaki i korzenność w równowadze." },
          },
          {
            wineId: "r5-w3",
            reason: { en: "Fruit-forward Chardonnay complements saffron rice.", pl: "Owocowe Chardonnay uzupełnia ryż z szafranem." },
          },
        ],
      },
      {
        id: "r5-d8",
        name: { en: "Seco de Cordero", pl: "Seco de cordero" },
        category: "Main",
        description: { en: "Braised lamb with cilantro, beer, and beans.", pl: "Duszona jagnięcina z kolendrą, piwem i fasolą." },
        price: 33,
        pairings: [
          {
            wineId: "r5-w8",
            reason: { en: "Concentrated Malbec handles lamb and herbal braise.", pl: "Skoncentrowany Malbec radzi sobie z jagnięciną i ziołowym duszeniem." },
          },
          {
            wineId: "r5-w1",
            reason: { en: "Classic Malbec plushness fits tender slow-cooked meat.", pl: "Klasyczna pluszowość Malbeca pasuje do delikatnego, wolno duszonego mięsa." },
          },
        ],
      },
      {
        id: "r5-d9",
        name: { en: "Tacu Tacu", pl: "Tacu tacu" },
        category: "Main",
        description: { en: "Crisp rice-bean cake with fried egg and salsa criolla.", pl: "Chrupiący placek z ryżu i fasoli z sadzonym jajkiem i salsa criolla." },
        price: 23,
        pairings: [
          {
            wineId: "r5-w4",
            reason: { en: "Spicy red profile matches crispy savory bean cake.", pl: "Pikantny czerwony profil pasuje do chrupiącego, wytrawnego placka z fasoli." },
          },
          {
            wineId: "r5-w1",
            reason: { en: "Soft tannins and dark fruit complement egg yolk richness.", pl: "Miękkie taniny i ciemne owoce uzupełniają bogactwo żółtka." },
          },
        ],
      },
      {
        id: "r5-d10",
        name: { en: "Picarones", pl: "Picarones" },
        category: "Dessert",
        description: { en: "Pumpkin-sweet potato fritters with chancaca syrup.", pl: "Pączki z dyni i batata z syropem chancaca." },
        price: 12,
        pairings: [
          {
            wineId: "r5-w7",
            reason: { en: "Floral aromatics add lift to caramelized syrup.", pl: "Kwiatowe aromaty dodają lekkości karmelizowanemu syropowi." },
          },
          {
            wineId: "r5-w5",
            reason: { en: "Dry acidity balances sweet fried dough texture.", pl: "Wytrawna kwasowość równoważy słodką teksturę smażonego ciasta." },
          },
        ],
      },
    ],
  },
];
