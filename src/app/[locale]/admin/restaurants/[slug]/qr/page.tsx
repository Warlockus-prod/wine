"use client";

/**
 * /admin/restaurants/[slug]/qr — printable QR sheet.
 *
 * One master code (restaurant page) + per-table codes with ?table=N so the
 * owner dashboard can attribute scans to tables. Print-optimised: chrome is
 * hidden via @media print, cards never split across pages, white background.
 */

import { use, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://wine.icoffio.com";

export default function QrPrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [tables, setTables] = useState(12);

  // Locale-free path — per project convention QR codes stay valid without
  // the /pl prefix (localePrefix: "as-needed").
  const urlFor = (table?: number) =>
    `${SITE}/restaurants/${slug}${table ? `?table=${table}` : ""}`;

  return (
    <div className="min-h-screen bg-white text-[#0b1f44]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .qr-card { break-inside: avoid; page-break-inside: avoid; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print">
        <Navigation />
      </div>

      <main className="mx-auto w-full max-w-4xl px-6 pt-24 pb-16 print:pt-8">
        <header className="no-print mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href={`/admin/restaurants/${slug}`}
              className="inline-flex min-h-[40px] items-center text-[12px] font-semibold tracking-[0.22em] text-[#9c7536] uppercase hover:text-[#0b1f44]"
            >
              ← Edytor restauracji
            </Link>
            <h1 className="pitch-display mt-1 text-3xl">Kody QR do druku</h1>
            <p className="mt-1 text-sm text-[#5a6478]">
              Wydrukuj, zalaminuj, połóż na stolikach. Kody ze stolikiem raportują
              skany per stolik w statystykach.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold" htmlFor="qr-tables">
              Stoliki:
            </label>
            <input
              id="qr-tables"
              type="number"
              min={0}
              max={60}
              value={tables}
              onChange={(e) => setTables(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
              className="h-11 w-20 rounded-lg border border-[#0b1f44]/25 px-3 text-center text-base"
            />
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#0b1f44] px-5 py-2.5 text-sm font-semibold text-[#f4efe9] transition hover:opacity-90"
            >
              🖨 Drukuj
            </button>
          </div>
        </header>

        {/* Master code */}
        <section className="qr-card mx-auto mb-10 flex w-full max-w-sm flex-col items-center rounded-2xl border-2 border-[#0b1f44] p-8 text-center">
          <p className="text-[11px] font-bold tracking-[0.3em] text-[#9c7536] uppercase">
            Vinovigator · karta win
          </p>
          <div className="mt-4 rounded-xl bg-white p-2">
            <QRCodeSVG value={urlFor()} size={220} level="M" marginSize={1} />
          </div>
          <p className="mt-4 font-serif text-lg italic">Zeskanuj i dobierz wino do dania</p>
          <p className="mt-1 break-all text-[11px] text-[#5a6478]">{urlFor()}</p>
        </section>

        {/* Per-table codes */}
        {tables > 0 ? (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: tables }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className="qr-card flex flex-col items-center rounded-xl border border-[#0b1f44]/30 p-4 text-center"
              >
                <p className="text-[10px] font-bold tracking-[0.24em] text-[#9c7536] uppercase">
                  Stolik {n}
                </p>
                <div className="mt-2 rounded-lg bg-white p-1">
                  <QRCodeSVG value={urlFor(n)} size={128} level="M" marginSize={1} />
                </div>
                <p className="mt-2 font-serif text-sm italic">Dobierz wino</p>
              </div>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
