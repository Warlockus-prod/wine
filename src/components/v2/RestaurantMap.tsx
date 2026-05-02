"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl from "mapbox-gl";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import type { CatalogRestaurant } from "@/lib/restaurant-directory";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

if (TOKEN) {
  mapboxgl.accessToken = TOKEN;
}

type Props = {
  restaurants: CatalogRestaurant[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

export default function RestaurantMap({ restaurants, selectedSlug, onSelect }: Props) {
  const locale = useLocale() as Locale;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);

  // Keep latest onSelect callback without re-creating map.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const center = useMemo<[number, number]>(() => {
    if (restaurants.length === 0) {
      return [21.0122, 52.2297]; // Warsaw fallback
    }
    const lng = restaurants.reduce((s, r) => s + r.lng, 0) / restaurants.length;
    const lat = restaurants.reduce((s, r) => s + r.lat, 0) / restaurants.length;
    return [lng, lat];
  }, [restaurants]);

  // Init map once. Guard against WebGL absence (headless Chromium in CI/e2e
   // has no WebGL by default — Mapbox would throw and break hydration).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!TOKEN) {
      console.warn("Mapbox token missing — set NEXT_PUBLIC_MAPBOX_TOKEN");
      return;
    }
    if (!mapboxgl.supported || !mapboxgl.supported()) {
      console.warn("Mapbox-gl not supported in this environment (no WebGL).");
      return;
    }

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center,
        zoom: 4,
        attributionControl: false,
        cooperativeGestures: false,
      });
    } catch (err) {
      console.warn("Mapbox init failed", err);
      return;
    }

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true, customAttribution: "Cellar Compass" }),
      "bottom-left",
    );

    mapRef.current = map;
    const markers = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers with restaurants list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existingIds = new Set(markersRef.current.keys());
    const nextIds = new Set(restaurants.map((r) => r.slug));

    // Remove markers no longer present.
    for (const id of existingIds) {
      if (!nextIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    }

    // Add or update markers.
    for (const r of restaurants) {
      const existing = markersRef.current.get(r.slug);
      if (existing) {
        existing.setLngLat([r.lng, r.lat]);
        const el = existing.getElement();
        el.setAttribute("aria-label", t(r.name, locale));
        el.dataset.selected = r.slug === selectedSlug ? "true" : "false";
        continue;
      }

      const el = document.createElement("button");
      el.type = "button";
      el.className = "wn-marker";
      el.setAttribute("aria-label", t(r.name, locale));
      el.dataset.selected = r.slug === selectedSlug ? "true" : "false";
      el.innerHTML = '<span class="wn-marker__dot"></span>';
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(r.slug);
        map.flyTo({ center: [r.lng, r.lat], zoom: Math.max(map.getZoom(), 6), duration: 700 });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([r.lng, r.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 18, closeButton: false, className: "wn-popup" }).setHTML(
            `<div class="wn-popup__name">${escapeHtml(t(r.name, locale))}</div>` +
              `<div class="wn-popup__meta">${escapeHtml(r.city)}, ${escapeHtml(r.country)}</div>`,
          ),
        )
        .addTo(map);

      markersRef.current.set(r.slug, marker);
    }
  }, [restaurants, selectedSlug, locale]);

  // Fit bounds when restaurant set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || restaurants.length === 0) return;

    if (restaurants.length === 1) {
      const r = restaurants[0];
      map.flyTo({ center: [r.lng, r.lat], zoom: 12, duration: 600 });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    for (const r of restaurants) bounds.extend([r.lng, r.lat]);
    map.fitBounds(bounds, { padding: 60, maxZoom: 10, duration: 600 });
  }, [restaurants]);

  // Fly-to selected restaurant.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSlug) return;
    const r = restaurants.find((x) => x.slug === selectedSlug);
    if (!r) return;
    map.flyTo({ center: [r.lng, r.lat], zoom: Math.max(map.getZoom(), 8), duration: 700 });
  }, [selectedSlug, restaurants]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/10"
      data-testid="restaurant-map"
    />
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}
