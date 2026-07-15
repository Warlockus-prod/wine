"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { METHOD_STEPS, FAQ_ITEMS } from "@/data/wine-compass-kb";
import type { CompassProfile } from "@/components/winocompas/TasteCompass";

// 2-stage flow lives in this client component; load lazily - keeps the
// hero static-renderable and the heavy SVG/dot pickers off the critical
// path until the user scrolls.
const StagedTutorial = dynamic(() => import("@/components/winocompas/StagedTutorial"), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] animate-pulse rounded-2xl border border-white/8 bg-white/3" />
  ),
});

const FloatingTasteChat = dynamic(() => import("@/components/winocompas/FloatingTasteChat"), {
  ssr: false,
});

const PROFILE_STORAGE_KEY = "wn_compass_profile_v1";
const CHAT_DISABLED_KEY = "wn_chat_disabled_v1";

export default function SamouczekClient() {
  const [profile, setProfile] = useState<CompassProfile>({});
  const [chatDisabled, setChatDisabled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Hydrate persisted state in useEffect (NOT lazy useState) so SSR and
  // first-client-render produce identical HTML - hydration-mismatch-free.
  // The lint rule `react-hooks/set-state-in-effect` flags this; it's a
  // false positive for the "external-store hydration" case (per React 19
  // docs, equivalent to a network fetch) - keeping the disable.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      const disabled = window.localStorage.getItem(CHAT_DISABLED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CompassProfile;
        if (parsed && typeof parsed === "object") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setProfile(parsed);
        }
      }
      if (disabled === "1") {
        setChatDisabled(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  }, [profile]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CHAT_DISABLED_KEY, chatDisabled ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [chatDisabled]);

  return (
    <div className="pitch-grain mobile-safe-bottom min-h-screen bg-background-dark text-[color:var(--ink)]">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        {/* ───────── HERO ───────── */}
        <section
          aria-labelledby="hero-title"
          className="editorial-hero relative overflow-hidden rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_10%_20%,rgba(199,159,105,0.18),transparent_45%),radial-gradient(circle_at_90%_85%,rgba(199,159,105,0.18),transparent_45%),linear-gradient(180deg,#122a52_0%,#081634_100%)] px-5 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20"
        >
          <span className="pitch-eyebrow pitch-eyebrow--start">Samouczek Vinokompas</span>
          <h1
            id="hero-title"
            className="pitch-display mt-6 text-[clamp(2.2rem,6vw,4.4rem)] text-white"
          >
            3 etapy.{" "}
            <em className="block">Każde wino dopasowane.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-[1.7] text-[color:var(--ink-soft)] sm:text-lg">
            Vinokompas to system, w którym każdy znajdzie swoje wino w 3 prostych krokach.
            Zaczynasz od smaku, dorzucasz sześć wrażeń, a jeśli chcesz - dostrajasz dwanaście aromatów.
            Po każdym etapie zobaczysz wina dopasowane do twojego profilu.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#kompas" className="pitch-cta-primary">
              Rozpocznij test
              <svg width="14" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
                <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <Link href="/pairing" className="pitch-cta-ghost">
              Otwórz Pairing
            </Link>
          </div>
          <p className="mt-8 max-w-md font-serif text-xs italic tracking-wide text-[var(--color-accent-gold)] opacity-80">
            Metoda za zgodą i w hołdzie Magdalenie Surgiel-Czyż / parfumealavin / vinocompas.pl
          </p>
        </section>

        <Ornament />

        {/* ───────── STAGED TUTORIAL ───────── */}
        <section
          id="kompas"
          aria-label="Winokompas"
          className="scroll-mt-[6.5rem]"
        >
          <StagedTutorial
            profile={profile}
            onProfileChange={setProfile}
            chatDisabled={chatDisabled}
            onChatDisabledChange={setChatDisabled}
          />
        </section>

        <Ornament />

        {/* ───────── METODA - 6 STEPS ───────── */}
        <section aria-labelledby="metoda-title" className="scroll-mt-[6.5rem]">
          <header className="mb-10 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">II.</span>
            <div>
              <h2 id="metoda-title" className="pitch-display text-[clamp(1.8rem,4.4vw,3rem)] text-white">
                Metoda degustacji
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[color:var(--ink-soft)]">
                Sześć kroków, dzięki którym przestaniesz „tylko pić” a zaczniesz nazywać wrażenia.
              </p>
            </div>
          </header>

          <ol className="space-y-4">
            {METHOD_STEPS.map((step, i) => (
              <li
                key={step.id}
                className="grid gap-4 rounded-3xl border border-white/8 bg-[#081634] p-5 transition-colors duration-500 hover:border-[rgba(199,159,105,0.32)] sm:p-7 lg:grid-cols-[7rem_minmax(0,1fr)] lg:items-start lg:gap-10"
              >
                <span className="pitch-display text-4xl text-[var(--color-accent-gold)] sm:text-5xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="pitch-display text-xl text-white sm:text-2xl">{step.title_pl}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink-soft)] sm:text-base">{step.body_pl}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <Ornament />

        {/* ───────── FAQ ───────── */}
        <section aria-labelledby="faq-title" className="scroll-mt-[6.5rem]">
          <header className="mb-10 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">III.</span>
            <div>
              <h2 id="faq-title" className="pitch-display text-[clamp(1.8rem,4.4vw,3rem)] text-white">
                Pytania i odpowiedzi
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[color:var(--ink-soft)]">
                Najczęstsze wątpliwości. Jeśli czegoś brakuje - włącz czat przy scenariuszu i zapytaj przewodnika.
              </p>
            </div>
          </header>

          <ul className="border-t border-[rgba(199,159,105,0.18)]">
            {FAQ_ITEMS.map((item, i) => {
              const open = i === openFaq;
              return (
                <li key={i} className="border-b border-[rgba(199,159,105,0.18)]">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="group flex w-full items-start gap-2 py-5 text-left transition-colors hover:bg-[rgba(199,159,105,0.04)] sm:py-6"
                  >
                    <span className="pitch-faq-marker pt-1">{String(i + 1).padStart(2, "0")}.</span>
                    <span className="pitch-faq-q">{item.q_pl}</span>
                    <span
                      aria-hidden
                      className="ml-3 mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(199,159,105,0.32)] text-[var(--color-accent-gold)] transition-transform duration-500"
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
                        <p className="pitch-dropcap text-sm leading-relaxed text-[color:var(--ink-soft)] sm:text-base">{item.a_pl}</p>
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
          className="editorial-hero editorial-hero--center relative overflow-hidden rounded-[36px] border border-[rgba(199,159,105,0.32)] bg-[radial-gradient(circle_at_50%_120%,rgba(199,159,105,0.32),transparent_60%),linear-gradient(180deg,#122a52,#081634)] px-5 py-16 text-center sm:px-10 sm:py-20"
        >
          <span className="pitch-eyebrow">Gotowe?</span>
          <h2
            id="final-title"
            className="pitch-display mx-auto mt-6 max-w-3xl text-[clamp(1.8rem,5vw,3.6rem)] text-white"
          >
            Twój profil jest zapisany. Czas znaleźć wina.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[color:var(--ink-soft)]">
            Otwórz widok Pairing i wybierz danie - zobaczysz top-3 win z karty restauracji, dopasowane do tego co właśnie wskazałeś na kompasie.
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

      {/* Floating persistent chat - hidden when user has disabled it via
          the toggle inside <StagedTutorial>. */}
      <FloatingTasteChat profile={profile} disabled={chatDisabled} />
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
