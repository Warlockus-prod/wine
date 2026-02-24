import type { PairingDataset } from "@/types/pairing";

export const seedPairingDataset: PairingDataset = {
  dishes: [
    {
      id: "escargots",
      name: "Escargots de Bourgogne",
      price: 18,
      description:
        "Burgundy snails with garlic herb butter, parsley and toasted baguette points.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBhlI46dafXSZ08utjSWbYOYBXZcyqovonosZ2MUis2T4FrSvjy7_Er5VMFJGAyjeWp6cx4bAhd_fI7SJMDIIwahIUPZlC02XtIhiDwCHmPSxPugT4iWUD67WMW99bbqs2xkNY5bYvdOaPa6jOirgJHjo9wV0NTJewH4our6G4GtxHwO9VnE0K3h93WLpEAD80eTfNnFdE31B3kcA4ndUFvOistF3Se_VuL9iOVmF5AN-mDj830CgfHP0aDivk8iqNlJQeBWp8M6L0",
      tags: ["Starter", "Classic", "Garlic"],
    },
    {
      id: "duck-confit",
      name: "Duck Confit",
      price: 34,
      description:
        "Slow-cooked duck leg with crispy skin, sarladaise potatoes and thyme jus.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCPhT2eBSA_1VVLpnQm9-cravzJ5Gc6FyawGxH5Takx28R2xtCFpag0eczWbZHEqE3gyaMGP0cvt9nLzATLU6A-7LS1erp38xnUTU91m3FZDe-dnxX88rni9PsT8essOHKPlgzsFX52buk-L2YJNIFb8moz3A5MaFooxURC6ri2hJ1J6sH5vfOLDCW3aU_dz9FOz9D9602DKJ_AY9GA3Z1eoG8bqbSgyRnKXiyjYHZzuIfZUVUIkLabvoLkmxtJ_IzNH_obOFeSUSQ",
      tags: ["Main", "Rich", "Savory"],
    },
    {
      id: "beef-tartare",
      name: "Beef Tartare",
      price: 22,
      description:
        "Hand-cut beef fillet, capers, shallots, egg yolk and house spice blend.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBE3Sa94YOEcabLhKzWAZ1hVizzQofzK2Z4E5bDpnb40C_Y7kjftpAIvfPRUvuRTv9i2R4yl2Jyas9yYjBSdg-TB95Y5sHjwlgXp0C5qu1WuvXdmBwrewbREclI2Qm3t1GSI7I2tRy0h0-uJWU7AE8RcD4OIZSj_MCLqex08-Yw5sMlLAY610w_NvRLCYyHK30eYl_t2qEEz-6QioSMB_5z-9TrP1ivcg5AOiYglAF-KcAtKAuyc_s8SkJBIcMDsOL9hhwBpVrU47c",
      tags: ["Starter", "Raw", "Peppery"],
    },
    {
      id: "scallops",
      name: "Seared Scallops",
      price: 28,
      description: "Jumbo scallops, cauliflower puree, truffle oil and micro greens.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAaiwxSmTLYTg2ZH3EFQxN-shWqR6ZLwQpI0z5SMPyJTaXY2mMiVVpwoVF-pqkdZU3upPy3La9j4mQfCanZGieFBcp6xyeSrSY82SN97CSDaaShFsNj7aA9cHnJxWOdNjYl13uEmlgRGlUWJTDIeFbl6lwNJQP547qRRdN-Zk43iFIZUevpZz0PNN2dQKNOgJxv0hPw1NuOXYzxB8zVyfrewxB1XetEi7on87zLHr9jOrkiMkRF0WT6CPcSqn2iO4DTpH263EN9O6A",
      tags: ["Main", "Seafood", "Delicate"],
    },
  ],
  wines: [
    {
      id: "riesling",
      name: "Trimbach Riesling",
      region: "Alsace, France",
      year: 2020,
      price: 76,
      rating: 4.8,
      description: "Bone-dry profile with mineral finish and focused citrus backbone.",
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
      name: "Domaine William Fevre Chablis Premier Cru",
      region: "Chablis, France",
      year: 2022,
      price: 92,
      rating: 4.4,
      description: "Citrus, oyster-shell minerality, and a taut, saline finish.",
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
      name: "Penfolds Grange",
      region: "South Australia",
      year: 2018,
      price: 650,
      rating: 4.5,
      description: "Dense dark fruit, spice, and powerful structure for rich dishes.",
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
      name: "Castello Banfi Chianti Classico",
      region: "Tuscany, Italy",
      year: 2021,
      price: 58,
      rating: 4.2,
      description: "Sour cherry, dried herbs, and vibrant acidity.",
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
      name: "Veuve Clicquot Yellow Label Brut",
      region: "Champagne, France",
      year: 2022,
      price: 98,
      rating: 4.6,
      description: "Fine mousse, apple and brioche notes, with crisp finish.",
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
};
