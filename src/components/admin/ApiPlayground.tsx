import type { Dispatch, SetStateAction } from "react";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import type { PairingDataset, PairingDish, PairingWine } from "@/types/pairing";
import type { ApiResponse, ApiStatus } from "./shared";

type ApiPlaygroundProps = {
  dataset: PairingDataset;
  locale: Locale;
  effectiveDishId: string;
  setApiDishId: Dispatch<SetStateAction<string>>;
  effectiveWineIds: string[];
  setApiSelectedWineIds: Dispatch<SetStateAction<string[]>>;
  apiStatus: ApiStatus;
  apiResponse: ApiResponse | null;
  runApiPairing: () => void;
  selectedDish: PairingDish | null;
  selectedWines: PairingWine[];
};

export default function ApiPlayground({
  dataset,
  locale,
  effectiveDishId,
  setApiDishId,
  effectiveWineIds,
  setApiSelectedWineIds,
  apiStatus,
  apiResponse,
  runApiPairing,
  selectedDish,
  selectedWines,
}: ApiPlaygroundProps) {
  return (
    <section className="mt-8 rounded-2xl border border-[rgba(199,159,105,0.14)] bg-[#060e22] p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[rgba(199,159,105,0.14)] pb-3">
        <div>
          <p className="pitch-eyebrow">Workshop · IV</p>
          <h2 className="font-mono text-base text-[var(--color-accent-gold)]">
            <span className="text-gray-500">$</span> /api/pairing
          </h2>
          <p className="mt-1 font-mono text-[11px] text-gray-500">
            Run live pairing API with current dataset payload.
          </p>
        </div>
        <button
          type="button"
          onClick={runApiPairing}
          className="rounded-md border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-4 py-2 font-mono text-xs font-semibold text-[var(--color-accent-gold)] transition hover:bg-[var(--color-accent-gold)]/20"
        >
          {apiStatus === "loading" ? "▸ running…" : "▸ execute"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
        <article className="terminal-block min-w-0">
          <p className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
            <span className="prompt">›</span> dish
          </p>
          <select
            className="mt-2 w-full rounded border border-[rgba(199,159,105,0.18)] bg-[#0d0809] px-3 py-2 font-mono text-xs text-[#d4cabc]"
            value={effectiveDishId}
            onChange={(event) => setApiDishId(event.target.value)}
          >
            {dataset.dishes.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {t(dish.name, locale)}
              </option>
            ))}
          </select>
        </article>

        <article className="terminal-block min-w-0">
          <p className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
            <span className="prompt">›</span> wines[ ]
          </p>
          <div className="mt-2 max-h-44 space-y-1.5 overflow-auto pr-1">
            {dataset.wines.map((wine) => {
              const checked = effectiveWineIds.includes(wine.id);
              return (
                <label
                  key={wine.id}
                  className="flex cursor-pointer items-center gap-2 font-mono text-xs text-[#d4cabc]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setApiSelectedWineIds((current) =>
                        checked
                          ? current.filter((id) => id !== wine.id)
                          : [...current, wine.id],
                      );
                    }}
                    className="accent-[var(--color-accent-gold)]"
                  />
                  <span>{t(wine.name, locale)}</span>
                </label>
              );
            })}
          </div>
        </article>

        <article className="terminal-block min-w-0">
          <p className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
            <span className="prompt">›</span> response
          </p>
          <div className="mt-2 space-y-2">
            {apiResponse?.matches?.length ? (
              apiResponse.matches.map((item) => {
                const wineMatch = dataset.wines.find((wine) => wine.id === item.wineId);
                const wineName = wineMatch ? t(wineMatch.name, locale) : item.wineId;
                return (
                  <div
                    key={item.wineId}
                    className="rounded border border-[var(--color-accent-gold)]/25 bg-[var(--color-accent-gold)]/5 p-2"
                  >
                    <p className="font-mono text-xs text-[#f4efe9]">
                      <span className="num">{item.score}%</span>{" "}
                      <span className="str">{wineName}</span>
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-gray-400">{item.reason}</p>
                  </div>
                );
              })
            ) : apiResponse?.error ? (
              <p className="rounded border border-rose-500/30 bg-rose-900/10 p-2 font-mono text-xs text-rose-300">
                ✗ {apiResponse.error}
              </p>
            ) : (
              <p className="font-mono text-xs text-gray-500">
                {apiStatus === "loading" ? "// awaiting response…" : "// idle"}
              </p>
            )}
          </div>

          <pre className="mt-3 hidden max-h-40 w-full max-w-full overflow-auto whitespace-pre-wrap break-all rounded border border-[rgba(199,159,105,0.10)] bg-[#0d0809] p-2 font-mono text-[10px] text-gray-500 sm:block">
            {JSON.stringify(
              {
                dish: selectedDish,
                wines: selectedWines,
                response: apiResponse,
              },
              null,
              2,
            )}
          </pre>
        </article>
      </div>
    </section>
  );
}
