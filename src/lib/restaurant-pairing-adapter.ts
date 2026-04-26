import type { PairingDataset, PairingDish, PairingWine, WineAcidity, WineBody, WineTannin } from "@/types/pairing";
import type { Restaurant, Wine } from "@/types/restaurant";

export type RestaurantMatchDetails = {
  score: number;
  reason: string;
};

const dishImagePool = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBhlI46dafXSZ08utjSWbYOYBXZcyqovonosZ2MUis2T4FrSvjy7_Er5VMFJGAyjeWp6cx4bAhd_fI7SJMDIIwahIUPZlC02XtIhiDwCHmPSxPugT4iWUD67WMW99bbqs2xkNY5bYvdOaPa6jOirgJHjo9wV0NTJewH4our6G4GtxHwO9VnE0K3h93WLpEAD80eTfNnFdE31B3kcA4ndUFvOistF3Se_VuL9iOVmF5AN-mDj830CgfHP0aDivk8iqNlJQeBWp8M6L0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCPhT2eBSA_1VVLpnQm9-cravzJ5Gc6FyawGxH5Takx28R2xtCFpag0eczWbZHEqE3gyaMGP0cvt9nLzATLU6A-7LS1erp38xnUTU91m3FZDe-dnxX88rni9PsT8essOHKPlgzsFX52buk-L2YJNIFb8moz3A5MaFooxURC6ri2hJ1J6sH5vfOLDCW3aU_dz9FOz9D9602DKJ_AY9GA3Z1eoG8bqbSgyRnKXiyjYHZzuIfZUVUIkLabvoLkmxtJ_IzNH_obOFeSUSQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBE3Sa94YOEcabLhKzWAZ1hVizzQofzK2Z4E5bDpnb40C_Y7kjftpAIvfPRUvuRTv9i2R4yl2Jyas9yYjBSdg-TB95Y5sHjwlgXp0C5qu1WuvXdmBwrewbREclI2Qm3t1GSI7I2tRy0h0-uJWU7AE8RcD4OIZSj_MCLqex08-Yw5sMlLAY610w_NvRLCYyHK30eYl_t2qEEz-6QioSMB_5z-9TrP1ivcg5AOiYglAF-KcAtKAuyc_s8SkJBIcMDsOL9hhwBpVrU47c",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAaiwxSmTLYTg2ZH3EFQxN-shWqR6ZLwQpI0z5SMPyJTaXY2mMiVVpwoVF-pqkdZU3upPy3La9j4mQfCanZGieFBcp6xyeSrSY82SN97CSDaaShFsNj7aA9cHnJxWOdNjYl13uEmlgRGlUWJTDIeFbl6lwNJQP547qRRdN-Zk43iFIZUevpZz0PNN2dQKNOgJxv0hPw1NuOXYzxB8zVyfrewxB1XetEi7on87zLHr9jOrkiMkRF0WT6CPcSqn2iO4DTpH263EN9O6A",
];

const wineImages = {
  riesling: "https://upload.wikimedia.org/wikipedia/commons/9/91/2009_Trimbach_Riesling_%288130797570%29.jpg",
  chardonnay: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Chablis_bottle_and_wine.jpg",
  sangiovese: "https://upload.wikimedia.org/wikipedia/commons/3/39/Banfi_Chianti_Classico_2005.jpg",
  sparkling: "https://upload.wikimedia.org/wikipedia/commons/5/58/Veuve_Clicquot_-_bottle.jpg",
  red: "https://upload.wikimedia.org/wikipedia/commons/2/21/PenfoldsGrange.jpg",
} as const;

const knownBottlePrices: Record<string, number> = {
  "Marchesi Antinori Tignanello": 260,
  "Frescobaldi Nipozzano Chianti Rufina Riserva": 54,
  "La Scolca Gavi dei Gavi Black Label": 68,
  "Planeta Chardonnay": 72,
  "Ferrari Brut Trento DOC": 58,
  "Donnafugata Ben Rye": 118,
  "Castello Banfi Brunello di Montalcino": 145,
  "Jermann Pinot Grigio": 52,
  "Cloudy Bay Sauvignon Blanc": 64,
  "Domaine William Fevre Chablis": 76,
  "Dr. Loosen Riesling Kabinett": 48,
  "Ruinart Blanc de Blancs": 160,
  "Billecart-Salmon Brut Rose": 155,
  "Meiomi Pinot Noir": 58,
  "Ridge Geyserville": 92,
  "Gerard Bertrand Cote des Roses Rose": 44,
  "La Rioja Alta Vina Ardanza Reserva": 74,
  "Marques de Murrieta Reserva": 66,
  "Vega Sicilia Valbuena 5": 330,
  "Martin Codax Albarino": 42,
  "Bodegas Muga Blanco": 52,
  "Gramona Imperial Brut": 68,
  "Torres Celeste Crianza": 46,
  "Lopez de Heredia Vina Tondonia Blanco Reserva": 138,
  "Domaine Vacheron Sancerre Blanc": 88,
  "Domaine William Fevre Chablis Premier Cru": 92,
  "Louis Jadot Beaune Premier Cru": 86,
  "Chateau de Beaucastel Chateauneuf-du-Pape": 185,
  "Whispering Angel Rose": 50,
  "Bollinger Special Cuvee": 128,
  "Chateau Smith Haut Lafitte Blanc": 245,
  "Chateau La Dominique Saint-Emilion Grand Cru": 98,
  "Catena Zapata Malbec Argentino": 160,
  "Montes Alpha Cabernet Sauvignon": 48,
  "Marques de Casa Concha Chardonnay": 44,
  "Lapostolle Cuvee Alexandre Carmenere": 58,
  "Garzon Reserva Albarino": 42,
  "Santa Rita Casa Real Cabernet Sauvignon": 150,
  "Zuccardi Q Torrontes": 38,
  "Vina Cobos Bramare Malbec": 112,
};

const hashString = (value: string) =>
  Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);

const parseVintageYear = (vintage: string | undefined) => {
  const parsed = Number(vintage);
  return Number.isFinite(parsed) && parsed >= 1900 ? parsed : 2024;
};

const getWineImage = (wine: Wine) => {
  const text = `${wine.name} ${wine.grape} ${wine.style}`.toLowerCase();

  if (text.includes("riesling")) {
    return wineImages.riesling;
  }
  if (text.includes("chablis") || text.includes("chardonnay") || text.includes("albarino") || text.includes("sancerre")) {
    return wineImages.chardonnay;
  }
  if (text.includes("sangiovese") || text.includes("chianti") || text.includes("brunello")) {
    return wineImages.sangiovese;
  }
  if (text.includes("sparkling") || text.includes("champagne") || text.includes("brut") || text.includes("cava")) {
    return wineImages.sparkling;
  }

  return wineImages.red;
};

const inferBody = (wine: Wine): WineBody => {
  const text = `${wine.name} ${wine.grape} ${wine.style} ${wine.notes}`.toLowerCase();
  if (/(cabernet|malbec|syrah|shiraz|tignanello|brunello|valbuena|chateauneuf|beaucastel|santa rita|cob os|cobos)/.test(text)) {
    return "full";
  }
  if (/(riesling|albarino|pinot grigio|rose|sancerre|gavi|sparkling|champagne|brut|chablis)/.test(text)) {
    return "light";
  }
  return "medium";
};

const inferAcidity = (wine: Wine): WineAcidity => {
  const text = `${wine.name} ${wine.grape} ${wine.style} ${wine.notes}`.toLowerCase();
  if (/(riesling|sancerre|chablis|albarino|gavi|pinot grigio|sparkling|champagne|brut|citrus|crisp|saline|mineral)/.test(text)) {
    return "high";
  }
  if (/(dessert|ben rye|zibibbo)/.test(text)) {
    return "medium";
  }
  return "medium";
};

const inferTannin = (wine: Wine): WineTannin => {
  const text = `${wine.name} ${wine.grape} ${wine.style} ${wine.notes}`.toLowerCase();
  if (!text.includes("red") && !/(cabernet|malbec|tempranillo|sangiovese|merlot|pinot noir|zinfandel|carmenere)/.test(text)) {
    return "none";
  }
  if (/(cabernet|malbec|tempranillo|brunello|valbuena|tignanello|chateauneuf|beaucastel)/.test(text)) {
    return "high";
  }
  if (/(pinot noir|meiomi|jadot)/.test(text)) {
    return "soft";
  }
  return "medium";
};

const inferAbv = (wine: Wine) => {
  const body = inferBody(wine);
  if (wine.style.toLowerCase().includes("sparkling")) {
    return 12.5;
  }
  if (wine.style.toLowerCase().includes("dessert")) {
    return 14;
  }
  return body === "full" ? 14.5 : body === "medium" ? 13.5 : 12.5;
};

const servingTempFor = (wine: Wine) => {
  const style = wine.style.toLowerCase();
  const body = inferBody(wine);
  if (style.includes("sparkling")) {
    return "7-9";
  }
  if (style.includes("white") || style.includes("rose") || style.includes("dessert")) {
    return "8-11";
  }
  return body === "full" ? "16-18" : "14-16";
};

const decantFor = (wine: Wine) => {
  const tannin = inferTannin(wine);
  if (tannin === "high") {
    return "Decant 45 minutes before service.";
  }
  if (tannin === "medium") {
    return "Optional 20-minute decant.";
  }
  return "No decant. Serve fresh from the cellar.";
};

const getWineTags = (wine: Wine) => {
  const tags = [wine.style, wine.grape];
  const notes = wine.notes.toLowerCase();

  if (notes.includes("citrus") || notes.includes("lime") || notes.includes("lemon")) {
    tags.push("Citrus");
  }
  if (notes.includes("mineral") || notes.includes("saline") || notes.includes("chalk")) {
    tags.push("Mineral");
  }
  if (notes.includes("cherry") || notes.includes("berry") || notes.includes("fruit")) {
    tags.push("Red Fruit");
  }
  if (notes.includes("spice") || notes.includes("pepper") || notes.includes("herb")) {
    tags.push("Savory");
  }

  return tags.slice(0, 6);
};

export const buildPairingDatasetFromRestaurant = (restaurant: Restaurant): PairingDataset => ({
  dishes: restaurant.dishes.map<PairingDish>((dish, index) => ({
    id: dish.id,
    name: dish.name,
    price: dish.price,
    description: dish.description,
    image: dishImagePool[index % dishImagePool.length],
    tags: [dish.category, restaurant.cuisine].filter(Boolean),
  })),
  wines: restaurant.wines.map<PairingWine>((wine) => ({
    id: wine.id,
    name: wine.name,
    region: wine.region,
    year: parseVintageYear(wine.vintage),
    vintageLabel: wine.vintage ?? String(parseVintageYear(wine.vintage)),
    price: knownBottlePrices[wine.name] ?? (wine.style.toLowerCase().includes("sparkling") ? 78 : 58),
    rating: wine.style.toLowerCase().includes("red") ? 4.5 : 4.4,
    description: wine.notes,
    image: getWineImage(wine),
    tags: getWineTags(wine),
    passport: {
      grape: wine.grape,
      abv: inferAbv(wine),
      body: inferBody(wine),
      acidity: inferAcidity(wine),
      tannin: inferTannin(wine),
      servingTempC: servingTempFor(wine),
      decant: decantFor(wine),
    },
  })),
});

export const getRestaurantMatchForDishWine = (
  restaurant: Restaurant | null,
  dishId: string,
  wineId: string,
): RestaurantMatchDetails | null => {
  const dish = restaurant?.dishes.find((item) => item.id === dishId);
  if (!dish) {
    return null;
  }

  const pairingIndex = dish.pairings.findIndex((pairing) => pairing.wineId === wineId);
  if (pairingIndex === -1) {
    return null;
  }

  return {
    score: Math.max(82, 96 - pairingIndex * 5),
    reason: dish.pairings[pairingIndex].reason,
  };
};

export const applyRestaurantPairingOverrides = (
  baseMap: Map<string, RestaurantMatchDetails>,
  restaurant: Restaurant | null,
  dishId: string,
  wines: PairingWine[],
) => {
  if (!restaurant) {
    return baseMap;
  }

  const nextMap = new Map<string, RestaurantMatchDetails>();
  for (const wine of wines) {
    const base = baseMap.get(wine.id);
    if (base) {
      nextMap.set(wine.id, {
        ...base,
        score: Math.min(base.score, 78 + (hashString(wine.id) % 5)),
      });
    }
  }

  for (const wine of wines) {
    const curated = getRestaurantMatchForDishWine(restaurant, dishId, wine.id);
    if (curated) {
      nextMap.set(wine.id, curated);
    }
  }

  return nextMap;
};
