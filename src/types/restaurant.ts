export type Wine = {
  id: string;
  name: string;
  region: string;
  grape: string;
  style: string;
  vintage?: string;
  notes: string;
};

export type DishPairing = {
  wineId: string;
  reason: string;
};

export type Dish = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  pairings: DishPairing[];
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  city: string;
  description: string;
  coverGradient: string;
  dishes: Dish[];
  wines: Wine[];
};
