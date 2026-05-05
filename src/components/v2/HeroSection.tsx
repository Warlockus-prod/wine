import { Link } from "@/i18n/navigation";

export default function HeroSection() {
  return (
    <header className="relative mb-12">
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/16 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
          <span className="material-icons text-sm">auto_awesome</span>
          Vinovigator AI · Vinokompas
        </div>
        <h1 className="mb-4 text-5xl leading-tight font-extrabold tracking-tight text-white md:text-6xl">
          Twoje wino,
          <br />
          <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
            Twój kompas smaku.
          </span>
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-gray-300">
          Wybierz danie — dostaniesz top-3 win z uzasadnieniem językiem Vinokompasu. Wybierz wino — system przegrupuje menu. Skanujesz QR przy stoliku, gotowe.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/samouczek"
            className="group inline-flex items-center gap-2 rounded-lg border border-[var(--color-accent-gold)] bg-gradient-to-br from-[rgba(197,160,89,0.18)] to-[rgba(197,160,89,0.05)] px-5 py-3 text-sm font-bold tracking-wide text-[var(--color-accent-gold)] shadow-[0_8px_24px_rgba(197,160,89,0.18)] transition hover:bg-[rgba(197,160,89,0.22)] hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
              <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
            Samouczek smaku
            <span className="hidden text-xs font-normal italic opacity-80 sm:inline">— interaktywny kompas</span>
          </Link>
          <Link
            href="/pairing"
            className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-ink shadow-lg transition hover:bg-gray-200"
          >
            Otwórz Pairing
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-primary/40 bg-primary/15 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/25"
          >
            Panel administratora
          </Link>
          <Link
            href="/pitch"
            className="group inline-flex items-center gap-2 px-2 py-3 font-serif text-sm italic text-gray-400 transition-colors hover:text-[var(--color-accent-gold)]"
          >
            Dla restauratorów
            <svg
              width="16"
              height="9"
              viewBox="0 0 16 9"
              fill="none"
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
