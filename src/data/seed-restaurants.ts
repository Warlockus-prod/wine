import { Restaurant } from "@/types/restaurant";

export const seedRestaurants: Restaurant[] = [
  {
    id: "r1",
    slug: "trattoria-bellavista",
    name: "Trattoria Bellavista",
    cuisine: "Italian",
    city: "Florence",
    description:
      "Warm Tuscan comfort food with classic pasta, seafood, and regional bottles.",
    coverGradient: "from-[#8b3a2f] via-[#c66a4b] to-[#f2c38b]",
    wines: [
      {
        id: "r1-w1",
        name: "Marchesi Antinori Tignanello",
        region: "Toscana, Italy",
        grape: "Sangiovese Blend",
        style: "Red",
        vintage: "2020",
        notes: "Dark cherry, cedar, tobacco, and polished tannins.",
      },
      {
        id: "r1-w2",
        name: "Frescobaldi Nipozzano Chianti Rufina Riserva",
        region: "Tuscany, Italy",
        grape: "Sangiovese",
        style: "Red",
        vintage: "2021",
        notes: "Bright sour cherry, herbs, and savory spice.",
      },
      {
        id: "r1-w3",
        name: "La Scolca Gavi dei Gavi Black Label",
        region: "Piedmont, Italy",
        grape: "Cortese",
        style: "White",
        vintage: "2023",
        notes: "Citrus peel, white flowers, and mineral finish.",
      },
      {
        id: "r1-w4",
        name: "Planeta Chardonnay",
        region: "Sicily, Italy",
        grape: "Chardonnay",
        style: "White",
        vintage: "2022",
        notes: "Ripe stone fruit, vanilla, and balanced acidity.",
      },
      {
        id: "r1-w5",
        name: "Ferrari Brut Trento DOC",
        region: "Trentino, Italy",
        grape: "Chardonnay",
        style: "Sparkling",
        vintage: "NV",
        notes: "Fine bubbles, green apple, brioche, and crisp finish.",
      },
      {
        id: "r1-w6",
        name: "Donnafugata Ben Rye",
        region: "Pantelleria, Italy",
        grape: "Zibibbo",
        style: "Dessert",
        vintage: "2021",
        notes: "Apricot, candied orange, honey, and saffron.",
      },
      {
        id: "r1-w7",
        name: "Castello Banfi Brunello di Montalcino",
        region: "Tuscany, Italy",
        grape: "Sangiovese",
        style: "Red",
        vintage: "2019",
        notes: "Black cherry, leather, dried herbs, and firm structure.",
      },
      {
        id: "r1-w8",
        name: "Jermann Pinot Grigio",
        region: "Friuli, Italy",
        grape: "Pinot Grigio",
        style: "White",
        vintage: "2023",
        notes: "Pear, lemon zest, and saline minerality.",
      },
    ],
    dishes: [
      {
        id: "r1-d1",
        name: "Pizza Margherita",
        category: "Pizza",
        description: "San Marzano tomato, fior di latte, basil, and olive oil.",
        price: 18,
        pairings: [
          {
            wineId: "r1-w2",
            reason: "Sangiovese acidity mirrors tomato and refreshes melted cheese.",
          },
          {
            wineId: "r1-w5",
            reason: "Sparkling bubbles cut richness and keep basil flavors bright.",
          },
        ],
      },
      {
        id: "r1-d2",
        name: "Cacio e Pepe",
        category: "Pasta",
        description: "Handmade tonnarelli with pecorino romano and black pepper.",
        price: 21,
        pairings: [
          {
            wineId: "r1-w3",
            reason: "Mineral white wine balances salty pecorino and pepper heat.",
          },
          {
            wineId: "r1-w8",
            reason: "Pinot Grigio keeps the dish airy and highlights pepper aroma.",
          },
        ],
      },
      {
        id: "r1-d3",
        name: "Tagliatelle al Ragu",
        category: "Pasta",
        description: "Slow-cooked beef and pork ragu with egg tagliatelle.",
        price: 25,
        pairings: [
          {
            wineId: "r1-w1",
            reason: "Structured tannins match ragu depth and savory meat notes.",
          },
          {
            wineId: "r1-w2",
            reason: "Chianti herbs and cherry pair naturally with tomato-based sauce.",
          },
        ],
      },
      {
        id: "r1-d4",
        name: "Osso Buco alla Milanese",
        category: "Main",
        description: "Braised veal shank, saffron jus, and gremolata.",
        price: 34,
        pairings: [
          {
            wineId: "r1-w7",
            reason: "Brunello structure stands up to gelatin-rich braised veal.",
          },
          {
            wineId: "r1-w1",
            reason: "Tignanello adds spice and depth to saffron and bone marrow.",
          },
        ],
      },
      {
        id: "r1-d5",
        name: "Risotto alla Milanese",
        category: "Rice",
        description: "Carnaroli rice with saffron, butter, and parmigiano.",
        price: 24,
        pairings: [
          {
            wineId: "r1-w4",
            reason: "Creamy Chardonnay texture echoes risotto body and saffron notes.",
          },
          {
            wineId: "r1-w5",
            reason: "Brut freshness cleans palate between buttery spoonfuls.",
          },
        ],
      },
      {
        id: "r1-d6",
        name: "Branzino al Forno",
        category: "Seafood",
        description: "Oven-roasted sea bass, lemon, capers, and herbs.",
        price: 31,
        pairings: [
          {
            wineId: "r1-w3",
            reason: "Citrus and minerality amplify delicate sea bass flavors.",
          },
          {
            wineId: "r1-w8",
            reason: "Light body keeps fish and herbs in focus.",
          },
        ],
      },
      {
        id: "r1-d7",
        name: "Vitello Tonnato",
        category: "Starter",
        description: "Cold sliced veal with creamy tuna-caper sauce.",
        price: 22,
        pairings: [
          {
            wineId: "r1-w3",
            reason: "High acidity sharpens the rich tuna emulsion.",
          },
          {
            wineId: "r1-w5",
            reason: "Fine mousse lightens the texture of chilled veal.",
          },
        ],
      },
      {
        id: "r1-d8",
        name: "Melanzane alla Parmigiana",
        category: "Vegetarian",
        description: "Layered eggplant, tomato sauce, mozzarella, and basil.",
        price: 20,
        pairings: [
          {
            wineId: "r1-w2",
            reason: "Acid-driven red supports tomato while keeping eggplant balanced.",
          },
          {
            wineId: "r1-w7",
            reason: "Earthy Brunello complements roasted eggplant depth.",
          },
        ],
      },
      {
        id: "r1-d9",
        name: "Burrata e Pomodori",
        category: "Starter",
        description: "Creamy burrata, heirloom tomatoes, basil, and aged balsamic.",
        price: 19,
        pairings: [
          {
            wineId: "r1-w8",
            reason: "Crisp pear and citrus cut through burrata creaminess.",
          },
          {
            wineId: "r1-w5",
            reason: "Bubbles and acidity refresh after each rich bite.",
          },
        ],
      },
      {
        id: "r1-d10",
        name: "Tiramisu",
        category: "Dessert",
        description: "Mascarpone cream, espresso-soaked savoiardi, and cocoa.",
        price: 14,
        pairings: [
          {
            wineId: "r1-w6",
            reason: "Sweet apricot and honey tones complement cocoa and coffee.",
          },
          {
            wineId: "r1-w5",
            reason: "A dry sparkling contrast keeps dessert from feeling heavy.",
          },
        ],
      },
    ],
  },
  {
    id: "r2",
    slug: "sakura-ember",
    name: "Sakura Ember",
    cuisine: "Asian",
    city: "Tokyo",
    description:
      "Modern Japanese kitchen with robata grill, pristine seafood, and precise pairings.",
    coverGradient: "from-[#1f3b5f] via-[#3f6d8f] to-[#9cc3d5]",
    wines: [
      {
        id: "r2-w1",
        name: "Cloudy Bay Sauvignon Blanc",
        region: "Marlborough, New Zealand",
        grape: "Sauvignon Blanc",
        style: "White",
        vintage: "2024",
        notes: "Grapefruit, lime leaf, and bright herbal lift.",
      },
      {
        id: "r2-w2",
        name: "Domaine William Fevre Chablis",
        region: "Burgundy, France",
        grape: "Chardonnay",
        style: "White",
        vintage: "2023",
        notes: "Taut citrus, oyster shell, and chalky texture.",
      },
      {
        id: "r2-w3",
        name: "Dr. Loosen Riesling Kabinett",
        region: "Mosel, Germany",
        grape: "Riesling",
        style: "White",
        vintage: "2023",
        notes: "Green apple, peach, and off-dry precision.",
      },
      {
        id: "r2-w4",
        name: "Ruinart Blanc de Blancs",
        region: "Champagne, France",
        grape: "Chardonnay",
        style: "Sparkling",
        vintage: "NV",
        notes: "Lemon curd, almond, and chalky bubbles.",
      },
      {
        id: "r2-w5",
        name: "Billecart-Salmon Brut Rose",
        region: "Champagne, France",
        grape: "Pinot Noir Blend",
        style: "Sparkling",
        vintage: "NV",
        notes: "Wild strawberry, citrus peel, and elegant mousse.",
      },
      {
        id: "r2-w6",
        name: "Meiomi Pinot Noir",
        region: "California, USA",
        grape: "Pinot Noir",
        style: "Red",
        vintage: "2022",
        notes: "Ripe berry, mocha, and silky tannins.",
      },
      {
        id: "r2-w7",
        name: "Ridge Geyserville",
        region: "Sonoma, USA",
        grape: "Zinfandel Blend",
        style: "Red",
        vintage: "2022",
        notes: "Blackberry, pepper, and savory spice.",
      },
      {
        id: "r2-w8",
        name: "Gerard Bertrand Cote des Roses Rose",
        region: "Languedoc, France",
        grape: "Grenache Blend",
        style: "Rose",
        vintage: "2023",
        notes: "Red berries, melon, and dry floral finish.",
      },
    ],
    dishes: [
      {
        id: "r2-d1",
        name: "Hamachi Crudo",
        category: "Starter",
        description: "Yellowtail, yuzu kosho, shiso, and citrus soy.",
        price: 24,
        pairings: [
          {
            wineId: "r2-w1",
            reason: "Zesty citrus profile mirrors yuzu and lifts raw fish sweetness.",
          },
          {
            wineId: "r2-w4",
            reason: "Fine bubbles cleanse palate after rich hamachi texture.",
          },
        ],
      },
      {
        id: "r2-d2",
        name: "Omakase Nigiri Set",
        category: "Sushi",
        description: "Chef selection of seasonal nigiri, wasabi, and nikiri glaze.",
        price: 46,
        pairings: [
          {
            wineId: "r2-w2",
            reason: "Chablis minerality mirrors the oceanic purity of nigiri.",
          },
          {
            wineId: "r2-w4",
            reason: "Champagne acidity resets the palate between different fish cuts.",
          },
        ],
      },
      {
        id: "r2-d3",
        name: "Sashimi Moriawase",
        category: "Sushi",
        description: "Bluefin tuna, salmon, scallop, and madai sashimi.",
        price: 39,
        pairings: [
          {
            wineId: "r2-w2",
            reason: "Lean mineral structure supports delicate sashimi without masking it.",
          },
          {
            wineId: "r2-w3",
            reason: "Slight sweetness softens soy salt and enhances umami.",
          },
        ],
      },
      {
        id: "r2-d4",
        name: "Yakitori Thigh",
        category: "Grill",
        description: "Binchotan grilled chicken thigh with tare and sansho.",
        price: 19,
        pairings: [
          {
            wineId: "r2-w6",
            reason: "Silky Pinot fruit balances smoky grill char and sweet tare.",
          },
          {
            wineId: "r2-w7",
            reason: "Peppery red blend handles caramelized glaze intensity.",
          },
        ],
      },
      {
        id: "r2-d5",
        name: "Miso Black Cod",
        category: "Main",
        description: "Saikyo miso marinated cod, pickled daikon, and ginger.",
        price: 38,
        pairings: [
          {
            wineId: "r2-w3",
            reason: "Off-dry Riesling balances sweet-salty miso glaze.",
          },
          {
            wineId: "r2-w1",
            reason: "Herbal citrus notes brighten rich buttery cod.",
          },
        ],
      },
      {
        id: "r2-d6",
        name: "Tempura Moriawase",
        category: "Fried",
        description: "Shrimp and seasonal vegetables in light tempura batter.",
        price: 27,
        pairings: [
          {
            wineId: "r2-w4",
            reason: "Lively mousse cuts fried texture and keeps flavors clean.",
          },
          {
            wineId: "r2-w5",
            reason: "Rose Champagne adds freshness and subtle berry lift.",
          },
        ],
      },
      {
        id: "r2-d7",
        name: "Unagi Don",
        category: "Rice",
        description: "Charcoal grilled eel over rice with tare and sansho.",
        price: 33,
        pairings: [
          {
            wineId: "r2-w3",
            reason: "Residual sugar balances sweet soy glaze and eel fat.",
          },
          {
            wineId: "r2-w6",
            reason: "Soft red fruit complements smoky caramelized eel.",
          },
        ],
      },
      {
        id: "r2-d8",
        name: "Wagyu Tataki",
        category: "Main",
        description: "Seared wagyu, ponzu, daikon, and garlic chips.",
        price: 44,
        pairings: [
          {
            wineId: "r2-w7",
            reason: "Concentrated fruit and spice stand up to wagyu richness.",
          },
          {
            wineId: "r2-w6",
            reason: "Pinot texture supports beef fat without overwhelming ponzu.",
          },
        ],
      },
      {
        id: "r2-d9",
        name: "Shoyu Ramen",
        category: "Noodles",
        description: "Chicken broth ramen with chashu, ajitama, and nori.",
        price: 23,
        pairings: [
          {
            wineId: "r2-w1",
            reason: "Acidic lift cuts broth richness and highlights aromatics.",
          },
          {
            wineId: "r2-w3",
            reason: "Riesling softness complements salty soy depth.",
          },
        ],
      },
      {
        id: "r2-d10",
        name: "Matcha Basque Cheesecake",
        category: "Dessert",
        description: "Burnt cheesecake with ceremonial matcha cream.",
        price: 15,
        pairings: [
          {
            wineId: "r2-w5",
            reason: "Red berry mousse offsets the earthy matcha edge.",
          },
          {
            wineId: "r2-w3",
            reason: "Delicate sweetness smooths the cheesecake bitterness.",
          },
        ],
      },
    ],
  },
  {
    id: "r3",
    slug: "brasa-iberica",
    name: "Brasa Iberica",
    cuisine: "European Mix",
    city: "Madrid",
    description:
      "Spanish tapas and grill house focused on coastal seafood and cast-iron fire.",
    coverGradient: "from-[#5f2f23] via-[#a04d2b] to-[#e1a65b]",
    wines: [
      {
        id: "r3-w1",
        name: "La Rioja Alta Vina Ardanza Reserva",
        region: "Rioja, Spain",
        grape: "Tempranillo Blend",
        style: "Red",
        vintage: "2019",
        notes: "Red fruit, vanilla, and dried herbs.",
      },
      {
        id: "r3-w2",
        name: "Marques de Murrieta Reserva",
        region: "Rioja, Spain",
        grape: "Tempranillo Blend",
        style: "Red",
        vintage: "2020",
        notes: "Plum, cedar, tobacco, and polished tannins.",
      },
      {
        id: "r3-w3",
        name: "Vega Sicilia Valbuena 5",
        region: "Ribera del Duero, Spain",
        grape: "Tempranillo Blend",
        style: "Red",
        vintage: "2018",
        notes: "Dark berries, graphite, and long savory finish.",
      },
      {
        id: "r3-w4",
        name: "Martin Codax Albarino",
        region: "Rias Baixas, Spain",
        grape: "Albarino",
        style: "White",
        vintage: "2024",
        notes: "Lime, peach, saline freshness, and floral notes.",
      },
      {
        id: "r3-w5",
        name: "Bodegas Muga Blanco",
        region: "Rioja, Spain",
        grape: "Viura Blend",
        style: "White",
        vintage: "2023",
        notes: "Citrus, stone fruit, subtle oak, and crisp finish.",
      },
      {
        id: "r3-w6",
        name: "Gramona Imperial Brut",
        region: "Penedes, Spain",
        grape: "Cava Blend",
        style: "Sparkling",
        vintage: "2019",
        notes: "Baked apple, brioche, and persistent bubbles.",
      },
      {
        id: "r3-w7",
        name: "Torres Celeste Crianza",
        region: "Ribera del Duero, Spain",
        grape: "Tempranillo",
        style: "Red",
        vintage: "2021",
        notes: "Black cherry, cacao, and gentle oak spice.",
      },
      {
        id: "r3-w8",
        name: "Lopez de Heredia Vina Tondonia Blanco Reserva",
        region: "Rioja, Spain",
        grape: "Viura Blend",
        style: "White",
        vintage: "2012",
        notes: "Nuts, dried citrus, and layered oxidative complexity.",
      },
    ],
    dishes: [
      {
        id: "r3-d1",
        name: "Patatas Bravas",
        category: "Tapas",
        description: "Crisp potatoes, smoked paprika brava sauce, and aioli.",
        price: 12,
        pairings: [
          {
            wineId: "r3-w6",
            reason: "Cava bubbles clean up aioli richness and spice oil.",
          },
          {
            wineId: "r3-w4",
            reason: "Citrus-driven Albarino cools paprika heat.",
          },
        ],
      },
      {
        id: "r3-d2",
        name: "Gambas al Ajillo",
        category: "Tapas",
        description: "Shrimp sauteed in olive oil, garlic, and dried chili.",
        price: 18,
        pairings: [
          {
            wineId: "r3-w4",
            reason: "Saline white enhances sweet shrimp and garlic oil.",
          },
          {
            wineId: "r3-w8",
            reason: "Layered white handles intensity of garlic and chili.",
          },
        ],
      },
      {
        id: "r3-d3",
        name: "Tortilla Espanola",
        category: "Tapas",
        description: "Potato and onion omelet with olive oil confit texture.",
        price: 14,
        pairings: [
          {
            wineId: "r3-w5",
            reason: "Medium-bodied white complements egg richness.",
          },
          {
            wineId: "r3-w6",
            reason: "Sparkling acidity keeps each bite light.",
          },
        ],
      },
      {
        id: "r3-d4",
        name: "Pulpo a la Gallega",
        category: "Seafood",
        description: "Tender octopus, smoked paprika, potato, and olive oil.",
        price: 23,
        pairings: [
          {
            wineId: "r3-w4",
            reason: "Albarino minerality complements octopus sweetness.",
          },
          {
            wineId: "r3-w5",
            reason: "Subtle oak adds body for paprika and oil.",
          },
        ],
      },
      {
        id: "r3-d5",
        name: "Paella Valenciana",
        category: "Rice",
        description: "Saffron rice with chicken, rabbit, and green beans.",
        price: 32,
        pairings: [
          {
            wineId: "r3-w2",
            reason: "Rioja fruit and spice match saffron and roasted meat notes.",
          },
          {
            wineId: "r3-w4",
            reason: "Bright acidity keeps the rice dish lively.",
          },
        ],
      },
      {
        id: "r3-d6",
        name: "Bacalao al Pil Pil",
        category: "Seafood",
        description: "Salt cod with emulsified garlic and olive oil sauce.",
        price: 29,
        pairings: [
          {
            wineId: "r3-w8",
            reason: "Complex aged white supports garlic-driven richness.",
          },
          {
            wineId: "r3-w4",
            reason: "Fresh saline profile balances cod salinity.",
          },
        ],
      },
      {
        id: "r3-d7",
        name: "Cochinillo Asado",
        category: "Main",
        description: "Slow-roasted suckling pig with crackling skin.",
        price: 36,
        pairings: [
          {
            wineId: "r3-w3",
            reason: "Concentrated red with structure matches crispy pork richness.",
          },
          {
            wineId: "r3-w1",
            reason: "Reserva acidity cuts through rendered fat.",
          },
        ],
      },
      {
        id: "r3-d8",
        name: "Croquetas de Jamon",
        category: "Tapas",
        description: "Creamy Iberico ham croquettes with crisp crust.",
        price: 15,
        pairings: [
          {
            wineId: "r3-w6",
            reason: "Sparkling texture clears bechamel richness.",
          },
          {
            wineId: "r3-w5",
            reason: "White fruit notes offset savory ham intensity.",
          },
        ],
      },
      {
        id: "r3-d9",
        name: "Chuleton a la Brasa",
        category: "Grill",
        description: "Dry-aged rib steak cooked over oak embers.",
        price: 54,
        pairings: [
          {
            wineId: "r3-w3",
            reason: "Dense tannic frame is ideal for charred beef.",
          },
          {
            wineId: "r3-w7",
            reason: "Ripe fruit and spice echo grilled crust flavors.",
          },
        ],
      },
      {
        id: "r3-d10",
        name: "Basque Cheesecake",
        category: "Dessert",
        description: "Burnt-top cheesecake with creamy center.",
        price: 13,
        pairings: [
          {
            wineId: "r3-w6",
            reason: "Brut bubbles refresh palate after rich creamy texture.",
          },
          {
            wineId: "r3-w4",
            reason: "Fresh fruit notes brighten caramelized top.",
          },
        ],
      },
    ],
  },
  {
    id: "r4",
    slug: "bistro-maree",
    name: "Bistro Maree",
    cuisine: "French",
    city: "Lyon",
    description:
      "French bistro classics with seafood focus and cellar-style old world labels.",
    coverGradient: "from-[#2d3b52] via-[#58789a] to-[#c2d4e8]",
    wines: [
      {
        id: "r4-w1",
        name: "Domaine Vacheron Sancerre Blanc",
        region: "Loire, France",
        grape: "Sauvignon Blanc",
        style: "White",
        vintage: "2023",
        notes: "Lemon zest, gooseberry, and flinty minerality.",
      },
      {
        id: "r4-w2",
        name: "Domaine William Fevre Chablis Premier Cru",
        region: "Burgundy, France",
        grape: "Chardonnay",
        style: "White",
        vintage: "2022",
        notes: "Crisp citrus, oyster shell, and linear acidity.",
      },
      {
        id: "r4-w3",
        name: "Louis Jadot Beaune Premier Cru",
        region: "Burgundy, France",
        grape: "Pinot Noir",
        style: "Red",
        vintage: "2021",
        notes: "Red cherry, forest floor, and gentle spice.",
      },
      {
        id: "r4-w4",
        name: "Chateau de Beaucastel Chateauneuf-du-Pape",
        region: "Rhone, France",
        grape: "Grenache Blend",
        style: "Red",
        vintage: "2020",
        notes: "Black fruit, garrigue herbs, and structured finish.",
      },
      {
        id: "r4-w5",
        name: "Whispering Angel Rose",
        region: "Provence, France",
        grape: "Grenache Blend",
        style: "Rose",
        vintage: "2024",
        notes: "Strawberry, peach, and dry mineral finish.",
      },
      {
        id: "r4-w6",
        name: "Bollinger Special Cuvee",
        region: "Champagne, France",
        grape: "Pinot Noir Blend",
        style: "Sparkling",
        vintage: "NV",
        notes: "Apple, brioche, toasted nuts, and long mousse.",
      },
      {
        id: "r4-w7",
        name: "Chateau Smith Haut Lafitte Blanc",
        region: "Bordeaux, France",
        grape: "Sauvignon Blanc Blend",
        style: "White",
        vintage: "2021",
        notes: "Citrus, white peach, and subtle oak smoke.",
      },
      {
        id: "r4-w8",
        name: "Chateau La Dominique Saint-Emilion Grand Cru",
        region: "Bordeaux, France",
        grape: "Merlot Blend",
        style: "Red",
        vintage: "2020",
        notes: "Plum, cocoa, and velvety tannins.",
      },
    ],
    dishes: [
      {
        id: "r4-d1",
        name: "French Onion Soup",
        category: "Starter",
        description: "Caramelized onion broth, crouton, and gruyere gratin.",
        price: 16,
        pairings: [
          {
            wineId: "r4-w3",
            reason: "Pinot earthiness mirrors caramelized onion depth.",
          },
          {
            wineId: "r4-w6",
            reason: "Sparkling acidity cuts melted cheese richness.",
          },
        ],
      },
      {
        id: "r4-d2",
        name: "Steak Frites",
        category: "Main",
        description: "Striploin, pommes frites, and cafe de paris butter.",
        price: 39,
        pairings: [
          {
            wineId: "r4-w8",
            reason: "Merlot blend tannins handle beef and butter intensity.",
          },
          {
            wineId: "r4-w4",
            reason: "Rhone spice amplifies seared crust and pepper.",
          },
        ],
      },
      {
        id: "r4-d3",
        name: "Duck Confit",
        category: "Main",
        description: "Slow-cooked duck leg, lentils, and mustard jus.",
        price: 34,
        pairings: [
          {
            wineId: "r4-w4",
            reason: "Savory Rhone profile matches crispy duck skin.",
          },
          {
            wineId: "r4-w3",
            reason: "Pinot brightness lifts the rich confit fat.",
          },
        ],
      },
      {
        id: "r4-d4",
        name: "Bouillabaisse",
        category: "Seafood",
        description: "Marseille fish stew with saffron rouille.",
        price: 37,
        pairings: [
          {
            wineId: "r4-w2",
            reason: "Mineral Chablis supports shellfish and saffron broth.",
          },
          {
            wineId: "r4-w7",
            reason: "Layered white has enough body for rich rouille.",
          },
        ],
      },
      {
        id: "r4-d5",
        name: "Ratatouille Tart",
        category: "Vegetarian",
        description: "Tomato tart with confit zucchini and eggplant.",
        price: 22,
        pairings: [
          {
            wineId: "r4-w5",
            reason: "Dry rose complements roasted vegetables and herbs.",
          },
          {
            wineId: "r4-w1",
            reason: "Crisp Loire white lifts tomato sweetness.",
          },
        ],
      },
      {
        id: "r4-d6",
        name: "Coq au Vin",
        category: "Main",
        description: "Red wine braised chicken, mushrooms, and pearl onions.",
        price: 31,
        pairings: [
          {
            wineId: "r4-w8",
            reason: "Soft tannins and plum fruit align with braising sauce.",
          },
          {
            wineId: "r4-w4",
            reason: "Rhone herbs deepen mushroom and onion notes.",
          },
        ],
      },
      {
        id: "r4-d7",
        name: "Sole Meuniere",
        category: "Seafood",
        description: "Pan-seared sole, browned butter, lemon, and parsley.",
        price: 36,
        pairings: [
          {
            wineId: "r4-w2",
            reason: "Precise acidity balances beurre noisette richness.",
          },
          {
            wineId: "r4-w1",
            reason: "Citrus and minerality keep fish flavors focused.",
          },
        ],
      },
      {
        id: "r4-d8",
        name: "Nicoise Salad",
        category: "Salad",
        description: "Tuna, egg, olives, green beans, and anchovy dressing.",
        price: 24,
        pairings: [
          {
            wineId: "r4-w1",
            reason: "Sancerre acidity handles salty anchovy and tuna.",
          },
          {
            wineId: "r4-w5",
            reason: "Rose offers fruit contrast for briny olives.",
          },
        ],
      },
      {
        id: "r4-d9",
        name: "Truffle Brie Ravioli",
        category: "Pasta",
        description: "Fresh ravioli, truffle cream, and aged comte.",
        price: 29,
        pairings: [
          {
            wineId: "r4-w7",
            reason: "Oak-kissed white matches truffle and creamy cheese.",
          },
          {
            wineId: "r4-w6",
            reason: "Champagne bubbles reduce richness and reset palate.",
          },
        ],
      },
      {
        id: "r4-d10",
        name: "Creme Brulee",
        category: "Dessert",
        description: "Vanilla custard with caramelized sugar crust.",
        price: 13,
        pairings: [
          {
            wineId: "r4-w6",
            reason: "Toasty notes mirror caramelized top while staying fresh.",
          },
          {
            wineId: "r4-w5",
            reason: "Dry rose adds berry lift without oversweetening dessert.",
          },
        ],
      },
    ],
  },
  {
    id: "r5",
    slug: "andes-fuego",
    name: "Andes Fuego",
    cuisine: "Asian-Latin Mix",
    city: "Lima",
    description:
      "Peruvian and Nikkei signatures with bright citrus, chili, and charcoal notes.",
    coverGradient: "from-[#38472f] via-[#6a8b53] to-[#d7c88f]",
    wines: [
      {
        id: "r5-w1",
        name: "Catena Zapata Malbec Argentino",
        region: "Mendoza, Argentina",
        grape: "Malbec",
        style: "Red",
        vintage: "2021",
        notes: "Black plum, violet, and smooth dense finish.",
      },
      {
        id: "r5-w2",
        name: "Montes Alpha Cabernet Sauvignon",
        region: "Colchagua, Chile",
        grape: "Cabernet Sauvignon",
        style: "Red",
        vintage: "2021",
        notes: "Cassis, cedar, and firm tannin backbone.",
      },
      {
        id: "r5-w3",
        name: "Marques de Casa Concha Chardonnay",
        region: "Limari, Chile",
        grape: "Chardonnay",
        style: "White",
        vintage: "2023",
        notes: "Citrus curd, stone fruit, and creamy texture.",
      },
      {
        id: "r5-w4",
        name: "Lapostolle Cuvee Alexandre Carmenere",
        region: "Apalta, Chile",
        grape: "Carmenere",
        style: "Red",
        vintage: "2021",
        notes: "Blackberries, pepper, and smoky herbal finish.",
      },
      {
        id: "r5-w5",
        name: "Garzon Reserva Albarino",
        region: "Maldonado, Uruguay",
        grape: "Albarino",
        style: "White",
        vintage: "2024",
        notes: "Lime zest, white peach, and saline edge.",
      },
      {
        id: "r5-w6",
        name: "Santa Rita Casa Real Cabernet Sauvignon",
        region: "Maipo, Chile",
        grape: "Cabernet Sauvignon",
        style: "Red",
        vintage: "2020",
        notes: "Dark fruit, graphite, and polished oak.",
      },
      {
        id: "r5-w7",
        name: "Zuccardi Q Torrontes",
        region: "Salta, Argentina",
        grape: "Torrontes",
        style: "White",
        vintage: "2024",
        notes: "Jasmine, grapefruit, and aromatic lift.",
      },
      {
        id: "r5-w8",
        name: "Vina Cobos Bramare Malbec",
        region: "Mendoza, Argentina",
        grape: "Malbec",
        style: "Red",
        vintage: "2021",
        notes: "Black cherry, cocoa, and structured mouthfeel.",
      },
    ],
    dishes: [
      {
        id: "r5-d1",
        name: "Ceviche Clasico",
        category: "Cold",
        description: "Fresh white fish, leche de tigre, red onion, and cancha.",
        price: 22,
        pairings: [
          {
            wineId: "r5-w5",
            reason: "Zesty acidity mirrors lime and keeps fish ultra fresh.",
          },
          {
            wineId: "r5-w7",
            reason: "Aromatic white softens chili heat and citrus bite.",
          },
        ],
      },
      {
        id: "r5-d2",
        name: "Tiradito Nikkei",
        category: "Cold",
        description: "Sliced tuna with ponzu, aji amarillo, and sesame.",
        price: 24,
        pairings: [
          {
            wineId: "r5-w3",
            reason: "Textured Chardonnay supports tuna and sesame richness.",
          },
          {
            wineId: "r5-w5",
            reason: "Albarino brightness sharpens ponzu citrus profile.",
          },
        ],
      },
      {
        id: "r5-d3",
        name: "Lomo Saltado",
        category: "Main",
        description: "Stir-fried beef, tomato, onion, soy, and fries.",
        price: 29,
        pairings: [
          {
            wineId: "r5-w1",
            reason: "Malbec fruit and body hold up to soy-seared beef.",
          },
          {
            wineId: "r5-w4",
            reason: "Carmenere spice aligns with wok-charred aromatics.",
          },
        ],
      },
      {
        id: "r5-d4",
        name: "Aji de Gallina",
        category: "Main",
        description: "Creamy chicken stew with aji amarillo and walnuts.",
        price: 25,
        pairings: [
          {
            wineId: "r5-w3",
            reason: "Creamy Chardonnay texture matches sauce body.",
          },
          {
            wineId: "r5-w7",
            reason: "Floral aromatics cool yellow chili warmth.",
          },
        ],
      },
      {
        id: "r5-d5",
        name: "Causa Limena",
        category: "Starter",
        description: "Layered potato terrine with crab, avocado, and lime.",
        price: 19,
        pairings: [
          {
            wineId: "r5-w5",
            reason: "Fresh saline profile complements crab sweetness.",
          },
          {
            wineId: "r5-w3",
            reason: "Rounded white texture suits creamy avocado.",
          },
        ],
      },
      {
        id: "r5-d6",
        name: "Anticuchos de Corazon",
        category: "Grill",
        description: "Beef heart skewers with aji panca glaze.",
        price: 21,
        pairings: [
          {
            wineId: "r5-w2",
            reason: "Cabernet tannins match grilled protein and char.",
          },
          {
            wineId: "r5-w8",
            reason: "Bold Malbec fruit balances smoky chili spice.",
          },
        ],
      },
      {
        id: "r5-d7",
        name: "Arroz con Mariscos",
        category: "Rice",
        description: "Seafood rice with saffron, peas, and rocoto.",
        price: 30,
        pairings: [
          {
            wineId: "r5-w5",
            reason: "Crisp acidity keeps shellfish and spice in balance.",
          },
          {
            wineId: "r5-w3",
            reason: "Fruit-forward Chardonnay complements saffron rice.",
          },
        ],
      },
      {
        id: "r5-d8",
        name: "Seco de Cordero",
        category: "Main",
        description: "Braised lamb with cilantro, beer, and beans.",
        price: 33,
        pairings: [
          {
            wineId: "r5-w8",
            reason: "Concentrated Malbec handles lamb and herbal braise.",
          },
          {
            wineId: "r5-w1",
            reason: "Classic Malbec plushness fits tender slow-cooked meat.",
          },
        ],
      },
      {
        id: "r5-d9",
        name: "Tacu Tacu",
        category: "Main",
        description: "Crisp rice-bean cake with fried egg and salsa criolla.",
        price: 23,
        pairings: [
          {
            wineId: "r5-w4",
            reason: "Spicy red profile matches crispy savory bean cake.",
          },
          {
            wineId: "r5-w1",
            reason: "Soft tannins and dark fruit complement egg yolk richness.",
          },
        ],
      },
      {
        id: "r5-d10",
        name: "Picarones",
        category: "Dessert",
        description: "Pumpkin-sweet potato fritters with chancaca syrup.",
        price: 12,
        pairings: [
          {
            wineId: "r5-w7",
            reason: "Floral aromatics add lift to caramelized syrup.",
          },
          {
            wineId: "r5-w5",
            reason: "Dry acidity balances sweet fried dough texture.",
          },
        ],
      },
    ],
  },
];
