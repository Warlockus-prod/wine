"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRestaurants } from "@/context/restaurants-context";
import { extractCuisineTree } from "@/lib/restaurant-validation";

export default function Home() {
  const { restaurants, ready, storageIssue } = useRestaurants();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredRestaurants = useMemo(() => {
    if (!normalizedQuery) {
      return restaurants;
    }

    return restaurants.filter((restaurant) => {
      const haystack = [
        restaurant.name,
        restaurant.city,
        restaurant.cuisine,
        restaurant.description,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, restaurants]);

  const cuisines = useMemo(
    () => extractCuisineTree(filteredRestaurants),
    [filteredRestaurants],
  );

  const totalDishes = restaurants.reduce((sum, item) => sum + item.dishes.length, 0);
  const totalWines = restaurants.reduce((sum, item) => sum + item.wines.length, 0);

  if (!ready) {
    return (
      <div className="site-panel flex min-h-[40vh] items-center justify-center p-10 text-lg text-[#6b665d]">
        Loading restaurants...
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
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d8cbb8] bg-[#fff3df] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d3a2b]">
              Multi-restaurant prototype
            </p>
            <h1
              className="text-4xl leading-[0.95] font-semibold md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Menu + wine map
              <br />
              with instant pairing highlight
            </h1>
            <p className="mt-4 max-w-xl text-[#6b665d] md:text-lg">
              Select a restaurant, then choose any dish. Matching wines light up with
              explanations while the rest fade out for quick decision making.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-[#dbcdbc] bg-[#fff7ec] p-4">
              <div className="text-3xl font-semibold text-[#8d3a2b]">{restaurants.length}</div>
              <div className="text-xs uppercase tracking-[0.12em] text-[#7b766e]">Restaurants</div>
            </div>
            <div className="rounded-2xl border border-[#dbcdbc] bg-[#fff7ec] p-4">
              <div className="text-3xl font-semibold text-[#8d3a2b]">{totalDishes}</div>
              <div className="text-xs uppercase tracking-[0.12em] text-[#7b766e]">Dishes</div>
            </div>
            <div className="rounded-2xl border border-[#dbcdbc] bg-[#fff7ec] p-4">
              <div className="text-3xl font-semibold text-[#8d3a2b]">{totalWines}</div>
              <div className="text-xs uppercase tracking-[0.12em] text-[#7b766e]">Wines</div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-panel p-4 md:p-6">
        <label htmlFor="catalog-search" className="mb-2 block text-sm font-semibold text-[#6b665d]">
          Search restaurants
        </label>
        <input
          id="catalog-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type restaurant, cuisine, or city"
          className="w-full rounded-xl border border-[#d8cdbc] bg-[#fffaf2] px-3 py-2"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="site-panel p-5 md:p-6">
          <h2 className="mb-4 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Restaurant tree
          </h2>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-[#ddd1c0] bg-[#fff8ee] p-3 font-medium">
              Results ({filteredRestaurants.length})
            </div>
            {Object.entries(cuisines).map(([cuisine, items]) => (
              <details
                key={cuisine}
                open
                className="rounded-xl border border-[#ddd1c0] bg-[#fffaf3] p-3"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#365a61]">
                  {cuisine} ({items.length})
                </summary>
                <div className="mt-2 flex flex-col gap-2">
                  {items.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      className="rounded-lg px-2 py-1 text-[#524e46] transition-colors hover:bg-[#f4ead9]"
                      href={`/v1/restaurants/${restaurant.slug}`}
                    >
                      {restaurant.name}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
            {filteredRestaurants.length === 0 ? (
              <p className="rounded-xl border border-[#e5d9c8] bg-[#fff9f1] p-3 text-[#7a756d]">
                No restaurants found for this query.
              </p>
            ) : null}
          </div>
        </aside>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRestaurants.map((restaurant, index) => (
            <Link
              key={restaurant.id}
              href={`/v1/restaurants/${restaurant.slug}`}
              className="site-panel tilt-card fade-in p-5"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div
                className={`mb-4 h-28 rounded-2xl bg-gradient-to-br ${restaurant.coverGradient}`}
              />
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-2xl leading-none" style={{ fontFamily: "var(--font-display)" }}>
                  {restaurant.name}
                </h3>
                <span className="badge">{restaurant.city}</span>
              </div>
              <p className="mb-3 text-sm text-[#6b665d]">{restaurant.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="badge">{restaurant.cuisine}</span>
                <span className="badge">{restaurant.dishes.length} dishes</span>
                <span className="badge">{restaurant.wines.length} wines</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
