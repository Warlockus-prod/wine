import type { Dispatch, SetStateAction } from "react";
import SavedPill from "./SavedPill";
import TendrilCorner from "./TendrilCorner";
import type { PairingDataset } from "@/types/pairing";

type AtelierHeaderProps = {
  dataset: PairingDataset;
  statusText: string;
  statusKey: number;
  importText: string;
  setImportText: Dispatch<SetStateAction<string>>;
  exportJson: () => void;
  importJson: () => void;
  resetAll: () => void;
};

export default function AtelierHeader({
  dataset,
  statusText,
  statusKey,
  importText,
  setImportText,
  exportJson,
  importJson,
  resetAll,
}: AtelierHeaderProps) {
  return (
    <section
      className="editorial-frame pitch-grain relative mt-6 overflow-hidden rounded-2xl border border-[rgba(199,159,105,0.18)] bg-[#081634]/85 p-6 sm:p-8"
    >
      <TendrilCorner side="right" />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="pitch-eyebrow">Piaskownica · Biblioteka</p>
          <h1 className="pitch-display mt-3 text-4xl text-white sm:text-5xl">
            Sommelier&rsquo;s <em className="italic text-[var(--color-accent-gold)]">Atelier</em>
          </h1>
          <div className="pitch-rule pitch-rule--short mt-4" />
          <p className="mt-4 max-w-xl font-serif text-base italic leading-relaxed text-[#e6e1d6]">
            Globalna pracownia łączeń - dodawaj dania i wina, kuruj rekomendacje,
            testuj odpowiedzi modelu API.
          </p>
          <p className="mt-4 inline-flex max-w-xl items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-900/15 px-3 py-2 text-[11px] font-semibold tracking-wide text-amber-200/90 uppercase">
            Piaskownica - zmiany zapisują się tylko lokalnie (localStorage), nie trafiają do bazy ani do gości
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-[rgba(199,159,105,0.22)] bg-[#0b1f44]/70 px-4 py-3">
            <p className="font-serif text-2xl italic text-[var(--color-accent-gold)]">
              {dataset.dishes.length}
            </p>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-gray-400 uppercase">Dishes</p>
          </div>
          <div className="rounded-xl border border-[rgba(199,159,105,0.22)] bg-[#0b1f44]/70 px-4 py-3">
            <p className="font-serif text-2xl italic text-[var(--color-accent-gold)]">
              {dataset.wines.length}
            </p>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-gray-400 uppercase">Wines</p>
          </div>
          <div className="rounded-xl border border-[rgba(199,159,105,0.22)] bg-[#0b1f44]/70 px-4 py-3">
            <p className="font-serif text-2xl italic text-[var(--color-accent-gold)]">
              {dataset.pairings.length}
            </p>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-gray-400 uppercase">Pairings</p>
          </div>
        </div>
      </div>

      {/* Toolbar - cream pill row */}
      <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={exportJson}
          className="rounded-full border border-[rgba(199,159,105,0.35)] bg-[#0b1f44] px-4 py-2 text-xs font-semibold tracking-wider text-[#f4efe9] uppercase transition hover:bg-[#1f1316]"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={importJson}
          className="rounded-full border border-[rgba(199,159,105,0.55)] bg-[var(--color-accent-gold)]/15 px-4 py-2 text-xs font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:bg-[var(--color-accent-gold)]/25"
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-full border border-rose-500/30 bg-rose-900/20 px-4 py-2 text-xs font-semibold tracking-wider text-rose-300 uppercase transition hover:bg-rose-900/30"
        >
          Reset to Seed
        </button>

        {statusText ? (
          <span key={statusKey} className="ml-auto">
            <SavedPill text={statusText} />
          </span>
        ) : null}
      </div>

      <textarea
        className="field-refined relative z-10 mt-4 min-h-28 w-full"
        placeholder='Paste JSON like { "dishes": [...], "wines": [...] }'
        aria-label="Import JSON"
        value={importText}
        onChange={(event) => setImportText(event.target.value)}
      />
    </section>
  );
}
