import { Link } from "@/i18n/navigation";

/* Primary funnel → the DB-backed per-restaurant editor. The legacy
   in-page RestaurantContentManager (localStorage) was removed: it
   duplicated /admin/restaurants/[slug] without persisting to the DB,
   and the public pages now read the DB read-path. */
export default function ProductionEditorCta() {
  return (
    <section className="mb-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[rgba(199,159,105,0.3)] bg-gradient-to-r from-[#221014] to-[#081634] p-6 sm:p-7">
      <div className="max-w-xl">
        <p className="pitch-eyebrow">Edytor produkcyjny</p>
        <h2 className="pitch-display mt-2 text-2xl text-white sm:text-3xl">
          Edytuj <em className="italic text-[var(--color-accent-gold)]">restauracje w bazie</em>
        </h2>
        <p className="mt-2 font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          Dania, wina i łączenia konkretnej restauracji - zapis prosto do bazy
          danych. To jedyne miejsce, w którym zmiany są trwałe i widoczne dla gości.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href="/admin/restaurants"
          className="pitch-cta-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold tracking-wider uppercase"
        >
          Otwórz edytor restauracji &rarr;
        </Link>
        {/* Transcripts of the guide bot — the "what do guests ask?" number
            that sells the product to a restaurant. */}
        <Link
          href="/admin/chat"
          className="pitch-cta-ghost inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold tracking-wider uppercase"
        >
          Analityka czatu
        </Link>
      </div>
    </section>
  );
}
