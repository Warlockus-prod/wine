import { seedRestaurants } from "@/data/seed-restaurants";
import type { Restaurant } from "@/types/restaurant";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wine.icoffio.com";

export type RestaurantMeta = {
  country: string;
  format: string;
  district: string;
  mapX: number;
  mapY: number;
};

export type CatalogRestaurant = Restaurant &
  RestaurantMeta & {
    restaurantUrl: string;
    pairingUrl: string;
    qrUrl: string;
  };

const restaurantMetaBySlug: Record<string, RestaurantMeta> = {
  "trattoria-bellavista": {
    country: "Italy",
    format: "Trattoria",
    district: "Santa Croce",
    mapX: 57,
    mapY: 63,
  },
  "sakura-ember": {
    country: "Denmark",
    format: "Chef's Table",
    district: "Christianshavn",
    mapX: 58,
    mapY: 25,
  },
  "brasa-iberica": {
    country: "Spain",
    format: "Grill House",
    district: "Salamanca",
    mapX: 23,
    mapY: 65,
  },
  "bistro-maree": {
    country: "France",
    format: "Bistro",
    district: "Presqu'ile",
    mapX: 41,
    mapY: 48,
  },
  "andes-fuego": {
    country: "Portugal",
    format: "Fusion Bar",
    district: "Chiado",
    mapX: 14,
    mapY: 68,
  },
};

export const buildRestaurantUrl = (slug: string) =>
  new URL(`/restaurants/${slug}`, SITE_URL).toString();

export const buildPairingUrl = (slug: string) =>
  new URL(`/pairing?restaurant=${slug}`, SITE_URL).toString();

export const buildQrUrl = (url: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(url)}`;

export const catalogRestaurants: CatalogRestaurant[] = seedRestaurants.map((restaurant) => {
  const meta = restaurantMetaBySlug[restaurant.slug];
  const restaurantUrl = buildRestaurantUrl(restaurant.slug);

  return {
    ...restaurant,
    ...meta,
    restaurantUrl,
    pairingUrl: buildPairingUrl(restaurant.slug),
    qrUrl: buildQrUrl(restaurantUrl),
  };
});

export const getCatalogRestaurant = (slug: string) =>
  catalogRestaurants.find((restaurant) => restaurant.slug === slug) ?? null;
