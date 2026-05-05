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
};

export type CatalogRestaurant = Restaurant &
  RestaurantMeta & {
    restaurantUrl: string;
    pairingUrl: string;
    qrUrl: string;
  };

// Real Polish restaurants — names, neighbourhoods and approximate coordinates
// taken from public listings. Menu/wine card content remains demo-grade until
// each restaurant onboards with their actual lists.
const restaurantMetaBySlug: Record<string, RestaurantMeta> = {
  "atelier-amaro": {
    country: "Polska",
    format: "Fine Dining",
    district: "Ujazdów",
    lat: 52.2206, // Warsaw, ul. Agrykola 1 (Łazienki area)
    lng: 21.0282,
  },
  "senses-warsaw": {
    country: "Polska",
    format: "Michelin",
    district: "Śródmieście",
    lat: 52.2455, // Warsaw, ul. Bielańska 12
    lng: 21.0061,
  },
  "bottiglieria-1881": {
    country: "Polska",
    format: "Michelin",
    district: "Stare Podgórze",
    lat: 50.0473, // Krakow, ul. Bocheńska 5
    lng: 19.9485,
  },
  "pod-aniolami": {
    country: "Polska",
    format: "Tradycyjna",
    district: "Stare Miasto",
    lat: 50.0617, // Krakow, ul. Grodzka 35
    lng: 19.9376,
  },
  "brovariusz-wroclaw": {
    country: "Polska",
    format: "Gastropub",
    district: "Stare Miasto",
    lat: 51.1100, // Wrocław, Rynek 6
    lng: 17.0303,
  },
};

const fallbackMeta = (restaurant: Restaurant, index = 0): RestaurantMeta => ({
  country: "Polska",
  format: "Restaurant",
  district: restaurant.city || "Centrum",
  lat: 52.2297 + index * 0.01,
  lng: 21.0122 + index * 0.01,
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

  return {
    ...restaurant,
    ...meta,
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
