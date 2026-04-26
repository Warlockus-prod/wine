import type { PairingDataset } from "@/types/pairing";

export const seedPairingDataset: PairingDataset = {
  dishes: [
    {
      id: "escargots",
      name: {
        en: "Escargots de Bourgogne",
        pl: "Ślimaki burgundzkie",
      },
      price: 18,
      description: {
        en: "Burgundy snails with garlic herb butter, parsley and toasted baguette points.",
        pl: "Ślimaki burgundzkie w maśle czosnkowo-ziołowym z natką pietruszki i grzankami z bagietki.",
      },
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBhlI46dafXSZ08utjSWbYOYBXZcyqovonosZ2MUis2T4FrSvjy7_Er5VMFJGAyjeWp6cx4bAhd_fI7SJMDIIwahIUPZlC02XtIhiDwCHmPSxPugT4iWUD67WMW99bbqs2xkNY5bYvdOaPa6jOirgJHjo9wV0NTJewH4our6G4GtxHwO9VnE0K3h93WLpEAD80eTfNnFdE31B3kcA4ndUFvOistF3Se_VuL9iOVmF5AN-mDj830CgfHP0aDivk8iqNlJQeBWp8M6L0",
      tags: ["Starter", "Classic", "Garlic"],
    },
    {
      id: "duck-confit",
      name: { en: "Duck Confit", pl: "Konfitowana kaczka" },
      price: 34,
      description: {
        en: "Slow-cooked duck leg with crispy skin, sarladaise potatoes and thyme jus.",
        pl: "Wolno pieczona noga kaczki z chrupiącą skórką, ziemniakami sarladaise i sosem tymiankowym.",
      },
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCPhT2eBSA_1VVLpnQm9-cravzJ5Gc6FyawGxH5Takx28R2xtCFpag0eczWbZHEqE3gyaMGP0cvt9nLzATLU6A-7LS1erp38xnUTU91m3FZDe-dnxX88rni9PsT8essOHKPlgzsFX52buk-L2YJNIFb8moz3A5MaFooxURC6ri2hJ1J6sH5vfOLDCW3aU_dz9FOz9D9602DKJ_AY9GA3Z1eoG8bqbSgyRnKXiyjYHZzuIfZUVUIkLabvoLkmxtJ_IzNH_obOFeSUSQ",
      tags: ["Main", "Rich", "Savory"],
    },
    {
      id: "beef-tartare",
      name: { en: "Beef Tartare", pl: "Tatar wołowy" },
      price: 22,
      description: {
        en: "Hand-cut beef fillet, capers, shallots, egg yolk and house spice blend.",
        pl: "Ręcznie krojona polędwica wołowa, kapary, szalotka, żółtko jajka i firmowa mieszanka przypraw.",
      },
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBE3Sa94YOEcabLhKzWAZ1hVizzQofzK2Z4E5bDpnb40C_Y7kjftpAIvfPRUvuRTv9i2R4yl2Jyas9yYjBSdg-TB95Y5sHjwlgXp0C5qu1WuvXdmBwrewbREclI2Qm3t1GSI7I2tRy0h0-uJWU7AE8RcD4OIZSj_MCLqex08-Yw5sMlLAY610w_NvRLCYyHK30eYl_t2qEEz-6QioSMB_5z-9TrP1ivcg5AOiYglAF-KcAtKAuyc_s8SkJBIcMDsOL9hhwBpVrU47c",
      tags: ["Starter", "Raw", "Peppery"],
    },
    {
      id: "scallops",
      name: { en: "Seared Scallops", pl: "Smażone przegrzebki" },
      price: 28,
      description: {
        en: "Jumbo scallops, cauliflower puree, truffle oil and micro greens.",
        pl: "Duże przegrzebki, puree z kalafiora, oliwa truflowa i mikrolistki.",
      },
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAaiwxSmTLYTg2ZH3EFQxN-shWqR6ZLwQpI0z5SMPyJTaXY2mMiVVpwoVF-pqkdZU3upPy3La9j4mQfCanZGieFBcp6xyeSrSY82SN97CSDaaShFsNj7aA9cHnJxWOdNjYl13uEmlgRGlUWJTDIeFbl6lwNJQP547qRRdN-Zk43iFIZUevpZz0PNN2dQKNOgJxv0hPw1NuOXYzxB8zVyfrewxB1XetEi7on87zLHr9jOrkiMkRF0WT6CPcSqn2iO4DTpH263EN9O6A",
      tags: ["Main", "Seafood", "Delicate"],
    },
  ],
  wines: [
    {
      id: "riesling",
      name: { en: "Trimbach Riesling", pl: "Trimbach Riesling" },
      region: "Alsace, France",
      year: 2020,
      price: 76,
      rating: 4.8,
      description: {
        en: "Bone-dry profile with mineral finish and focused citrus backbone.",
        pl: "Wytrawny profil z mineralnym zakończeniem i wyraźną cytrusową strukturą.",
      },
      image:
        "https://upload.wikimedia.org/wikipedia/commons/9/91/2009_Trimbach_Riesling_%288130797570%29.jpg",
      tags: ["Dry", "High Acid"],
      passport: {
        grape: "Riesling",
        abv: 13,
        body: "light",
        acidity: "high",
        tannin: "none",
        servingTempC: "8-10",
        decant: "No decant. Open 10 minutes before service.",
      },
    },
    {
      id: "pinot",
      name: {
        en: "Domaine William Fevre Chablis Premier Cru",
        pl: "Domaine William Fevre Chablis Premier Cru",
      },
      region: "Chablis, France",
      year: 2022,
      price: 92,
      rating: 4.4,
      description: {
        en: "Citrus, oyster-shell minerality, and a taut, saline finish.",
        pl: "Cytrusy, mineralność muszli ostrygi i napięte, słone zakończenie.",
      },
      image:
        "https://upload.wikimedia.org/wikipedia/commons/6/6e/Chablis_bottle_and_wine.jpg",
      tags: ["Mineral", "High Acid"],
      passport: {
        grape: "Chardonnay",
        abv: 12.5,
        body: "light",
        acidity: "high",
        tannin: "none",
        servingTempC: "9-11",
        decant: "No decant. Open just before service.",
      },
    },
    {
      id: "cabernet",
      name: { en: "Penfolds Grange", pl: "Penfolds Grange" },
      region: "South Australia",
      year: 2018,
      price: 650,
      rating: 4.5,
      description: {
        en: "Dense dark fruit, spice, and powerful structure for rich dishes.",
        pl: "Gęste, ciemne owoce, korzenne nuty i mocna struktura — pod treściwe dania.",
      },
      image:
        "https://upload.wikimedia.org/wikipedia/commons/2/21/PenfoldsGrange.jpg",
      tags: ["Bold", "Tannic"],
      passport: {
        grape: "Shiraz Blend",
        abv: 14.5,
        body: "full",
        acidity: "medium",
        tannin: "high",
        servingTempC: "16-18",
        decant: "Decant 60 minutes before service.",
      },
    },
    {
      id: "rose",
      name: {
        en: "Castello Banfi Chianti Classico",
        pl: "Castello Banfi Chianti Classico",
      },
      region: "Tuscany, Italy",
      year: 2021,
      price: 58,
      rating: 4.2,
      description: {
        en: "Sour cherry, dried herbs, and vibrant acidity.",
        pl: "Kwaśna wiśnia, suszone zioła i żywa kwasowość.",
      },
      image:
        "https://upload.wikimedia.org/wikipedia/commons/3/39/Banfi_Chianti_Classico_2005.jpg",
      tags: ["Red Fruit", "Savory"],
      passport: {
        grape: "Sangiovese",
        abv: 13.5,
        body: "medium",
        acidity: "high",
        tannin: "medium",
        servingTempC: "15-17",
        decant: "Optional 20-minute decant.",
      },
    },
    {
      id: "champagne",
      name: {
        en: "Veuve Clicquot Yellow Label Brut",
        pl: "Veuve Clicquot Yellow Label Brut",
      },
      region: "Champagne, France",
      year: 2022,
      price: 98,
      rating: 4.6,
      description: {
        en: "Fine mousse, apple and brioche notes, with crisp finish.",
        pl: "Drobny mus, nuty jabłka i brioszki, świeże wykończenie.",
      },
      image:
        "https://upload.wikimedia.org/wikipedia/commons/5/58/Veuve_Clicquot_-_bottle.jpg",
      tags: ["Sparkling", "Mineral"],
      passport: {
        grape: "Pinot Noir, Chardonnay, Meunier",
        abv: 12.5,
        body: "medium",
        acidity: "high",
        tannin: "none",
        servingTempC: "7-9",
        decant: "No decant. Serve chilled in white-wine stem.",
      },
    },
  ],
  pairings: [
    {
      dishId: "escargots",
      wineId: "riesling",
      reason: {
        en: "Crisp Alsace Riesling cuts through garlic herb butter with citrus drive and saline minerality.",
        pl: "Wytrawny Riesling z Alzacji przebija masło czosnkowo-ziołowe cytrusowym nerwem i słoną mineralnością.",
      },
    },
    {
      dishId: "escargots",
      wineId: "champagne",
      reason: {
        en: "Champagne's bubbles and acidity refresh the palate after every buttery, garlic-loaded bite.",
        pl: "Bąbelki i kwasowość Champagne odświeżają podniebienie po każdym maślano-czosnkowym kęsie.",
      },
    },
    {
      dishId: "duck-confit",
      wineId: "pinot",
      reason: {
        en: "Pinot Noir's red-fruit core and gentle tannin echo crisp duck skin without overpowering it.",
        pl: "Czerwono-owocowy rdzeń i miękkie taniny Pinot Noir odpowiadają chrupiącej skórce kaczki, nie dominując dania.",
      },
    },
    {
      dishId: "duck-confit",
      wineId: "riesling",
      reason: {
        en: "Off-dry Riesling pulls the fat away from rich confit while complementing the thyme jus.",
        pl: "Półwytrawny Riesling rozcina tłustość konfitowanej kaczki, podkreślając nuty tymiankowego sosu.",
      },
    },
    {
      dishId: "beef-tartare",
      wineId: "cabernet",
      reason: {
        en: "Tannin from Cabernet binds with the raw protein, keeping the spice and pepper notes in check.",
        pl: "Taniny Cabernet wiążą się z surowym białkiem, utrzymując pikantne i pieprzne nuty w ryzach.",
      },
    },
    {
      dishId: "beef-tartare",
      wineId: "pinot",
      reason: {
        en: "Lighter Pinot Noir is the classic foil for tartare — it lifts shallots and capers without crushing them.",
        pl: "Lżejsze Pinot Noir to klasyczny partner tatara — wydobywa szalotkę i kapary, nie miażdżąc ich.",
      },
    },
    {
      dishId: "scallops",
      wineId: "champagne",
      reason: {
        en: "Blanc de blancs Champagne mirrors scallop sweetness and slices cauliflower puree's richness.",
        pl: "Blanc de blancs Champagne podkreśla słodycz przegrzebków i przecina bogactwo puree z kalafiora.",
      },
    },
    {
      dishId: "scallops",
      wineId: "rose",
      reason: {
        en: "Provence rose's strawberry and citrus lift the truffle oil while staying delicate enough for scallops.",
        pl: "Truskawka i cytrus prowansalskiego rosé podnoszą oliwę truflową, zachowując delikatność dla przegrzebków.",
      },
    },
  ],
};
