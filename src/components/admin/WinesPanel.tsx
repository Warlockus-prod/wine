import type { Dispatch, SetStateAction } from "react";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import type {
  PairingDataset,
  PairingWine,
  WineAcidity,
  WineBody,
  WineTannin,
} from "@/types/pairing";
import {
  type AdminMobileTab,
  type WineFormState,
  acidityOptions,
  bodyOptions,
  parseTags,
  setLocalized,
  tanninOptions,
  toRoman,
  toTagInput,
} from "./shared";

type WinesPanelProps = {
  dataset: PairingDataset;
  locale: Locale;
  mobileTab: AdminMobileTab;
  wineForm: WineFormState;
  setWineForm: Dispatch<SetStateAction<WineFormState>>;
  addWine: () => void;
  updateWine: (wineId: string, patch: Partial<PairingWine>) => void;
  removeWine: (wineId: string) => void;
};

export default function WinesPanel({
  dataset,
  locale,
  mobileTab,
  wineForm,
  setWineForm,
  addWine,
  updateWine,
  removeWine,
}: WinesPanelProps) {
  return (
    <article
      className={`surface-parchment editorial-frame relative min-w-0 rounded-2xl p-5 sm:p-6 ${
        mobileTab !== "wines" ? "hidden xl:block" : ""
      }`}
    >
      <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-[rgba(199,159,105,0.18)] pb-3">
        <div>
          <p className="pitch-eyebrow">Cellar Log · II</p>
          <h2 className="pitch-display mt-1 text-2xl text-white">Wines</h2>
        </div>
        <p className="font-serif text-xs italic text-[#c79f69]/80">
          {dataset.wines.length} entries
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
              placeholder="Wine name" aria-label="Wine name"
              value={wineForm.name}
              onChange={(event) => setWineForm({ ...wineForm, name: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Region</label>
              <input
                className="field-refined w-full"
                placeholder="Region" aria-label="Region"
                value={wineForm.region}
                onChange={(event) => setWineForm({ ...wineForm, region: event.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Year</label>
              <input
                className="field-refined w-full"
                type="number"
                min={1900}
                max={2100}
                placeholder="Year" aria-label="Year"
                value={wineForm.year}
                onChange={(event) => setWineForm({ ...wineForm, year: event.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Price</label>
              <input
                className="field-refined w-full"
                type="number"
                min={1}
                placeholder="Price" aria-label="Price"
                value={wineForm.price}
                onChange={(event) => setWineForm({ ...wineForm, price: event.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Rating</label>
              <input
                className="field-refined w-full"
                type="number"
                min={1}
                max={5}
                step={0.1}
                placeholder="Rating" aria-label="Rating"
                value={wineForm.rating}
                onChange={(event) => setWineForm({ ...wineForm, rating: event.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="field-label">Image URL</label>
            <input
              className="field-refined w-full"
              placeholder="Image URL" aria-label="Image URL"
              value={wineForm.image}
              onChange={(event) => setWineForm({ ...wineForm, image: event.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Tags</label>
            <input
              className="field-refined w-full"
              placeholder="Tags (comma separated)" aria-label="Tags (comma separated)"
              value={wineForm.tags}
              onChange={(event) => setWineForm({ ...wineForm, tags: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Grape</label>
              <input
                className="field-refined w-full"
                placeholder="Grape" aria-label="Grape"
                value={wineForm.grape}
                onChange={(event) => setWineForm({ ...wineForm, grape: event.target.value })}
              />
            </div>
            <div>
              <label className="field-label">ABV %</label>
              <input
                className="field-refined w-full"
                type="number"
                step={0.1}
                min={5}
                max={20}
                placeholder="ABV %" aria-label="ABV %"
                value={wineForm.abv}
                onChange={(event) => setWineForm({ ...wineForm, abv: event.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">Body</label>
              <select
                className="field-refined w-full"
                aria-label="Wine body"
                value={wineForm.body}
                onChange={(event) =>
                  setWineForm({ ...wineForm, body: event.target.value as WineBody })
                }
              >
                {bodyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Acidity</label>
              <select
                className="field-refined w-full"
                aria-label="Wine acidity"
                value={wineForm.acidity}
                onChange={(event) =>
                  setWineForm({ ...wineForm, acidity: event.target.value as WineAcidity })
                }
              >
                {acidityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Tannin</label>
              <select
                className="field-refined w-full"
                aria-label="Wine tannin"
                value={wineForm.tannin}
                onChange={(event) =>
                  setWineForm({ ...wineForm, tannin: event.target.value as WineTannin })
                }
              >
                {tanninOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Serving °C</label>
              <input
                className="field-refined w-full"
                placeholder="Serving temp C (e.g. 8-10)" aria-label="Serving temp C (e.g. 8-10)"
                value={wineForm.servingTempC}
                onChange={(event) =>
                  setWineForm({ ...wineForm, servingTempC: event.target.value })
                }
              />
            </div>
            <div>
              <label className="field-label">Decant</label>
              <input
                className="field-refined w-full"
                placeholder="Decant notes" aria-label="Decant notes"
                value={wineForm.decant}
                onChange={(event) => setWineForm({ ...wineForm, decant: event.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea
              className="field-refined min-h-16 w-full"
              placeholder="Wine description" aria-label="Wine description"
              value={wineForm.description}
              onChange={(event) => setWineForm({ ...wineForm, description: event.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={addWine}
            className="pitch-cta-primary mt-1 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
          >
            + Add Wine
          </button>
        </div>
      </div>

      {/* Existing entries */}
      <div className="mt-5 space-y-4 max-h-[640px] overflow-auto pr-1">
        {dataset.wines.map((wine, idx) => (
          <div
            key={wine.id}
            className="rounded-xl border border-[rgba(199,159,105,0.14)] bg-[#0b1f44]/40 p-4 transition hover:border-[rgba(199,159,105,0.30)]"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-[rgba(199,159,105,0.12)] pb-2">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-sm italic text-[var(--color-accent-gold)]">
                  {toRoman(idx + 1)}.
                </span>
                <span className="font-serif text-base italic text-[#f4efe9]">
                  {t(wine.name, locale) || "Untitled"}
                </span>
                <span className="font-serif text-[10px] italic tracking-wider text-[#c79f69]/70 uppercase">
                  {wine.region} · {wine.year}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeWine(wine.id)}
                className="inline-flex min-h-[40px] items-center rounded-full border border-rose-500/30 bg-rose-900/15 px-3.5 py-2 text-[11px] font-semibold tracking-wider text-rose-300 uppercase transition hover:bg-rose-900/30"
              >
                Delete
              </button>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-2">
              <input
                className="field-refined w-full"
                placeholder="EN name" aria-label="EN name"
                value={wine.name.en}
                onChange={(event) =>
                  updateWine(wine.id, { name: setLocalized(wine.name, "en", event.target.value) })
                }
              />
              <input
                className="field-refined w-full"
                placeholder="PL nazwa" aria-label="PL nazwa"
                value={wine.name.pl}
                onChange={(event) =>
                  updateWine(wine.id, { name: setLocalized(wine.name, "pl", event.target.value) })
                }
              />
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input
                className="field-refined w-full"
                aria-label="Wine region"
                value={wine.region}
                onChange={(event) => updateWine(wine.id, { region: event.target.value })}
              />
              <input
                className="field-refined w-full"
                type="number"
                min={1900}
                max={2100}
                aria-label="Vintage year"
                value={wine.year}
                onChange={(event) => updateWine(wine.id, { year: Number(event.target.value) || 2021 })}
              />
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input
                className="field-refined w-full"
                type="number"
                min={1}
                aria-label="Wine price"
                value={wine.price}
                onChange={(event) => updateWine(wine.id, { price: Math.max(1, Number(event.target.value) || 1) })}
              />
              <input
                className="field-refined w-full"
                type="number"
                min={1}
                max={5}
                step={0.1}
                aria-label="Wine rating (1-5)"
                value={wine.rating}
                onChange={(event) =>
                  updateWine(wine.id, { rating: Math.min(5, Math.max(1, Number(event.target.value) || 4)) })
                }
              />
            </div>
            <input
              className="field-refined mb-2 w-full min-w-0"
              aria-label="Wine image URL"
              value={wine.image}
              onChange={(event) => updateWine(wine.id, { image: event.target.value })}
            />
            <input
              className="field-refined mb-2 w-full"
              aria-label="Wine tags (comma separated)"
              value={toTagInput(wine.tags)}
              onChange={(event) => updateWine(wine.id, { tags: parseTags(event.target.value) })}
            />
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input
                className="field-refined w-full"
                aria-label="Grape variety"
                value={wine.passport.grape}
                onChange={(event) =>
                  updateWine(wine.id, {
                    passport: { ...wine.passport, grape: event.target.value || "Blend" },
                  })
                }
              />
              <input
                className="field-refined w-full"
                type="number"
                min={5}
                max={20}
                step={0.1}
                aria-label="ABV %"
                value={wine.passport.abv}
                onChange={(event) =>
                  updateWine(wine.id, {
                    passport: {
                      ...wine.passport,
                      abv: Math.max(5, Math.min(20, Number(event.target.value) || 13)),
                    },
                  })
                }
              />
            </div>
            <div className="mb-2 grid grid-cols-3 gap-2">
              <select
                className="field-refined w-full"
                value={wine.passport.body}
                aria-label="Passport body"
                onChange={(event) =>
                  updateWine(wine.id, {
                    passport: { ...wine.passport, body: event.target.value as WineBody },
                  })
                }
              >
                {bodyOptions.map((option) => (
                  <option key={option} value={option}>
                    Body: {option}
                  </option>
                ))}
              </select>
              <select
                className="field-refined w-full"
                aria-label="Passport acidity"
                value={wine.passport.acidity}
                onChange={(event) =>
                  updateWine(wine.id, {
                    passport: { ...wine.passport, acidity: event.target.value as WineAcidity },
                  })
                }
              >
                {acidityOptions.map((option) => (
                  <option key={option} value={option}>
                    Acidity: {option}
                  </option>
                ))}
              </select>
              <select
                className="field-refined w-full"
                aria-label="Passport tannin"
                value={wine.passport.tannin}
                onChange={(event) =>
                  updateWine(wine.id, {
                    passport: { ...wine.passport, tannin: event.target.value as WineTannin },
                  })
                }
              >
                {tanninOptions.map((option) => (
                  <option key={option} value={option}>
                    Tannin: {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input
                className="field-refined w-full"
                aria-label="Serving temperature °C"
                value={wine.passport.servingTempC}
                onChange={(event) =>
                  updateWine(wine.id, {
                    passport: {
                      ...wine.passport,
                      servingTempC: event.target.value || "10-14",
                    },
                  })
                }
              />
              <input
                className="field-refined w-full"
                aria-label="Decanting note"
                value={wine.passport.decant}
                onChange={(event) =>
                  updateWine(wine.id, {
                    passport: { ...wine.passport, decant: event.target.value || "No decant." },
                  })
                }
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <textarea
                className="field-refined min-h-14 w-full min-w-0"
                placeholder="EN description" aria-label="EN description"
                value={wine.description.en}
                onChange={(event) =>
                  updateWine(wine.id, {
                    description: setLocalized(wine.description, "en", event.target.value),
                  })
                }
              />
              <textarea
                className="field-refined min-h-14 w-full min-w-0"
                placeholder="PL opis" aria-label="PL opis"
                value={wine.description.pl}
                onChange={(event) =>
                  updateWine(wine.id, {
                    description: setLocalized(wine.description, "pl", event.target.value),
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
