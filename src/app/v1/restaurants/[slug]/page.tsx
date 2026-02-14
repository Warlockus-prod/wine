"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useRestaurants } from "@/context/restaurants-context";
import { formatMoney } from "@/lib/format";

export default function RestaurantPage() {
  const params = useParams<{ slug: string }>();
  const { restaurants, ready, storageIssue } = useRestaurants();
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [dishQuery, setDishQuery] = useState("");
  const [wineQuery, setWineQuery] = useState("");

  const restaurant = useMemo(
    () => restaurants.find((item) => item.slug === params.slug),
    [params.slug, restaurants],
  );

  const effectiveSelectedDishId =
    selectedDishId && restaurant?.dishes.some((dish) => dish.id === selectedDishId)
      ? selectedDishId
      : restaurant?.dishes[0]?.id ?? null;

  const selectedDish =
    restaurant?.dishes.find((dish) => dish.id === effectiveSelectedDishId) ?? null;

  const matchedWineMap = useMemo(() => {
    if (!selectedDish) {
      return new Map<string, string>();
    }

    return new Map(selectedDish.pairings.map((pairing) => [pairing.wineId, pairing.reason]));
  }, [selectedDish]);

  const filteredDishes = useMemo(() => {
    if (!restaurant) {
      return [];
    }

    const normalized = dishQuery.trim().toLowerCase();
    if (!normalized) {
      return restaurant.dishes;
    }

    return restaurant.dishes.filter((dish) =>
      [dish.name, dish.category, dish.description]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [dishQuery, restaurant]);

  const filteredWines = useMemo(() => {
    if (!restaurant) {
      return [];
    }

    const normalized = wineQuery.trim().toLowerCase();
    if (!normalized) {
      return restaurant.wines;
    }

    return restaurant.wines.filter((wine) =>
      [wine.name, wine.region, wine.grape, wine.style, wine.notes]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [restaurant, wineQuery]);

  if (!ready) {
    return (
      <div className="site-panel flex min-h-[40vh] items-center justify-center p-10 text-lg text-[#6b665d]">
        Loading restaurant...
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="site-panel p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8d3a2b]">Not found</p>
        <h1 className="mt-2 text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          Restaurant does not exist
        </h1>
        <Link
          className="mt-5 inline-flex rounded-full border border-[#d7c9b7] bg-[#fff3e1] px-5 py-2 text-sm font-semibold"
          href="/v1"
        >
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {storageIssue ? (
        <section className="rounded-2xl border border-[#f0c8b8] bg-[#fff3ed] px-4 py-3 text-sm text-[#8d3a2b]">
          {storageIssue}
        </section>
      ) : null}

      <section className="site-panel overflow-hidden p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-[1fr_220px] md:items-end">
          <div>
            <Link className="text-sm text-[#58746b] hover:text-[#365a61]" href="/v1">
              Back to all restaurants
            </Link>
            <h1
              className="mt-2 text-5xl leading-[0.9] font-semibold md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {restaurant.name}
            </h1>
            <p className="mt-3 max-w-2xl text-[#6b665d]">{restaurant.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge">{restaurant.cuisine}</span>
              <span className="badge">{restaurant.city}</span>
              <span className="badge">{restaurant.dishes.length} dishes</span>
              <span className="badge">{restaurant.wines.length} wines</span>
            </div>
          </div>
          <div
            className={`h-32 rounded-3xl bg-gradient-to-br shadow-inner ${restaurant.coverGradient}`}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_1fr]">
        <article className="site-panel p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Menu
            </h2>
            <p className="text-xs uppercase tracking-[0.12em] text-[#7a766f]">Select one dish</p>
          </div>

          <label htmlFor="dish-search" className="mb-2 block text-sm font-medium text-[#6b665d]">
            Search dish
          </label>
          <input
            id="dish-search"
            value={dishQuery}
            onChange={(event) => setDishQuery(event.target.value)}
            placeholder="Name, category, description"
            className="mb-4 w-full rounded-xl border border-[#d8cdbc] bg-[#fffaf2] px-3 py-2"
          />

          <div className="grid gap-3 md:grid-cols-2">
            {filteredDishes.map((dish) => {
              const isSelected = dish.id === effectiveSelectedDishId;
              const shouldFade = effectiveSelectedDishId !== null && !isSelected;

              return (
                <button
                  key={dish.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDishId(dish.id)}
                  className={`tilt-card rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-[#a2432f] bg-[#fff0dc] shadow-[0_10px_20px_rgba(150,70,40,0.15)]"
                      : "border-[#e2d7c8] bg-[#fff9f0]"
                  } ${shouldFade ? "fade-dim" : ""}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold leading-snug">{dish.name}</h3>
                    <span className="badge">{dish.category}</span>
                  </div>
                  <p className="mb-3 text-sm text-[#6d685f]">{dish.description}</p>
                  <p className="text-sm font-semibold text-[#365a61]">{formatMoney(dish.price)}</p>
                </button>
              );
            })}
          </div>

          {filteredDishes.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[#e5d9c8] bg-[#fff9f1] p-3 text-[#7a756d]">
              No dishes found by this filter.
            </p>
          ) : null}
        </article>

        <article className="site-panel p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Wine list
            </h2>
            {selectedDish ? (
              <p className="text-xs uppercase tracking-[0.12em] text-[#7a766f]">
                Matches for: {selectedDish.name}
              </p>
            ) : (
              <p className="text-xs uppercase tracking-[0.12em] text-[#7a766f]">Select dish first</p>
            )}
          </div>

          <label htmlFor="wine-search" className="mb-2 block text-sm font-medium text-[#6b665d]">
            Search wine
          </label>
          <input
            id="wine-search"
            value={wineQuery}
            onChange={(event) => setWineQuery(event.target.value)}
            placeholder="Name, region, grape, style"
            className="mb-4 w-full rounded-xl border border-[#d8cdbc] bg-[#fffaf2] px-3 py-2"
          />

          {selectedDish ? (
            <div className="mb-4 rounded-2xl border border-[#d8cab8] bg-[#fff4e6] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#8d3a2b]">Selected dish</p>
              <h3 className="mt-1 text-xl font-semibold">{selectedDish.name}</h3>
              <p className="mt-1 text-sm text-[#6b665d]">{selectedDish.description}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            {filteredWines.map((wine) => {
              const reason = matchedWineMap.get(wine.id);
              const hasSelection = selectedDish !== null;
              const highlighted = Boolean(reason);
              const shouldFade = hasSelection && !highlighted;

              return (
                <div
                  key={wine.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    highlighted
                      ? "border-[#2f6a6e] bg-[#ebf7f3] shadow-[0_8px_18px_rgba(47,106,110,0.18)]"
                      : "border-[#e0d6c8] bg-[#fff9f1]"
                  } ${shouldFade ? "fade-dim" : ""}`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{wine.name}</h3>
                    <span className="badge">{wine.style}</span>
                  </div>
                  <p className="text-sm text-[#666159]">
                    {wine.region} · {wine.grape}
                    {wine.vintage ? ` · ${wine.vintage}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6a62]">{wine.notes}</p>
                  {reason ? (
                    <p className="mt-2 rounded-xl bg-[#d8f0e8] p-2 text-sm text-[#1f4b4e]">
                      Why it works: {reason}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {filteredWines.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[#e5d9c8] bg-[#fff9f1] p-3 text-[#7a756d]">
              No wines found by this filter.
            </p>
          ) : null}
        </article>
      </section>
    </div>
  );
}
