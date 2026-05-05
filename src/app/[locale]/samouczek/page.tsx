"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import {
  COMPASS_SECTORS,
  BASE_TASTES,
  METHOD_STEPS,
  FAQ_ITEMS,
} from "@/data/wine-compass-kb";
import type { CompassProfile } from "@/components/winocompas/TasteCompass";

// Compass uses inline SVG; safe for SSR but the legend uses useState.
// Loading client-only to keep page snappy and consistent.
const TasteCompass = dynamic(() => import("@/components/winocompas/TasteCompass"), {
  ssr: false,
  loading: () => (
    <div className="aspect-square w-full max-w-[420px] animate-pulse rounded-full bg-white/5" />
  ),
});

const TasteChat = dynamic(() => import("@/components/winocompas/TasteChat"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-white/5" />,
});

export default function SamouczekPage() {
  const [profile, setProfile] = useState<CompassProfile>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="pitch-grain mobile-safe-bottom min-h-screen bg-background-dark text-[#f4ede0]">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        {/* ───────── HERO ───────── */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_10%_20%,rgba(209,21,52,0.18),transparent_45%),radial-gradient(circle_at_90%_85%,rgba(197,160,89,0.18),transparent_45%),linear-gradient(180deg,#1d1013_0%,#120709_100%)] px-5 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20"
        >
          <span className="pitch-eyebrow pitch-eyebrow--start">Samouczek Vinokompas</span>
          <h1
            id="hero-title"
            className="pitch-display mt-6 text-[clamp(2.2rem,6vw,4.4rem)] text-white"
          >
            6 wrażeń.{" "}
            <em className="block">3 smaki. Każde wino.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-[1.7] text-[#d4cabc] sm:text-lg">
            Vinokompas to system opisu wina, który tłumaczy degustację na język, który każdy zrozumie. Sześć wrażeń, każde z dwoma tendencjami, plus trzy podstawowe smaki — i już potrafisz opisać każde wino i znaleźć podobne do tych, które lubisz.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#kompas" className="pitch-cta-primary">
              Wypróbuj kompas
              <svg width="14" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
                <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#chat" className="pitch-cta-ghost">
              Zapytaj przewodnika
            </a>
          </div>
          <p className="mt-8 max-w-md font-serif text-xs italic tracking-wide text-[var(--color-accent-gold)] opacity-80">
            Metoda za zgodą i w hołdzie Magdalenie Surgiel-Czyż / parfumealavin / vinocompas.pl
          </p>
        </section>

        <Ornament />

        {/* ───────── COMPASS + CHAT (the two interactive halves) ───────── */}
        <section
          id="kompas"
          aria-labelledby="kompas-title"
          className="scroll-mt-24"
        >
          <header className="mb-10 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">I.</span>
            <div>
              <h2 id="kompas-title" className="pitch-display text-[clamp(1.8rem,4.4vw,3rem)] text-white">
                Twój kompas smaku
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                Dotknij sektor i wskaż intensywność każdej tendencji (od 0 do 4).
                Im jaśniej zaznaczysz — tym mocniej dane wrażenie obecne w winie. Profil zostaje zapisany lokalnie w przeglądarce.
              </p>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[420px]">
                <TasteCompass profile={profile} onChange={setProfile} />
              </div>

              {/* 3 base smaki — independent sliders below the compass */}
              <div className="mt-6 w-full max-w-[420px] rounded-2xl border border-white/8 bg-black/25 p-4">
                <p className="mb-3 text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                  3 podstawowe smaki
                </p>
                <div className="space-y-3">
                  {BASE_TASTES.map((t) => (
                    <BaseSmakSlider
                      key={t.id}
                      id={t.id}
                      label={t.name_pl}
                      description={t.description_pl}
                      value={(profile[`base.${t.id}`] ?? 0) as number}
                      onChange={(v) =>
                        setProfile({ ...profile, [`base.${t.id}`]: v as 0 | 1 | 2 | 3 | 4 })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            <div id="chat" className="scroll-mt-24">
              <TasteChat profile={profile} />
            </div>
          </div>

          {/* Take it further */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(197,160,89,0.28)] bg-[#170d0f] p-5">
            <div>
              <p className="text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                Krok dalej
              </p>
              <p className="mt-1 font-serif text-base italic text-white">
                Zapisany profil zadziała w widoku Pairing — zobacz wina dopasowane do twojego smaku.
              </p>
            </div>
            <Link href="/pairing" className="pitch-cta-primary">
              Otwórz Pairing
              <svg width="14" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
                <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>

        <Ornament />

        {/* ───────── METODA — 6 STEPS ───────── */}
        <section aria-labelledby="metoda-title" className="scroll-mt-24">
          <header className="mb-10 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">II.</span>
            <div>
              <h2 id="metoda-title" className="pitch-display text-[clamp(1.8rem,4.4vw,3rem)] text-white">
                Metoda degustacji
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                Sześć kroków, dzięki którym przestaniesz „tylko pić” a zaczniesz nazywać wrażenia.
              </p>
            </div>
          </header>

          <ol className="space-y-4">
            {METHOD_STEPS.map((step, i) => (
              <li
                key={step.id}
                className="grid gap-4 rounded-3xl border border-white/8 bg-[#150a0c] p-5 transition-colors duration-500 hover:border-[rgba(197,160,89,0.32)] sm:p-7 lg:grid-cols-[7rem_minmax(0,1fr)] lg:items-start lg:gap-10"
              >
                <span className="pitch-display text-4xl text-[var(--color-accent-gold)] sm:text-5xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="pitch-display text-xl text-white sm:text-2xl">{step.title_pl}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#cbc1b1] sm:text-base">{step.body_pl}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Ornament />

        {/* ───────── 6 WRAŻEŃ — DETAILED CHAPTERS ───────── */}
        <section aria-labelledby="wrazenia-title" className="scroll-mt-24">
          <header className="mb-10 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">III.</span>
            <div>
              <h2 id="wrazenia-title" className="pitch-display text-[clamp(1.8rem,4.4vw,3rem)] text-white">
                Sześć wrażeń
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                Każde wino można opisać używając kilku z nich. Każde wrażenie ma 2 tendencje — to cała filozofia.
              </p>
            </div>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COMPASS_SECTORS.map((sector) => (
              <article
                key={sector.id}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#150a0c] p-5 transition-colors hover:border-white/24"
                style={{
                  background: `radial-gradient(circle at 100% 0%, ${sector.color}26, transparent 60%), #150a0c`,
                }}
              >
                <span
                  className="absolute right-4 top-4 inline-block h-3 w-3 rounded-full"
                  style={{ background: sector.color }}
                  aria-hidden
                />
                <p className="pitch-roman text-[0.72rem]">{sector.noun_pl}</p>
                <h3 className="pitch-display mt-2 text-2xl text-white">{sector.name_pl}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#cbc1b1]">{sector.short_pl}</p>

                <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                  {sector.tendencje.map((t, ti) => (
                    <div key={t.id}>
                      <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: sector.color }}>
                        {ti + 1}) {t.name_pl}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#cbc1b1]">
                        {t.associations_pl}
                      </p>
                      <p className="mt-1 text-[11px] italic text-gray-500">{t.found_in_pl}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <Ornament />

        {/* ───────── FAQ ───────── */}
        <section aria-labelledby="faq-title" className="scroll-mt-24">
          <header className="mb-10 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">IV.</span>
            <div>
              <h2 id="faq-title" className="pitch-display text-[clamp(1.8rem,4.4vw,3rem)] text-white">
                Pytania i odpowiedzi
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                Najczęstsze wątpliwości. Jeśli czegoś brakuje — zapytaj przewodnika powyżej.
              </p>
            </div>
          </header>

          <ul className="border-t border-[rgba(197,160,89,0.18)]">
            {FAQ_ITEMS.map((item, i) => {
              const open = i === openFaq;
              return (
                <li key={i} className="border-b border-[rgba(197,160,89,0.18)]">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="group flex w-full items-start gap-2 py-5 text-left transition-colors hover:bg-[rgba(197,160,89,0.04)] sm:py-6"
                  >
                    <span className="pitch-faq-marker pt-1">{String(i + 1).padStart(2, "0")}.</span>
                    <span className="pitch-faq-q">{item.q_pl}</span>
                    <span
                      aria-hidden
                      className="ml-3 mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(197,160,89,0.32)] text-[var(--color-accent-gold)] transition-transform duration-500"
                      style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="pb-6 pl-[2.4rem] pr-8 sm:pl-[3.4rem]">
                        <p className="text-sm leading-relaxed text-[#d4cabc] sm:text-base">{item.a_pl}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <Ornament />

        {/* ───────── FINAL CTA ───────── */}
        <section
          aria-labelledby="final-title"
          className="relative overflow-hidden rounded-[36px] border border-[rgba(197,160,89,0.32)] bg-[radial-gradient(circle_at_50%_120%,rgba(209,21,52,0.32),transparent_60%),linear-gradient(180deg,#1d1013,#100608)] px-5 py-16 text-center sm:px-10 sm:py-20"
        >
          <span className="pitch-eyebrow">Gotowe?</span>
          <h2
            id="final-title"
            className="pitch-display mx-auto mt-6 max-w-3xl text-[clamp(1.8rem,5vw,3.6rem)] text-white"
          >
            Twój profil jest zapisany. Czas znaleźć wina.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#cbc1b1]">
            Otwórz widok Pairing i wybierz danie — zobaczysz top-3 win z karty restauracji, dopasowane do tego co właśnie wskazałeś na kompasie.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pairing" className="pitch-cta-primary">
              Otwórz Pairing
            </Link>
            <Link href="/" className="pitch-cta-ghost">
              Wróć do restauracji
            </Link>
          </div>
        </section>
      </main>

      <MobileTabBar />
    </div>
  );
}

function Ornament() {
  return (
    <div className="my-16 flex items-center justify-center sm:my-20" aria-hidden>
      <span className="pitch-ornament">· · ·</span>
    </div>
  );
}

function BaseSmakSlider({
  id,
  label,
  description,
  value,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={`bsm-${id}`} className="text-xs font-semibold tracking-wide text-white">
          {label}
        </label>
        <span className="font-mono text-[10px] text-gray-400">{value}/4</span>
      </div>
      <input
        id={`bsm-${id}`}
        type="range"
        min={0}
        max={4}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/8 accent-[var(--color-accent-gold)]"
      />
      <p className="mt-1 text-[11px] leading-snug text-gray-500">{description}</p>
    </div>
  );
}
