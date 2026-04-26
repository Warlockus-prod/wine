import type { LocalizedString } from "./pairing";

export type Wine = {
  id: string;
  name: LocalizedString;
  region: string;
  grape: string;
  style: string;
  vintage?: string;
  notes: LocalizedString;
};

export type DishPairing = {
  wineId: string;
  reason: LocalizedString;
};

export type Dish = {
  id: string;
  name: LocalizedString;
  category: string;
  description: LocalizedString;
  price: number;
  pairings: DishPairing[];
};

export type Restaurant = {
  id: string;
  slug: string;
  /** Brand name — usually identical across languages, but kept localized for
      consistency with Dish/Wine and to allow operators to provide a localized
      transliteration if needed. */
  name: LocalizedString;
  cuisine: string;
  city: string;
  description: LocalizedString;
  coverGradient: string;
  dishes: Dish[];
  wines: Wine[];
};
