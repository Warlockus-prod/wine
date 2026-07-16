import type { Dispatch, SetStateAction } from "react";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import type { PairingDataset, PairingDish } from "@/types/pairing";
import {
  type AdminMobileTab,
  type DishFormState,
  parseTags,
  setLocalized,
  toRoman,
  toTagInput,
} from "./shared";

type DishesPanelProps = {
  dataset: PairingDataset;
  locale: Locale;
  mobileTab: AdminMobileTab;
  dishForm: DishFormState;
  setDishForm: Dispatch<SetStateAction<DishFormState>>;
  addDish: () => void;
  updateDish: (dishId: string, patch: Partial<PairingDish>) => void;
  removeDish: (dishId: string) => void;
};

export default function DishesPanel({
  dataset,
  locale,
  mobileTab,
  dishForm,
  setDishForm,
  addDish,
  updateDish,
  removeDish,
}: DishesPanelProps) {
  return (
    <article
      className={`surface-parchment editorial-frame relative min-w-0 rounded-2xl p-5 sm:p-6 ${
        mobileTab !== "dishes" ? "hidden xl:block" : ""
      }`}
    >
      <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-[rgba(199,159,105,0.18)] pb-3">
        <div>
          <p className="pitch-eyebrow">Tasting Log · I</p>
          <h2 className="pitch-display mt-1 text-2xl text-white">Dishes</h2>
        </div>
        <p className="font-serif text-xs italic text-[#c79f69]/80">
          {dataset.dishes.length} entries
        </p>
      </header>

      {/* New entry */}
      <div className="rounded-xl border border-[rgba(199,159,105,0.20)] bg-[#0b1f44]/55 p-4">
        <p className="font-serif text-xs italic tracking-wider text-[var(--color-accent-gold)] uppercase">
          ❦ New entry
        </p>
        <div className="mt-3 grid gap-3">
          <div>
            <label className="field-label">Name</label>
            <input
              className="field-refined w-full"
              placeholder="Dish name" aria-label="Dish name"
              value={dishForm.name}
              onChange={(event) => setDishForm({ ...dishForm, name: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Price</label>
              <input
                className="field-refined w-full"
                type="number"
                min={1}
                placeholder="Price" aria-label="Price"
                value={dishForm.price}
                onChange={(event) => setDishForm({ ...dishForm, price: event.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Tags</label>
              <input
                className="field-refined w-full"
                placeholder="Tags (comma separated)" aria-label="Tags (comma separated)"
                value={dishForm.tags}
                onChange={(event) => setDishForm({ ...dishForm, tags: event.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="field-label">Image URL</label>
            <input
              className="field-refined w-full"
              placeholder="Image URL" aria-label="Image URL"
              value={dishForm.image}
              onChange={(event) => setDishForm({ ...dishForm, image: event.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea
              className="field-refined min-h-16 w-full"
              placeholder="Dish description" aria-label="Dish description"
              value={dishForm.description}
              onChange={(event) => setDishForm({ ...dishForm, description: event.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={addDish}
            className="pitch-cta-primary mt-1 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
          >
            + Add Dish
          </button>
        </div>
      </div>

      {/* Existing entries */}
      <div className="mt-5 space-y-4 max-h-[640px] overflow-auto pr-1">
        {dataset.dishes.map((dish, idx) => (
          <div
            key={dish.id}
            className="rounded-xl border border-[rgba(199,159,105,0.14)] bg-[#0b1f44]/40 p-4 transition hover:border-[rgba(199,159,105,0.30)]"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-[rgba(199,159,105,0.12)] pb-2">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-sm italic text-[var(--color-accent-gold)]">
                  {toRoman(idx + 1)}.
                </span>
                <span className="font-serif text-base italic text-[#f4efe9]">
                  {t(dish.name, locale) || "Untitled"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeDish(dish.id)}
                className="inline-flex min-h-[40px] items-center rounded-full border border-rose-500/30 bg-rose-900/15 px-3.5 py-2 text-[11px] font-semibold tracking-wider text-rose-300 uppercase transition hover:bg-rose-900/30"
              >
                Delete
              </button>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input
                className="field-refined w-full"
                placeholder="EN name" aria-label="EN name"
                value={dish.name.en}
                onChange={(event) =>
                  updateDish(dish.id, { name: setLocalized(dish.name, "en", event.target.value) })
                }
              />
              <input
                className="field-refined w-full"
                placeholder="PL nazwa" aria-label="PL nazwa"
                value={dish.name.pl}
                onChange={(event) =>
                  updateDish(dish.id, { name: setLocalized(dish.name, "pl", event.target.value) })
                }
              />
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input
                className="field-refined w-full"
                type="number"
                min={1}
                aria-label="Dish price"
                value={dish.price}
                onChange={(event) =>
                  updateDish(dish.id, { price: Math.max(1, Number(event.target.value) || 1) })
                }
              />
              <input
                className="field-refined w-full"
                aria-label="Dish tags (comma separated)"
                value={toTagInput(dish.tags)}
                onChange={(event) => updateDish(dish.id, { tags: parseTags(event.target.value) })}
              />
            </div>
            <input
              className="field-refined mb-2 w-full"
              aria-label="Dish image URL"
              value={dish.image}
              onChange={(event) => updateDish(dish.id, { image: event.target.value })}
            />
            <div className="mb-1 grid gap-2 sm:grid-cols-2">
              <textarea
                className="field-refined min-h-14 w-full min-w-0"
                placeholder="EN description" aria-label="EN description"
                value={dish.description.en}
                onChange={(event) =>
                  updateDish(dish.id, {
                    description: setLocalized(dish.description, "en", event.target.value),
                  })
                }
              />
              <textarea
                className="field-refined min-h-14 w-full min-w-0"
                placeholder="PL opis" aria-label="PL opis"
                value={dish.description.pl}
                onChange={(event) =>
                  updateDish(dish.id, {
                    description: setLocalized(dish.description, "pl", event.target.value),
                  })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
