"use client";

/**
 * /admin/chat — what guests ask the Vinovigator bot.
 *
 * Reads /api/admin/chat-analytics (ACL-gated), which aggregates the
 * transcripts written by src/lib/chat-store.ts. The headline table is
 * "top questions": the argument a restaurant owner cares about — what their
 * guests are actually confused about at the table.
 */

import { useState } from "react";
import useSWR from "swr";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { swrFetcher } from "@/lib/api-client";

interface Analytics {
  rangeDays: number;
  totals: {
    messages: number;
    questions: number;
    sessions: number;
    guests: number;
    tokens: number;
  };
  topQuestions: { question: string; asked: number; lastAt: string }[];
  recent: {
    sessionId: string;
    startedAt: string;
    lastAt: string;
    turns: number;
    opener: string | null;
  }[];
}

const RANGES = [7, 30, 90] as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminChatPage() {
  const [days, setDays] = useState<number>(30);
  const { data, error, isLoading } = useSWR<Analytics>(
    `/api/admin/chat-analytics?days=${days}`,
    swrFetcher,
  );

  const stats = [
    { label: "Pytania gości", value: data?.totals.questions },
    { label: "Rozmowy", value: data?.totals.sessions },
    { label: "Goście", value: data?.totals.guests },
    { label: "Wiadomości", value: data?.totals.messages },
  ];

  return (
    <div className="pitch-grain mobile-safe-bottom min-h-screen bg-background-dark text-[color:var(--ink)]">
      <Navigation />
      <main className="mx-auto w-full max-w-5xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        <p className="pitch-eyebrow pitch-eyebrow--start">Vinovigator · analityka</p>
        <h1 className="pitch-display pitch-display--roomy mt-3 text-3xl text-white sm:text-4xl">
          O co pytają goście?
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-sm italic text-[#e6e1d6]">
          Zapisy rozmów z przewodnikiem Vinokompasu. Najczęstsze pytania pokazują,
          czego goście nie rozumieją w karcie win — i gdzie kelner traci czas.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold tracking-wider uppercase transition ${
                days === r
                  ? "border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)]"
                  : "border-white/15 text-[#e6e1d6] hover:border-white/35"
              }`}
            >
              {r} dni
            </button>
          ))}
          <Link
            href="/admin"
            className="ml-auto min-h-[38px] rounded-full border border-white/15 px-4 text-[11px] font-semibold tracking-wider text-[#e6e1d6] uppercase transition hover:border-white/35"
          >
            ← Panel
          </Link>
        </div>

        {error ? (
          <p className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-900/20 p-4 text-sm text-rose-200">
            Nie udało się pobrać danych. {String(error.message ?? error)}
          </p>
        ) : null}

        {/* Totals */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[rgba(199,159,105,0.28)] bg-[#0b1f44] p-4"
            >
              <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--color-accent-gold)] uppercase">
                {s.label}
              </p>
              <p className="mt-1 font-mono text-2xl text-white">
                {isLoading ? "—" : (s.value ?? 0)}
              </p>
            </div>
          ))}
        </div>

        {/* Top questions */}
        <h2 className="pitch-display pitch-display--roomy mt-10 text-xl text-white">
          Najczęstsze pytania
        </h2>
        {isLoading ? (
          <div className="mt-4 h-40 animate-pulse rounded-2xl border border-white/8 bg-white/3" />
        ) : data && data.topQuestions.length > 0 ? (
          <ol className="mt-4 space-y-2">
            {data.topQuestions.map((q, i) => (
              <li
                key={`${q.question}-${i}`}
                className="flex items-start gap-3 rounded-xl border border-white/8 bg-[#0b1f44] px-4 py-3"
              >
                <span className="mt-0.5 font-mono text-xs text-[var(--color-accent-gold)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 text-sm text-[#e6e1d6]">{q.question}</span>
                <span className="shrink-0 rounded-full border border-[rgba(199,159,105,0.35)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--color-accent-gold)]">
                  ×{q.asked}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-5 text-sm text-[#e6e1d6]">
            Brak rozmów w tym okresie. Zapisy pojawiają się, gdy goście korzystają
            z przewodnika na /samouczek lub /pairing.
          </p>
        )}

        {/* Recent conversations */}
        <h2 className="pitch-display pitch-display--roomy mt-10 text-xl text-white">
          Ostatnie rozmowy
        </h2>
        {data && data.recent.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.18em] text-gray-400 uppercase">
                  <th className="border-b border-white/10 py-2 pr-3 font-semibold">Pierwsze pytanie</th>
                  <th className="border-b border-white/10 py-2 pr-3 font-semibold">Pytań</th>
                  <th className="border-b border-white/10 py-2 font-semibold">Ostatnia aktywność</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.sessionId} className="align-top">
                    <td className="border-b border-white/6 py-2.5 pr-3 text-[#e6e1d6]">
                      {r.opener ?? <span className="text-gray-500">—</span>}
                    </td>
                    <td className="border-b border-white/6 py-2.5 pr-3 font-mono text-[#e6e1d6]">
                      {r.turns}
                    </td>
                    <td className="border-b border-white/6 py-2.5 font-mono text-xs text-gray-400">
                      {fmtDate(r.lastAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>
      <MobileTabBar />
    </div>
  );
}
