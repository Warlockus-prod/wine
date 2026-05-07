import { seedRestaurants } from "@/data/seed-restaurants";
import type { Restaurant } from "@/types/restaurant";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wine.icoffio.com";

export type RestaurantMeta = {
  country: string;
  format: string;
  district: string;
  /** Latitude — real-world coordinates for the Mapbox map. */
  lat: number;
  /** Longitude — real-world coordinates for the Mapbox map. */
  lng: number;
  /** Hero/cover photo for restaurant card — stable Unsplash CDN URL. */
  coverImage: string;
  /** Optional city override — when present, replaces the underlying
   *  Restaurant.city (used after relocating restaurants by cuisine). */
  city?: string;
};

export type CatalogRestaurant = Restaurant &
  RestaurantMeta & {
    restaurantUrl: string;
    pairingUrl: string;
    qrUrl: string;
  };

// Restaurants spread across Europe by cuisine: Italian → Roma, French-leaning
// tasting menu → Paris, Polish ones stay home. City field on the underlying
// Restaurant gets overlaid via the cover/meta — display layer reads from
// CatalogRestaurant. Photos are stable Unsplash CDN URLs (curated; same id
// resolves identically every load — no random API).
const restaurantMetaBySlug: Record<string, RestaurantMeta> = {
  "atelier-amaro": {
    country: "Polska",
    format: "Fine Dining",
    district: "Ujazdów",
    lat: 52.2206, // Warsaw, ul. Agrykola 1 (Łazienki area)
    lng: 21.0282,
    coverImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format",
  },
  "senses-warsaw": {
    country: "France",
    format: "Tasting Menu · Michelin",
    district: "1er Arrondissement",
    city: "Paris",
    lat: 48.8566, // Paris (was Warsaw — moved per cuisine: Tasting Menu fits Paris)
    lng: 2.3522,
    coverImage:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=80&auto=format",
  },
  "bottiglieria-1881": {
    country: "Italia",
    format: "Italian · Michelin",
    district: "Trastevere",
    city: "Roma",
    lat: 41.9028, // Roma (was Krakow — Italian cuisine fits Rome)
    lng: 12.4964,
    coverImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format",
  },
  "pod-aniolami": {
    country: "Polska",
    format: "Tradycyjna",
    district: "Stare Miasto",
    lat: 50.0617, // Krakow, ul. Grodzka 35
    lng: 19.9376,
    coverImage:
      "https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=80&auto=format",
  },
  "brovariusz-wroclaw": {
    country: "Polska",
    format: "Gastropub",
    district: "Stare Miasto",
    lat: 51.1100, // Wrocław, Rynek 6
    lng: 17.0303,
    coverImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&auto=format",
  },
};

const fallbackMeta = (restaurant: Restaurant, index = 0): RestaurantMeta => ({
  country: "Polska",
  format: "Restaurant",
  district: restaurant.city || "Centrum",
  lat: 52.2297 + index * 0.01,
  lng: 21.0122 + index * 0.01,
  coverImage:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&auto=format",
});

export const buildRestaurantUrl = (slug: string) =>
  new URL(`/restaurants/${slug}`, SITE_URL).toString();

export const buildPairingUrl = (slug: string) =>
  new URL(`/pairing?restaurant=${slug}`, SITE_URL).toString();

export const buildQrUrl = (url: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(url)}`;

export const decorateRestaurant = (restaurant: Restaurant, index = 0): CatalogRestaurant => {
  const meta = restaurantMetaBySlug[restaurant.slug] ?? fallbackMeta(restaurant, index);
  const restaurantUrl = buildRestaurantUrl(restaurant.slug);

  // meta spreads after restaurant, so meta.city (if set) replaces the
  // seeded city. Falls back to seed value when meta.city is undefined.
  return {
    ...restaurant,
    ...meta,
    city: meta.city ?? restaurant.city,
    restaurantUrl,
    pairingUrl: buildPairingUrl(restaurant.slug),
    qrUrl: buildQrUrl(restaurantUrl),
  };
};

export const decorateRestaurants = (restaurants: Restaurant[]): CatalogRestaurant[] =>
  restaurants.map((restaurant, index) => decorateRestaurant(restaurant, index));

export const catalogRestaurants: CatalogRestaurant[] = decorateRestaurants(seedRestaurants);

export const getCatalogRestaurant = (slug: string) =>
  catalogRestaurants.find((restaurant) => restaurant.slug === slug) ?? null;
