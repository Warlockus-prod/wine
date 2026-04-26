import { seedRestaurants } from "@/data/seed-restaurants";
import type { Restaurant } from "@/types/restaurant";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wine.icoffio.com";

export type RestaurantMeta = {
  country: string;
  format: string;
  district: string;
  /** Latitude — real-world coordinates for the Leaflet map. */
  lat: number;
  /** Longitude — real-world coordinates for the Leaflet map. */
  lng: number;
};

export type CatalogRestaurant = Restaurant &
  RestaurantMeta & {
    restaurantUrl: string;
    pairingUrl: string;
    qrUrl: string;
  };

// Real-world coordinates for the cities/districts each demo restaurant claims.
// Picked roughly in the named district — placeholder until verified addresses
// are sourced for the commercial pitch.
const restaurantMetaBySlug: Record<string, RestaurantMeta> = {
  "trattoria-bellavista": {
    country: "Italy",
    format: "Trattoria",
    district: "Santa Croce",
    lat: 45.4408, // Venice, Santa Croce
    lng: 12.3155,
  },
  "sakura-ember": {
    country: "Denmark",
    format: "Chef's Table",
    district: "Christianshavn",
    lat: 55.6717, // Copenhagen, Christianshavn
    lng: 12.5912,
  },
  "brasa-iberica": {
    country: "Spain",
    format: "Grill House",
    district: "Salamanca",
    lat: 40.4286, // Madrid, Salamanca
    lng: -3.6772,
  },
  "bistro-maree": {
    country: "France",
    format: "Bistro",
    district: "Presqu'ile",
    lat: 45.7595, // Lyon, Presqu'ile
    lng: 4.8346,
  },
  "andes-fuego": {
    country: "Portugal",
    format: "Fusion Bar",
    district: "Chiado",
    lat: 38.7110, // Lisbon, Chiado
    lng: -9.1416,
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
