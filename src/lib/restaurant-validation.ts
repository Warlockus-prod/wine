import { Dish, DishPairing, Restaurant, Wine } from "@/types/restaurant";

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const asPositiveNumber = (value: unknown): number => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item) => item.length > 0);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizePairings = (value: unknown): DishPairing[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): DishPairing | null => {
      if (!isObject(item)) {
        return null;
      }

      const wineId = asString(item.wineId);
      const reason = asString(item.reason);

      if (!wineId || !reason) {
        return null;
      }

      return { wineId, reason };
    })
    .filter((item): item is DishPairing => item !== null);
};

const sanitizeDish = (value: unknown, fallbackId: string): Dish | null => {
  if (!isObject(value)) {
    return null;
  }

  const name = asString(value.name);
  const description = asString(value.description);

  if (!name || !description) {
    return null;
  }

  return {
    id: asString(value.id) || fallbackId,
    name,
    category: asString(value.category) || "Main",
    description,
    price: asPositiveNumber(value.price),
    pairings: sanitizePairings(value.pairings),
  };
};

const sanitizeWine = (value: unknown, fallbackId: string): Wine | null => {
  if (!isObject(value)) {
    return null;
  }

  const name = asString(value.name);
  const region = asString(value.region);
  const grape = asString(value.grape);
  const notes = asString(value.notes);

  if (!name || !region || !grape || !notes) {
    return null;
  }

  const vintage = asString(value.vintage);

  return {
    id: asString(value.id) || fallbackId,
    name,
    region,
    grape,
    style: asString(value.style) || "White",
    vintage: vintage || undefined,
    notes,
  };
};

const sanitizeRestaurant = (
  value: unknown,
  fallbackId: string,
  fallbackSlug: string,
): Restaurant | null => {
  if (!isObject(value)) {
    return null;
  }

  const name = asString(value.name);
  const description = asString(value.description);

  if (!name || !description) {
    return null;
  }

  const winesInput = Array.isArray(value.wines) ? value.wines : [];
  const dishesInput = Array.isArray(value.dishes) ? value.dishes : [];

  const wines = winesInput
    .map((wine, index) => sanitizeWine(wine, `${fallbackId}-w${index + 1}`))
    .filter((wine): wine is Wine => wine !== null);

  const dishes = dishesInput
    .map((dish, index) => sanitizeDish(dish, `${fallbackId}-d${index + 1}`))
    .filter((dish): dish is Dish => dish !== null)
    .map((dish) => ({
      ...dish,
      pairings: dish.pairings.filter((pairing) => wines.some((wine) => wine.id === pairing.wineId)),
    }));

  return {
    id: asString(value.id) || fallbackId,
    slug: asString(value.slug) || fallbackSlug,
    name,
    cuisine: asString(value.cuisine) || "Cuisine",
    city: asString(value.city) || "City",
    description,
    coverGradient:
      asString(value.coverGradient) || "from-[#8b3a2f] via-[#c66a4b] to-[#f2c38b]",
    dishes,
    wines,
  };
};

export const normalizeRestaurants = (value: unknown): Restaurant[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const restaurants = value
    .map((item, index) =>
      sanitizeRestaurant(item, `restaurant-${index + 1}`, `restaurant-${index + 1}`),
    )
    .filter((item): item is Restaurant => item !== null);

  if (restaurants.length === 0) {
    return null;
  }

  const uniqueBySlug = new Map<string, Restaurant>();

  for (const restaurant of restaurants) {
    if (!uniqueBySlug.has(restaurant.slug)) {
      uniqueBySlug.set(restaurant.slug, restaurant);
    }
  }

  return [...uniqueBySlug.values()];
};

export const normalizeRestaurant = (value: unknown): Restaurant | null => {
  const normalized = normalizeRestaurants([value]);
  return normalized?.[0] ?? null;
};

export const parseRestaurantImport = (raw: string): Restaurant[] | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (isObject(parsed) && Array.isArray(parsed.restaurants)) {
      return normalizeRestaurants(parsed.restaurants);
    }

    return normalizeRestaurants(parsed);
  } catch {
    return null;
  }
};

export const restaurantsToExport = (restaurants: Restaurant[]) =>
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      restaurants,
    },
    null,
    2,
  );

export const extractCuisineTree = (restaurants: Restaurant[]) => {
  const cuisineMap = restaurants.reduce<Record<string, Restaurant[]>>((acc, restaurant) => {
    const cuisine = restaurant.cuisine;
    if (!acc[cuisine]) {
      acc[cuisine] = [];
    }
    acc[cuisine].push(restaurant);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(cuisineMap).map(([cuisine, items]) => [
      cuisine,
      items.sort((a, b) => a.name.localeCompare(b.name)),
    ]),
  );
};

export const makeSearchTokens = (value: string) =>
  asStringArray(value.toLowerCase().split(/[\s,.;:!?/\\-]+/));
