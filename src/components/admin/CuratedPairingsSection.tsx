import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";
import TendrilCorner from "./TendrilCorner";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import type { CuratedPairing, PairingDataset } from "@/types/pairing";

type CuratedPairingsSectionProps = {
  dataset: PairingDataset;
  locale: Locale;
  effectivePairingDishId: string;
  setPairingDishId: Dispatch<SetStateAction<string>>;
  pairingsByWineId: Map<string, CuratedPairing>;
  togglePairing: (wineId: string) => void;
  updatePairingReason: (wineId: string, lang: Locale, value: string) => void;
};

export default function CuratedPairingsSection({
  dataset,
  locale,
  effectivePairingDishId,
  setPairingDishId,
  pairingsByWineId,
  togglePairing,
  updatePairingReason,
}: CuratedPairingsSectionProps) {
  const tx = useTranslations("admin");

  return (
    <section className="surface-parchment editorial-frame relative mt-6 overflow-hidden rounded-2xl p-5 sm:p-7">
      <TendrilCorner side="left" />
      <header className="relative z-10 mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[rgba(199,159,105,0.18)] pb-3">
        <div>
          <p className="pitch-eyebrow">Sommelier&rsquo;s Notes · III</p>
          <h2 className="pitch-display mt-1 text-3xl text-white">{tx("curatedPairings.title")}</h2>
          <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]/85">
            {tx("curatedPairings.subtitle")}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="field-label">Dish</span>
          <select
            className="field-refined min-w-[14rem]"
            value={effectivePairingDishId}
            onChange={(event) => setPairingDishId(event.target.value)}
          >
            {dataset.dishes.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {t(dish.name, locale)}
              </option>
            ))}
          </select>
        </div>
      </header>

      {dataset.dishes.length === 0 ? (
        <p className="rounded-xl border border-[rgba(199,159,105,0.18)] bg-[#0b1f44]/55 p-3 text-sm italic text-[#e6e1d6]">
          {tx("curatedPairings.noDishes")}
        </p>
      ) : (
        <div className="relative z-10 grid gap-3 md:grid-cols-2">
          {dataset.wines.map((wine) => {
            const curated = pairingsByWineId.get(wine.id);
            const selected = Boolean(curated);
            return (
              <div
                key={wine.id}
                className={`rounded-xl border p-3 transition ${
                  selected
                    ? "border-[rgba(199,159,105,0.55)] bg-[var(--color-accent-gold)]/10"
                    : "border-[rgba(199,159,105,0.16)] bg-[#0b1f44]/40 hover:border-[rgba(199,159,105,0.30)]"
                }`}
              >
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => togglePairing(wine.id)}
                    className="h-4 w-4 cursor-pointer accent-[var(--color-accent-gold)]"
                  />
                  <span
                    className={`font-serif italic ${
                      selected ? "text-[#f4efe9]" : "text-[#e6e1d6]/85"
                    }`}
                  >
                    {t(wine.name, locale)}
                  </span>
                  <span className="ml-auto font-serif text-[10px] italic tracking-[0.18em] text-[#c79f69]/70 uppercase">
                    {wine.region}
                  </span>
                </label>
                {selected && curated ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <textarea
                      className="field-refined min-h-20 w-full"
                      placeholder={tx("curatedPairings.reasonEnPlaceholder")}
                      value={curated.reason.en}
                      onChange={(event) =>
                        updatePairingReason(wine.id, "en", event.target.value)
                      }
                    />
                    <textarea
                      className="field-refined min-h-20 w-full"
                      placeholder={tx("curatedPairings.reasonPlPlaceholder")}
                      value={curated.reason.pl}
                      onChange={(event) =>
                        updatePairingReason(wine.id, "pl", event.target.value)
                      }
                    />
                  </div>
                ) : (
                  <p className="mt-2 font-serif text-xs italic text-[#c79f69]/60">
                    {tx("curatedPairings.notCurated")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
