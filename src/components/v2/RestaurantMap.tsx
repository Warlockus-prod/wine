"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import type { CatalogRestaurant } from "@/lib/restaurant-directory";

// Inline SVG marker — avoids the broken default Leaflet image URLs in webpack
// builds and keeps the brand color (`primary` ≈ #d11534).
const buildMarkerIcon = (selected: boolean) =>
  L.divIcon({
    className: "restaurant-map-marker",
    html: `<span class="restaurant-map-marker__dot${
      selected ? " restaurant-map-marker__dot--selected" : ""
    }"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
  });

type Props = {
  restaurants: CatalogRestaurant[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

function FitToRestaurants({ restaurants }: { restaurants: CatalogRestaurant[] }) {
  const map = useMap();

  useEffect(() => {
    if (restaurants.length === 0) {
      return;
    }
    if (restaurants.length === 1) {
      const only = restaurants[0];
      map.setView([only.lat, only.lng], 6, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(restaurants.map((r) => [r.lat, r.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }, [map, restaurants]);

  return null;
}

function FlyToSelected({
  restaurants,
  selectedSlug,
}: {
  restaurants: CatalogRestaurant[];
  selectedSlug: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedSlug) {
      return;
    }
    const target = restaurants.find((r) => r.slug === selectedSlug);
    if (!target) {
      return;
    }
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 6), { duration: 0.8 });
  }, [map, restaurants, selectedSlug]);

  return null;
}

export default function RestaurantMap({ restaurants, selectedSlug, onSelect }: Props) {
  const locale = useLocale() as Locale;
  const center = useMemo<[number, number]>(() => {
    if (restaurants.length === 0) {
      return [48.8566, 2.3522]; // Paris fallback
    }
    const lat = restaurants.reduce((sum, r) => sum + r.lat, 0) / restaurants.length;
    const lng = restaurants.reduce((sum, r) => sum + r.lng, 0) / restaurants.length;
    return [lat, lng];
  }, [restaurants]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/10"
      data-testid="restaurant-map"
    >
      <MapContainer
        center={center}
        zoom={4}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: "#130a0b" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToRestaurants restaurants={restaurants} />
        <FlyToSelected restaurants={restaurants} selectedSlug={selectedSlug} />
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.slug}
            position={[restaurant.lat, restaurant.lng]}
            icon={buildMarkerIcon(restaurant.slug === selectedSlug)}
            eventHandlers={{
              click: () => onSelect(restaurant.slug),
            }}
          >
            <Popup>
              <div className="restaurant-map-popup">
                <p className="restaurant-map-popup__name">{t(restaurant.name, locale)}</p>
                <p className="restaurant-map-popup__meta">
                  {restaurant.city}, {restaurant.country}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
