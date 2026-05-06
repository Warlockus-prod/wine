"use client";

/**
 * CompassExplorer — three-level interactive view of the Vinokompas:
 *
 *   Level 1: 6 wrażeń (sektorów)        — overview cards, color chips
 *   Level 2: 12 tendencji (per sector)   — exposed when sector is opened
 *   Level 3: associations + examples    — exposed when tendencja is opened
 *
 * Pairs with <TasteCompass> on the same page: tapping a sector here syncs
 * focus to the dial via the shared `selectedSector` state lifted to parent
 * (or via callback). Standalone-friendly: works without the dial too.
 *
 * Keyboard:
 *  - Tab through sector cards, Enter / Space to expand.
 *  - Inside expanded sector, Tab through 2 tendencja chips, Enter to drill.
 *  - Esc collapses.
 */

import { useState, useCallback } from "react";
import { COMPASS_SECTORS, type SectorId, type CompassSector, type Tendencja } from "@/data/wine-compass-kb";

interface Props {
  /** Optional sync from external state (e.g. compass dial selection). */
  externalSector?: SectorId | null;
  onSectorChange?: (id: SectorId | null) => void;
}

export default function CompassExplorer({ externalSector, onSectorChange }: Props) {
  const [open, setOpen] = useState<SectorId | null>(externalSector ?? null);
  const [openTendencja, setOpenTendencja] = useState<string | null>(null);

  const toggleSector = useCallback(
    (id: SectorId) => {
      setOpen((prev) => {
        const next = prev === id ? null : id;
        onSectorChange?.(next);
        return next;
      });
      setOpenTendencja(null);
    },
    [onSectorChange],
  );

  return (
    <section
      aria-label="Trzy poziomy Vinokompasu — poznaj od ogółu do szczegółu"
      className="space-y-4"
    >
      <header className="rounded-2xl border border-[rgba(197,160,89,0.22)] bg-[rgba(197,160,89,0.04)] p-5">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
          Trzy poziomy poznania
        </p>
        <h3 className="pitch-display mt-2 text-2xl text-white">
          Od 6 wrażeń, przez 12 tendencji, do konkretnych skojarzeń.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#cbc1b1]">
          Kliknij sektor — rozwiniesz dwie tendencje. Kliknij tendencję — zobaczysz konkretne skojarzenia, w jakich winach je znajdziesz, i jak je rozpoznać przy stole.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {COMPASS_SECTORS.map((sector) => {
          const isOpen = open === sector.id;
          return (
            <SectorCard
              key={sector.id}
              sector={sector}
              isOpen={isOpen}
              openTendencja={isOpen ? openTendencja : null}
              onToggle={() => toggleSector(sector.id)}
              onTendencja={(id) => setOpenTendencja((prev) => (prev === id ? null : id))}
            />
          );
        })}
      </div>
    </section>
  );
}

function SectorCard({
  sector,
  isOpen,
  openTendencja,
  onToggle,
  onTendencja,
}: {
  sector: CompassSector;
  isOpen: boolean;
  openTendencja: string | null;
  onToggle: () => void;
  onTendencja: (id: string) => void;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border transition-colors duration-500 ${
        isOpen
          ? "border-white/22 bg-[#1a0f12]"
          : "border-white/10 bg-[#150a0c] hover:border-white/20"
      }`}
      style={{
        boxShadow: isOpen
          ? `inset 0 0 0 1px ${sector.color}33, 0 18px 44px rgba(0,0,0,0.32)`
          : undefined,
      }}
    >
      {/* Top — sector header (always visible, click to expand) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-white/4"
      >
        <span
          aria-hidden
          className="relative block h-10 w-10 shrink-0 rounded-full transition-transform duration-500"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${sector.color}, ${sector.color}55)`,
            transform: isOpen ? "scale(1.1)" : "scale(1)",
            boxShadow: isOpen ? `0 0 0 6px ${sector.color}1f` : "none",
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="pitch-roman text-[10px]">{sector.noun_pl}</p>
          <h4 className="pitch-display mt-0.5 text-2xl text-white">{sector.name_pl}</h4>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#cbc1b1]">
            {sector.short_pl}
          </p>
        </div>
        <span
          aria-hidden
          className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(197,160,89,0.35)] text-[var(--color-accent-gold)] transition-transform duration-500"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {/* Level 2 — tendencje (revealed on expand) */}
      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        aria-hidden={!isOpen}
      >
        <div className="min-h-0">
          <div className="space-y-2 border-t border-white/8 px-5 py-4">
            {sector.tendencje.map((t, i) => (
              <TendencjaRow
                key={t.id}
                t={t}
                index={i + 1}
                color={sector.color}
                isOpen={openTendencja === t.id}
                onToggle={() => onTendencja(t.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function TendencjaRow({
  t,
  index,
  color,
  isOpen,
  onToggle,
}: {
  t: Tendencja;
  index: number;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-2xl border bg-black/24 transition-colors"
      style={{
        borderColor: isOpen ? `${color}88` : "rgba(255,255,255,0.08)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span
          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ background: color, color: "#ffffff" }}
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{t.name_pl}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#cbc1b1]">
            {t.associations_pl}
          </p>
        </div>
        <span
          aria-hidden
          className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-accent-gold)] transition-transform duration-500"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Level 3 — associations + examples (revealed on tendencja open) */}
      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        aria-hidden={!isOpen}
      >
        <div className="min-h-0">
          <div className="space-y-3 border-t border-white/8 px-4 pt-3 pb-4">
            <Detail label="Konkretne skojarzenia" body={t.associations_pl} />
            <Detail label="Jak rozpoznać" body={t.examples_pl} />
            <Detail label="W jakich winach" body={t.found_in_pl} accent={color} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent?: string;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-bold tracking-[0.22em] uppercase"
        style={{ color: accent ?? "rgba(197,160,89,0.85)" }}
      >
        {label}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[#d4cabc]">{body}</p>
    </div>
  );
}
