"use client";

import { useEffect } from "react";

/**
 * Route error boundary for everything under [locale]. Instead of Next's raw
 * unstyled default error screen shown to a guest mid-dinner, render a branded
 * apology card with a retry and a way home. Bilingual (PL primary) and
 * intl-context-free so it renders even if the failure is in the provider.
 * A real error monitor can hook the useEffect below later.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0b1f44] px-6 text-center text-[#f4efe9]">
      <div className="max-w-md">
        <p className="text-[11px] font-bold tracking-[0.28em] text-[#c79f69] uppercase">
          Vinovigator
        </p>
        <h1 className="mt-4 font-serif text-2xl">Coś poszło nie tak</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#c9c2b4]">
          Przepraszamy — po naszej stronie wystąpił błąd. Spróbuj ponownie za chwilę.
          <br />
          <span className="opacity-70">Something went wrong on our side. Please try again.</span>
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] rounded-full bg-[#c79f69] px-5 py-2.5 text-sm font-semibold text-[#0b1f44] transition hover:opacity-90"
          >
            Spróbuj ponownie
          </button>
          {/* Hard navigation on purpose: an error boundary should fully reload
              out of the broken state, not soft-nav via the router. */}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-[#f4efe9] transition hover:border-white/40"
          >
            Strona główna
          </button>
        </div>
      </div>
    </div>
  );
}
