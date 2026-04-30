import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { Faq } from "./Faq";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const tx = await getTranslations({ locale, namespace: "pitch" });
  return {
    title: tx("metaTitle"),
    description: tx("metaDescription"),
  };
}

export default async function PitchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const tx = await getTranslations("pitch");

  /* ─────────────── Inline mockups, all SVG / CSS, no external assets ─────────────── */

  const PhoneMockup = (
    <div className="pitch-phone w-[260px] flex-shrink-0">
      <div className="rounded-[26px] bg-[#150a0c] p-3">
        {/* Header pill */}
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-semibold tracking-[0.22em] text-[#f4c1c8] uppercase">
            Pairing
          </span>
          <span className="text-[9px] tracking-[0.22em] text-emerald-300/80 uppercase">
            AI ready
          </span>
        </div>

        {/* Top match card */}
        <div className="mb-3 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/20 to-primary/5 p-3">
          <p className="text-[8px] font-bold tracking-[0.22em] text-[#f4c1c8] uppercase">
            #1 Best Match
          </p>
          <p className="mt-1 text-[13px] font-semibold text-white leading-tight">
            Trimbach Riesling
          </p>
          <p className="text-[10px] text-[#e6d3c0]/80">96% • Alsace, 2020</p>
        </div>

        {/* Sommelier Bot panel */}
        <div className="rounded-2xl border border-[rgba(197,160,89,0.22)] bg-[#170d0f] p-3">
          <div className="mb-3 flex items-center gap-2 border-b border-white/8 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2V5a3 3 0 0 1 3-3Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" /></svg>
            </span>
            <p className="text-[9px] font-bold tracking-[0.22em] text-primary uppercase">
              Sommelier Bot
            </p>
          </div>

          <div className="space-y-2">
            <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-white/10 bg-black/30 px-3 py-2">
              <p className="text-[10px] leading-snug text-gray-100">
                Comparing <span className="font-semibold text-white">Escargots</span> with <span className="font-semibold text-white">Riesling</span>.
              </p>
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-primary/24 bg-primary/12 px-3 py-2">
              <p className="text-[10px] leading-snug text-gray-100">
                Crisp Alsace acidity cuts garlic herb butter with citrus drive.
              </p>
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-white/10 bg-black/30 px-3 py-2">
              <p className="text-[10px] leading-snug text-gray-200">Serve at 8–10°C. No decant.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const MapMockup = (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0f0709] shadow-[0_28px_70px_rgba(0,0,0,0.42)]">
      <div className="pitch-browser-bar">
        <span className="pitch-browser-dot bg-[#ff5f57]" />
        <span className="pitch-browser-dot bg-[#febc2e]" />
        <span className="pitch-browser-dot bg-[#28c840]" />
        <span className="ml-3 truncate rounded-md bg-black/40 px-3 py-1 text-[10px] tracking-wide text-gray-400">
          wine.icoffio.com/pl
        </span>
      </div>
      <div className="relative h-[200px] bg-[radial-gradient(circle_at_30%_20%,rgba(209,21,52,0.16),transparent_40%),radial-gradient(circle_at_75%_70%,rgba(197,160,89,0.12),transparent_40%),linear-gradient(160deg,#1a0e10,#0c0506)]">
        {/* Faux coastline strokes */}
        <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full opacity-25" aria-hidden>
          <path d="M20 140 L60 110 L80 120 L120 90 L160 88 L200 70 L240 82 L270 70 L290 100 L260 130 L220 145 L180 142 L140 150 L100 158 L60 150 Z" stroke="rgba(197,160,89,0.5)" strokeWidth="0.6" fill="rgba(255,255,255,0.04)" />
        </svg>
        {/* Markers */}
        {[
          { left: "22%", top: "55%", label: "Lisbon" },
          { left: "32%", top: "62%", label: "Madrid" },
          { left: "44%", top: "44%", label: "Lyon" },
          { left: "56%", top: "62%", label: "Venice" },
          { left: "62%", top: "20%", label: "Copenhagen" },
        ].map((m, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: m.left, top: m.top }}
            title={m.label}
          >
            <span className="block h-3 w-3 rounded-full border-2 border-white/85 bg-primary shadow-[0_0_0_6px_rgba(209,21,52,0.18)]" />
          </span>
        ))}
        {/* Floating venue card */}
        <div className="absolute right-3 bottom-3 left-3 rounded-xl border border-white/10 bg-[#170d0fec] p-3 backdrop-blur">
          <p className="text-[8px] font-bold tracking-[0.24em] text-primary uppercase">
            Selected
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">Trattoria Bellavista</p>
          <p className="text-[10px] text-gray-400">Venice, Italy · Trattoria</p>
        </div>
      </div>
    </div>
  );

  const AdminMockup = (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#100709] shadow-[0_28px_70px_rgba(0,0,0,0.42)]">
      <div className="border-b border-white/6 bg-[#1a0e10] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold tracking-[0.22em] text-primary uppercase">
            V2 Admin Studio
          </span>
          <span className="rounded-full border border-[rgba(197,160,89,0.32)] px-2 py-0.5 text-[9px] tracking-wider text-[var(--color-accent-gold)] uppercase">
            EN | PL
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/6">
        {/* Dishes pane */}
        <div className="space-y-2 p-3">
          <p className="text-[9px] tracking-[0.22em] text-gray-500 uppercase">Dishes</p>
          {["Escargots", "Duck Confit", "Beef Tartare"].map((name) => (
            <div key={name} className="rounded-lg border border-white/8 bg-black/30 p-2">
              <div className="grid grid-cols-2 gap-1">
                <div className="rounded bg-white/4 px-2 py-1 text-[10px] text-gray-200">{name}</div>
                <div className="rounded bg-white/4 px-2 py-1 text-[10px] italic text-[#e6d3c0]">{name === "Escargots" ? "Ślimaki" : name === "Duck Confit" ? "Konfitowana kaczka" : "Tatar"}</div>
              </div>
              <div className="mt-1 h-2 rounded bg-white/4" />
            </div>
          ))}
        </div>
        {/* Wines pane */}
        <div className="space-y-2 p-3">
          <p className="text-[9px] tracking-[0.22em] text-gray-500 uppercase">Curated</p>
          {["Riesling", "Pinot", "Champagne"].map((name) => (
            <div key={name} className="flex items-start gap-2 rounded-lg border border-primary/24 bg-primary/8 p-2">
              <span className="mt-0.5 inline-flex h-3 w-3 items-center justify-center rounded-sm border border-primary/60 bg-primary text-[8px] text-white">
                ✓
              </span>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-white">{name}</p>
                <div className="mt-1 h-1.5 rounded bg-white/8" />
                <div className="mt-1 h-1.5 w-2/3 rounded bg-white/8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────── */

  const features = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    title: tx(`what.f${n}Title`),
    body: tx(`what.f${n}Body`),
  }));

  const steps = [1, 2, 3, 4].map((n) => ({
    title: tx(`how.step${n}Title`),
    body: tx(`how.step${n}Body`),
  }));

  const stats = [1, 2, 3, 4].map((n) => ({
    number: tx(`stats.s${n}Number`),
    label: tx(`stats.s${n}Label`),
  }));

  const tiers = [1, 2, 3].map((n) => ({
    name: tx(`pricing.tier${n}Name`),
    price: tx(`pricing.tier${n}Price`),
    tagline: tx(`pricing.tier${n}Tagline`),
    features: [1, 2, 3, 4].map((f) => tx(`pricing.tier${n}F${f}`)),
    cta: tx(`pricing.tier${n}Cta`),
  }));

  const faqItems = [1, 2, 3, 4, 5, 6].map((n) => ({
    q: tx(`faq.q${n}`),
    a: tx(`faq.a${n}`),
  }));

  return (
    <div className="pitch-grain mobile-safe-bottom min-h-screen bg-background-dark text-[#f4ede0]">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        {/* ──────────────────────────  HERO  ────────────────────────── */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden rounded-[40px] border border-white/8 bg-[radial-gradient(circle_at_8%_18%,rgba(209,21,52,0.22),transparent_42%),radial-gradient(circle_at_92%_82%,rgba(197,160,89,0.18),transparent_46%),linear-gradient(180deg,#1d1013_0%,#120709_100%)] px-6 py-14 sm:px-12 sm:py-20 lg:px-16 lg:py-28"
        >
          <div className="pitch-corner pitch-corner--tl hidden lg:block" aria-hidden />
          <div className="pitch-corner pitch-corner--br hidden lg:block" aria-hidden />

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
            <div className="pitch-fade flex max-w-2xl flex-col">
              <span className="pitch-eyebrow pitch-eyebrow--start">{tx("hero.eyebrow")}</span>

              <h1
                id="hero-title"
                className="pitch-display mt-8 text-[clamp(2.6rem,7vw,5.6rem)] text-white"
              >
                {tx("hero.title")}{" "}
                <em className="block">{tx("hero.titleAccent")}</em>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-[1.65] text-[#d4cabc] sm:text-lg">
                {tx("hero.lede")}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/" className="pitch-cta-primary">
                  {tx("hero.ctaPrimary")}
                  <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
                    <path d="M1 5h15m0 0L12 1m4 4l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <a href="#how" className="pitch-cta-ghost">
                  {tx("hero.ctaSecondary")}
                </a>
              </div>

              <p className="mt-10 max-w-md font-serif text-xs italic tracking-wide text-[var(--color-accent-gold)] opacity-80">
                {tx("hero.footnote")}
              </p>
            </div>

            <div
              className="pitch-fade relative flex items-center justify-center lg:justify-end"
              style={{ animationDelay: "150ms" }}
            >
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(197,160,89,0.18),transparent_60%)]" aria-hidden />
              <div className="relative">
                <div className="absolute -top-6 -left-10 hidden lg:block">
                  <span className="pitch-stamp">
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden><circle cx="4" cy="4" r="3" fill="currentColor" /></svg>
                    Live demo
                  </span>
                </div>
                {PhoneMockup}
                <div className="absolute -right-8 -bottom-6 hidden lg:block">
                  <span className="pitch-stamp">96 %</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="my-20 flex items-center justify-center" aria-hidden>
          <span className="pitch-ornament">{tx("ornament")}</span>
        </div>

        {/* ──────────────────────────  I. HOW IT WORKS  ────────────────────────── */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-24">
          <header className="mb-14 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">{tx("how.eyebrow")}</span>
            <div>
              <h2 id="how-title" className="pitch-display text-[clamp(2rem,4.6vw,3.4rem)] text-white">
                {tx("how.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                {tx("how.subtitle")}
              </p>
            </div>
          </header>

          <ol className="space-y-6">
            {steps.map((step, i) => {
              const isEven = i % 2 === 1;
              return (
                <li
                  key={i}
                  className={`grid gap-6 rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(34,18,22,0.7),rgba(20,11,13,0.7))] p-6 transition-colors duration-500 hover:border-[rgba(197,160,89,0.35)] sm:p-8 lg:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-12 ${isEven ? "lg:rounded-tl-[60px]" : "lg:rounded-tr-[60px]"}`}
                >
                  <span className="pitch-display text-5xl text-[var(--color-accent-gold)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="pitch-display text-2xl text-white sm:text-[1.7rem]">
                    {step.title}
                  </h3>
                  <p className="text-base leading-[1.65] text-[#cbc1b1]">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="my-24 flex items-center justify-center" aria-hidden>
          <span className="pitch-rule pitch-rule--short" />
        </div>

        {/* ──────────────────────────  II. WHAT YOU GET  ────────────────────────── */}
        <section aria-labelledby="what-title" className="scroll-mt-24">
          <header className="mb-14 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">{tx("what.eyebrow")}</span>
            <div>
              <h2 id="what-title" className="pitch-display text-[clamp(2rem,4.6vw,3.4rem)] text-white">
                {tx("what.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                {tx("what.subtitle")}
              </p>
            </div>
          </header>

          <div className="grid gap-px overflow-hidden rounded-3xl border border-[rgba(197,160,89,0.18)] bg-[rgba(197,160,89,0.18)] sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <article
                key={i}
                className="group relative bg-[#150a0c] p-7 transition-colors duration-500 hover:bg-[#1c1014]"
              >
                <span className="pitch-roman text-[0.72rem]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="pitch-display mt-4 text-xl text-white sm:text-2xl">{f.title}</h3>
                <p className="mt-3 text-sm leading-[1.65] text-[#cbc1b1]">{f.body}</p>
                <span
                  aria-hidden
                  className="absolute right-6 bottom-6 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(197,160,89,0.35)] text-[var(--color-accent-gold)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1 5.5h9m0 0L6 1m4 4.5L6 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </span>
              </article>
            ))}
          </div>
        </section>

        <div className="my-24 flex items-center justify-center" aria-hidden>
          <span className="pitch-ornament">{tx("ornament")}</span>
        </div>

        {/* ──────────────────────────  III. SCREENSHOTS  ────────────────────────── */}
        <section aria-labelledby="screens-title" className="scroll-mt-24">
          <header className="mb-14 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">{tx("screenshots.eyebrow")}</span>
            <div>
              <h2 id="screens-title" className="pitch-display text-[clamp(2rem,4.6vw,3.4rem)] text-white">
                {tx("screenshots.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                {tx("screenshots.subtitle")}
              </p>
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-6 xl:gap-10">
            <figure className="lg:col-span-4 lg:translate-y-6">
              <div className="flex justify-center">{PhoneMockup}</div>
              <figcaption className="mt-5 text-center">
                <p className="font-serif text-base italic text-white">{tx("screenshots.phoneCaption")}</p>
                <p className="mt-1 text-[11px] tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                  {tx("screenshots.phoneSub")}
                </p>
              </figcaption>
            </figure>

            <figure className="lg:col-span-5">
              {MapMockup}
              <figcaption className="mt-5">
                <p className="font-serif text-base italic text-white">{tx("screenshots.mapCaption")}</p>
                <p className="mt-1 text-[11px] tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                  {tx("screenshots.mapSub")}
                </p>
              </figcaption>
            </figure>

            <figure className="lg:col-span-3 lg:translate-y-12">
              {AdminMockup}
              <figcaption className="mt-5">
                <p className="font-serif text-base italic text-white">{tx("screenshots.adminCaption")}</p>
                <p className="mt-1 text-[11px] tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                  {tx("screenshots.adminSub")}
                </p>
              </figcaption>
            </figure>
          </div>
        </section>

        <div className="my-24 flex items-center justify-center" aria-hidden>
          <span className="pitch-rule pitch-rule--short" />
        </div>

        {/* ──────────────────────────  IV. STATS  ────────────────────────── */}
        <section aria-labelledby="stats-title" className="scroll-mt-24">
          <header className="mb-14 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">{tx("stats.eyebrow")}</span>
            <div>
              <h2 id="stats-title" className="pitch-display text-[clamp(2rem,4.6vw,3.4rem)] text-white">
                {tx("stats.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                {tx("stats.subtitle")}
              </p>
            </div>
          </header>

          <div className="relative grid gap-8 rounded-3xl border border-[rgba(197,160,89,0.22)] bg-gradient-to-br from-[#150a0c] to-[#0d0506] p-10 sm:grid-cols-2 sm:p-14 lg:grid-cols-4">
            <div className="pitch-corner pitch-corner--tl" aria-hidden />
            <div className="pitch-corner pitch-corner--tr" aria-hidden />
            <div className="pitch-corner pitch-corner--bl" aria-hidden />
            <div className="pitch-corner pitch-corner--br" aria-hidden />

            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="pitch-display text-[clamp(3.4rem,7vw,5.6rem)] text-white">
                  {s.number}
                </p>
                <p className="mt-3 font-serif text-sm italic text-[var(--color-accent-gold)]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="my-24 flex items-center justify-center" aria-hidden>
          <span className="pitch-ornament">{tx("ornament")}</span>
        </div>

        {/* ──────────────────────────  V. PRICING  ────────────────────────── */}
        <section aria-labelledby="price-title" className="scroll-mt-24">
          <header className="mb-14 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">{tx("pricing.eyebrow")}</span>
            <div>
              <h2 id="price-title" className="pitch-display text-[clamp(2rem,4.6vw,3.4rem)] text-white">
                {tx("pricing.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
                {tx("pricing.subtitle")}
              </p>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch lg:gap-4 xl:gap-6">
            {tiers.map((tier, i) => {
              const featured = i === 1;
              return (
                <article
                  key={i}
                  className={`relative flex flex-col rounded-3xl border p-8 transition-colors duration-500 ${
                    featured
                      ? "lg:-translate-y-4 border-[rgba(197,160,89,0.55)] bg-[radial-gradient(circle_at_50%_0%,rgba(197,160,89,0.16),transparent_55%),linear-gradient(180deg,#1f1115,#150a0c)] shadow-[0_28px_70px_rgba(0,0,0,0.4)]"
                      : "border-white/10 bg-[#140a0c] hover:border-white/20"
                  }`}
                >
                  {featured ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[rgba(197,160,89,0.6)] bg-[#1f1115] px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                      {tx("pricing.tier2Featured")}
                    </span>
                  ) : null}

                  <span className="pitch-roman">{["I.", "II.", "III."][i]}</span>
                  <h3 className="pitch-display mt-3 text-3xl text-white">{tier.name}</h3>

                  <div className="mt-6 flex items-end gap-2">
                    <p
                      className={`pitch-display text-4xl ${
                        featured ? "text-[var(--color-accent-gold)]" : "text-white"
                      }`}
                    >
                      {tier.price}
                    </p>
                  </div>

                  <p className="mt-3 font-serif text-sm italic text-[#cbc1b1]">{tier.tagline}</p>

                  <span className="my-6 block h-px w-full bg-[rgba(197,160,89,0.18)]" aria-hidden />

                  <ul className="space-y-3">
                    {tier.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-3 text-sm leading-relaxed text-[#d4cabc]">
                        <span
                          aria-hidden
                          className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[rgba(197,160,89,0.45)] text-[var(--color-accent-gold)]"
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4.2L3.2 6L6.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-8">
                    {featured ? (
                      <button type="button" className="pitch-cta-primary w-full justify-center">
                        {tier.cta}
                      </button>
                    ) : i === 0 ? (
                      <Link href="/" className="pitch-cta-ghost w-full justify-center">
                        {tier.cta}
                      </Link>
                    ) : (
                      <a href="mailto:hello@icoffio.com" className="pitch-cta-ghost w-full justify-center">
                        {tier.cta}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="my-24 flex items-center justify-center" aria-hidden>
          <span className="pitch-rule pitch-rule--short" />
        </div>

        {/* ──────────────────────────  VI. FAQ  ────────────────────────── */}
        <section aria-labelledby="faq-title" className="scroll-mt-24">
          <header className="mb-12 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
            <span className="pitch-roman">{tx("faq.eyebrow")}</span>
            <div>
              <h2 id="faq-title" className="pitch-display text-[clamp(2rem,4.6vw,3.4rem)] text-white">
                {tx("faq.title")}
              </h2>
            </div>
          </header>

          <Faq items={faqItems} />
        </section>

        <div className="my-24 flex items-center justify-center" aria-hidden>
          <span className="pitch-ornament">{tx("ornament")}</span>
        </div>

        {/* ──────────────────────────  FINAL CTA  ────────────────────────── */}
        <section
          aria-labelledby="final-title"
          className="relative overflow-hidden rounded-[40px] border border-[rgba(197,160,89,0.32)] bg-[radial-gradient(circle_at_50%_120%,rgba(209,21,52,0.32),transparent_60%),linear-gradient(180deg,#1d1013,#100608)] px-6 py-20 text-center sm:px-12 lg:px-16 lg:py-28"
        >
          <div className="pitch-corner pitch-corner--tl" aria-hidden />
          <div className="pitch-corner pitch-corner--tr" aria-hidden />
          <div className="pitch-corner pitch-corner--bl" aria-hidden />
          <div className="pitch-corner pitch-corner--br" aria-hidden />

          <span className="pitch-eyebrow">{tx("finalCta.kicker")}</span>

          <h2
            id="final-title"
            className="pitch-display mx-auto mt-8 max-w-3xl text-[clamp(2rem,5vw,4rem)] text-white"
          >
            {tx("finalCta.title")}
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#cbc1b1]">
            {tx("finalCta.subtitle")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/" className="pitch-cta-primary">
              {tx("finalCta.button")}
              <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
                <path d="M1 5h15m0 0L12 1m4 4l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a href="mailto:hello@icoffio.com" className="pitch-cta-ghost">
              {tx("finalCta.secondary")}
            </a>
          </div>

          <p className="mt-12 font-serif text-xs italic tracking-[0.32em] text-[var(--color-accent-gold)] uppercase">
            {tx("finalCta.footnote")}
          </p>
        </section>
      </main>

      <MobileTabBar />
    </div>
  );
}
