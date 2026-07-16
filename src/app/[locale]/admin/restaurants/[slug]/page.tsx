"use client";

/**
 * /admin/restaurants/[slug] - DB-backed per-restaurant editor.
 *
 * Three tabs: Dishes / Wines / Curated Pairings - each backed by SWR
 * hooks that fetch from the DB-canonical write API. Mutations call the
 * mutator hooks which optimistically refetch on success.
 *
 * EN | PL inputs side-by-side for every localized field - same pattern as
 * the legacy /admin sandbox so muscle memory carries over.
 */

import { useState, useMemo, use } from "react";
import { useLocale } from "next-intl";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/localized";
import {
  useDishes,
  useWines,
  usePairings,
  createDish,
  updateDish,
  deleteDish,
  createWine,
  updateWine,
  deleteWine,
  upsertPairing,
  deletePairing,
  type ApiDish,
  type ApiWine,
} from "@/lib/use-restaurant-data";
import { parseWineImport, toWinePayload, winePlural } from "@/lib/wine-import";
import type { Locale } from "@/i18n/routing";
import type { LocalizedString } from "@/types/pairing";

type TabId = "dishes" | "wines" | "pairings";

export default function PerRestaurantEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16 - params is a Promise; `use()` unwraps it inside a client component.
  const { slug } = use(params);
  const locale = useLocale() as Locale;
  const [tab, setTab] = useState<TabId>("dishes");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const { dishes, error: dishesErr } = useDishes(slug);
  const { wines, error: winesErr } = useWines(slug);
  const { pairings, error: pairingsErr } = usePairings(slug);

  const showStatus = (kind: "ok" | "err", text: string) => {
    setStatus({ kind, text });
    setTimeout(() => setStatus(null), 3500);
  };

  return (
    <div className="pitch-grain mobile-safe-bottom min-h-screen bg-background-dark text-[#f4efe9]">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin/restaurants"
              className="inline-flex min-h-[40px] items-center text-[12px] font-semibold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase hover:text-white"
            >
              ← Wszystkie restauracje
            </Link>
            <h1 className="pitch-display mt-2 text-[clamp(1.6rem,4vw,2.6rem)] text-white">
              {slug}
            </h1>
            <p className="mt-1 text-xs text-gray-400">DB-canonical · zmiany trafiają od razu na produkcję</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/restaurants/${slug}/stats`}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--color-accent-gold)]/40 bg-[var(--color-accent-gold)]/10 px-3 text-xs font-semibold text-[var(--color-accent-gold)] transition hover:bg-[var(--color-accent-gold)]/20"
            >
              📊 Statystyki
            </Link>
            <Link
              href={`/admin/restaurants/${slug}/qr`}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--color-accent-gold)]/40 bg-[var(--color-accent-gold)]/10 px-3 text-xs font-semibold text-[var(--color-accent-gold)] transition hover:bg-[var(--color-accent-gold)]/20"
            >
              🖨 QR
            </Link>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
            {(["dishes", "wines", "pairings"] as TabId[]).map((id) => {
              const labels = { dishes: "Dania", wines: "Wina", pairings: "Połączenia" } as const;
              const counts = { dishes: dishes.length, wines: wines.length, pairings: pairings.length };
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    tab === id
                      ? "bg-primary text-[color:var(--on-primary)] shadow-[0_4px_18px_rgba(199,159,105,0.32)]"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {labels[id]} <span className="ml-1 opacity-60">{counts[id]}</span>
                </button>
              );
            })}
          </div>
          </div>
        </header>

        {status ? (
          <p
            role="status"
            className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
              status.kind === "ok"
                ? "border-emerald-500/30 bg-emerald-900/20 text-emerald-100"
                : "border-rose-500/30 bg-rose-900/20 text-rose-100"
            }`}
          >
            {status.text}
          </p>
        ) : null}

        {dishesErr || winesErr || pairingsErr ? (
          <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">
            Błąd ładowania danych - odśwież stronę. Nawet jeśli się nie uda, oryginalne dane w bazie są bezpieczne.
          </p>
        ) : null}

        {tab === "dishes" ? (
          <DishesTab
            slug={slug}
            locale={locale}
            dishes={dishes}
            onStatus={showStatus}
          />
        ) : null}
        {tab === "wines" ? (
          <WinesTab slug={slug} locale={locale} wines={wines} onStatus={showStatus} />
        ) : null}
        {tab === "pairings" ? (
          <PairingsTab
            slug={slug}
            locale={locale}
            dishes={dishes}
            wines={wines}
            pairings={pairings}
            onStatus={showStatus}
          />
        ) : null}
      </main>

      <MobileTabBar />
    </div>
  );
}

/* ─────────────────────────  DISHES TAB  ───────────────────────── */

function DishesTab({
  slug,
  locale,
  dishes,
  onStatus,
}: {
  slug: string;
  locale: Locale;
  dishes: ApiDish[];
  onStatus: (kind: "ok" | "err", text: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    namePl: "",
    description: "",
    descriptionPl: "",
    category: "Main",
    price: "24",
  });
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      onStatus("err", "Wpisz nazwę i opis (min. wersję EN).");
      return;
    }
    setCreating(true);
    try {
      await createDish(slug, {
        name: { en: form.name.trim(), pl: form.namePl.trim() || form.name.trim() },
        description: {
          en: form.description.trim(),
          pl: form.descriptionPl.trim() || form.description.trim(),
        },
        category: form.category,
        price: Number(form.price) || 0,
      });
      setForm({ name: "", namePl: "", description: "", descriptionPl: "", category: "Main", price: "24" });
      onStatus("ok", "Danie dodane.");
    } catch (e) {
      onStatus("err", `Nie udało się: ${(e as Error).message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-white/10 bg-[#081634] p-5">
        <h2 className="text-lg font-semibold text-white">Nowe danie</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="Name (EN)" aria-label="Name (EN)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputCls} placeholder="Nazwa (PL)" aria-label="Nazwa (PL)" value={form.namePl} onChange={(e) => setForm({ ...form, namePl: e.target.value })} />
          <textarea className={`${inputCls} sm:col-span-2 min-h-[60px]`} placeholder="Description (EN)" aria-label="Description (EN)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea className={`${inputCls} sm:col-span-2 min-h-[60px]`} placeholder="Opis (PL)" aria-label="Opis (PL)" value={form.descriptionPl} onChange={(e) => setForm({ ...form, descriptionPl: e.target.value })} />
          <input className={inputCls} placeholder="Kategoria" aria-label="Kategoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className={inputCls} type="number" placeholder="Cena" aria-label="Cena" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <button type="button" onClick={submit} disabled={creating} className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-[color:var(--on-primary)] transition hover:bg-primary-dark disabled:opacity-60">
          {creating ? "Tworzę…" : "+ Dodaj danie"}
        </button>
      </article>

      <div className="grid gap-3">
        {dishes.map((d) => (
          <DishRow key={d.id} slug={slug} dish={d} locale={locale} onStatus={onStatus} />
        ))}
        {dishes.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
            Brak dań. Dodaj pierwsze powyżej - zobaczysz je od razu.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function DishRow({
  slug,
  dish,
  locale,
  onStatus,
}: {
  slug: string;
  dish: ApiDish;
  locale: Locale;
  onStatus: (kind: "ok" | "err", text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(dish);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateDish(slug, dish.id, {
        name: draft.name,
        description: draft.description,
        category: draft.category,
        price: Number(draft.price) || 0,
      });
      onStatus("ok", "Zapisano.");
      setOpen(false);
    } catch (e) {
      onStatus("err", `Błąd: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Usunąć ${t(dish.name, locale)}?`)) return;
    setBusy(true);
    try {
      await deleteDish(slug, dish.id);
      onStatus("ok", "Usunięto.");
    } catch (e) {
      onStatus("err", `Błąd: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#081634]">
      <button type="button" onClick={() => setOpen((p) => !p)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/4">
        <span className="text-[10px] font-bold tracking-wider text-[var(--color-accent-gold)] uppercase">{dish.category}</span>
        <span className="font-semibold text-white">{t(dish.name, locale)}</span>
        <span className="ml-auto text-sm text-primary">${dish.price}</span>
        <span className="text-[var(--color-accent-gold)]" style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 200ms" }}>+</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-white/8 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={inputCls} placeholder="Name (EN)" aria-label="Name (EN)" value={draft.name.en} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, en: e.target.value } })} />
            <input className={inputCls} placeholder="Nazwa (PL)" aria-label="Nazwa (PL)" value={draft.name.pl} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, pl: e.target.value } })} />
            <textarea className={`${inputCls} sm:col-span-2 min-h-[60px]`} value={draft.description.en} onChange={(e) => setDraft({ ...draft, description: { ...draft.description, en: e.target.value } })} />
            <textarea className={`${inputCls} sm:col-span-2 min-h-[60px]`} value={draft.description.pl} onChange={(e) => setDraft({ ...draft, description: { ...draft.description, pl: e.target.value } })} />
            <input className={inputCls} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            <input className={inputCls} type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-[color:var(--on-primary)] disabled:opacity-60">
              {busy ? "…" : "Zapisz"}
            </button>
            <button type="button" onClick={remove} disabled={busy} className="inline-flex h-9 items-center rounded-lg border border-rose-500/30 bg-rose-900/20 px-3 text-xs font-semibold text-rose-200">
              Usuń
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

/* ─────────────────────────  WINES TAB  ───────────────────────── */

function WinesTab({
  slug,
  locale,
  wines,
  onStatus,
}: {
  slug: string;
  locale: Locale;
  wines: ApiWine[];
  onStatus: (kind: "ok" | "err", text: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    namePl: "",
    notes: "",
    notesPl: "",
    region: "",
    grape: "Blend",
    style: "White",
    vintage: "",
    price: "58",
  });
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.region.trim() || !form.notes.trim()) {
      onStatus("err", "Wpisz nazwę, region i nuty (min. EN).");
      return;
    }
    setCreating(true);
    try {
      await createWine(slug, {
        name: { en: form.name.trim(), pl: form.namePl.trim() || form.name.trim() },
        notes: { en: form.notes.trim(), pl: form.notesPl.trim() || form.notes.trim() },
        region: form.region.trim(),
        grape: form.grape.trim(),
        style: form.style.trim(),
        vintage: form.vintage.trim() || undefined,
        price: Number(form.price) || 0,
      });
      setForm({ name: "", namePl: "", notes: "", notesPl: "", region: "", grape: "Blend", style: "White", vintage: "", price: "58" });
      onStatus("ok", "Wino dodane.");
    } catch (e) {
      onStatus("err", `Nie udało się: ${(e as Error).message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-white/10 bg-[#081634] p-5">
        <h2 className="text-lg font-semibold text-white">Nowe wino</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="Name (EN)" aria-label="Name (EN)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputCls} placeholder="Nazwa (PL)" aria-label="Nazwa (PL)" value={form.namePl} onChange={(e) => setForm({ ...form, namePl: e.target.value })} />
          <textarea className={`${inputCls} sm:col-span-2 min-h-[50px]`} placeholder="Notes (EN)" aria-label="Notes (EN)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <textarea className={`${inputCls} sm:col-span-2 min-h-[50px]`} placeholder="Nuty (PL)" aria-label="Nuty (PL)" value={form.notesPl} onChange={(e) => setForm({ ...form, notesPl: e.target.value })} />
          <input className={inputCls} placeholder="Region" aria-label="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          <input className={inputCls} placeholder="Szczep" aria-label="Szczep" value={form.grape} onChange={(e) => setForm({ ...form, grape: e.target.value })} />
          <input className={inputCls} placeholder="Styl (Red/White/Sparkling)" aria-label="Styl (Red/White/Sparkling)" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
          <input className={inputCls} placeholder="Rocznik" aria-label="Rocznik" value={form.vintage} onChange={(e) => setForm({ ...form, vintage: e.target.value })} />
          <input className={inputCls} type="number" placeholder="Cena" aria-label="Cena" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <button type="button" onClick={submit} disabled={creating} className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-[color:var(--on-primary)] transition hover:bg-primary-dark disabled:opacity-60">
          {creating ? "Tworzę…" : "+ Dodaj wino"}
        </button>
      </article>

      <WineImportPanel slug={slug} onStatus={onStatus} />

      <div className="grid gap-3">
        {wines.map((w) => (
          <WineRow key={w.id} slug={slug} wine={w} locale={locale} onStatus={onStatus} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────  WINE-LIST IMPORT  ───────────────────────── */

function WineImportPanel({
  slug,
  onStatus,
}: {
  slug: string;
  onStatus: (kind: "ok" | "err", text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  // Line numbers the operator unchecked in the preview (keyed by source line).
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{
    created: number;
    failed: { name: string; reason: string }[];
  } | null>(null);

  const rows = useMemo(() => parseWineImport(raw), [raw]);
  const invalidCount = rows.filter((r) => r.errors.length > 0).length;
  const selected = rows.filter((r) => r.errors.length === 0 && !excluded.has(r.line));

  const toggleRow = (line: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  };

  const runImport = async () => {
    if (selected.length === 0 || importing) return;
    setImporting(true);
    setSummary(null);
    setProgress(0);
    let created = 0;
    const failed: { name: string; reason: string }[] = [];
    // Sequential POSTs — createWine revalidates the SWR wine list after each.
    for (let i = 0; i < selected.length; i++) {
      const row = selected[i];
      try {
        await createWine(slug, toWinePayload(row));
        created++;
      } catch (e) {
        failed.push({ name: row.name, reason: (e as Error).message });
      }
      setProgress(i + 1);
    }
    setImporting(false);
    setSummary({ created, failed });
    if (failed.length === 0) {
      setRaw("");
      setExcluded(new Set());
      onStatus("ok", `Zaimportowano ${created} ${winePlural(created)}.`);
    } else {
      onStatus("err", `Zaimportowano ${created} ${winePlural(created)}, błędów: ${failed.length}.`);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#081634]">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-white/4"
      >
        <h2 className="text-lg font-semibold text-white">Import karty win</h2>
        <span className="hidden text-xs text-gray-400 sm:inline">
          CSV z nagłówkiem albo linie „Nazwa | Region | Szczep | Styl | Rocznik | Cena”
        </span>
        <span
          className="ml-auto text-[var(--color-accent-gold)]"
          style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 200ms" }}
        >
          +
        </span>
      </button>
      {open ? (
        <div className="space-y-4 border-t border-white/8 p-5">
          <textarea
            className={`${inputCls} min-h-[140px] font-mono text-xs`}
            placeholder={
              "Wklej CSV lub linie…\n\nname,region,grape,style,vintage,price,notes\nChablis AC,Burgundia,Chardonnay,White,2022,120,mineralne\n\n— albo —\n\nBarolo DOCG | Piemont | Nebbiolo | Red | 2019 | 240"
            }
            aria-label="Wklej CSV lub linie"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setExcluded(new Set());
              setSummary(null);
            }}
            disabled={importing}
          />

          {rows.length > 0 ? (
            <>
              <p className="text-[11px] font-bold tracking-wider text-[var(--color-accent-gold)] uppercase">
                Podgląd · {rows.length} {rows.length === 1 ? "wiersz" : "wierszy"}
                {invalidCount > 0 ? (
                  <span className="ml-2 font-semibold text-rose-300 normal-case tracking-normal">
                    ({invalidCount} z błędami — pominięte)
                  </span>
                ) : null}
              </p>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[680px] text-left text-xs text-gray-300">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/30 text-[10px] tracking-wider text-gray-400 uppercase">
                      <th className="px-3 py-2" aria-label="Wybór" />
                      <th className="px-3 py-2">Nazwa</th>
                      <th className="px-3 py-2">Region</th>
                      <th className="px-3 py-2">Szczep</th>
                      <th className="px-3 py-2">Styl</th>
                      <th className="px-3 py-2">Rocznik</th>
                      <th className="px-3 py-2">Cena</th>
                      <th className="px-3 py-2">Błędy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const hasErrors = r.errors.length > 0;
                      const isChecked = !hasErrors && !excluded.has(r.line);
                      return (
                        <tr
                          key={r.line}
                          className={`border-b border-white/5 last:border-b-0 ${hasErrors ? "opacity-70" : ""}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={hasErrors || importing}
                              onChange={() => toggleRow(r.line)}
                              aria-label={`Importuj wiersz ${r.line}`}
                            />
                          </td>
                          <td className="px-3 py-2 font-semibold text-white">{r.name || "—"}</td>
                          <td className="px-3 py-2">{r.region || "—"}</td>
                          <td className="px-3 py-2">{r.grape || "—"}</td>
                          <td className="px-3 py-2">{r.style || "—"}</td>
                          <td className="px-3 py-2">{r.vintage || "—"}</td>
                          <td className="px-3 py-2">{r.price !== null ? `$${r.price}` : "—"}</td>
                          <td className="px-3 py-2 text-rose-300">{r.errors.join("; ")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={runImport}
                disabled={importing || selected.length === 0}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-[color:var(--on-primary)] transition hover:bg-primary-dark disabled:opacity-60"
              >
                {importing
                  ? `Importuję… ${progress}/${selected.length}`
                  : `Importuj ${selected.length} ${winePlural(selected.length)}`}
              </button>
            </>
          ) : null}

          {summary ? (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                summary.failed.length === 0
                  ? "border-emerald-500/30 bg-emerald-900/20 text-emerald-100"
                  : "border-rose-500/30 bg-rose-900/20 text-rose-100"
              }`}
            >
              <p>
                Utworzono: {summary.created} · Nieudane: {summary.failed.length}
              </p>
              {summary.failed.length > 0 ? (
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {summary.failed.map((f, i) => (
                    <li key={i}>
                      {f.name}: {f.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function WineRow({
  slug,
  wine,
  locale,
  onStatus,
}: {
  slug: string;
  wine: ApiWine;
  locale: Locale;
  onStatus: (kind: "ok" | "err", text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(wine);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateWine(slug, wine.id, {
        name: draft.name,
        notes: draft.notes,
        region: draft.region,
        grape: draft.grape,
        style: draft.style,
        vintage: draft.vintage ?? undefined,
        price: Number(draft.price) || 0,
      });
      onStatus("ok", "Zapisano.");
      setOpen(false);
    } catch (e) {
      onStatus("err", `Błąd: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Usunąć ${t(wine.name, locale)}? Skasuje też kuratorskie połączenia z tym winem.`)) return;
    setBusy(true);
    try {
      await deleteWine(slug, wine.id);
      onStatus("ok", "Usunięto.");
    } catch (e) {
      onStatus("err", `Błąd: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#081634]">
      <button type="button" onClick={() => setOpen((p) => !p)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/4">
        <span className="text-[10px] font-bold tracking-wider text-[var(--color-accent-gold)] uppercase">{wine.style}</span>
        <span className="font-semibold text-white">{t(wine.name, locale)}</span>
        <span className="text-xs text-gray-400">{wine.region}{wine.vintage ? ` · ${wine.vintage}` : ""}</span>
        <span className="ml-auto text-sm text-white">${wine.price}</span>
        <span className="text-[var(--color-accent-gold)]" style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 200ms" }}>+</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-white/8 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={inputCls} value={draft.name.en} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, en: e.target.value } })} placeholder="Name (EN)" aria-label="Name (EN)" />
            <input className={inputCls} value={draft.name.pl} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, pl: e.target.value } })} placeholder="Nazwa (PL)" aria-label="Nazwa (PL)" />
            <textarea className={`${inputCls} sm:col-span-2 min-h-[50px]`} value={draft.notes.en} onChange={(e) => setDraft({ ...draft, notes: { ...draft.notes, en: e.target.value } })} placeholder="Notes (EN)" aria-label="Notes (EN)" />
            <textarea className={`${inputCls} sm:col-span-2 min-h-[50px]`} value={draft.notes.pl} onChange={(e) => setDraft({ ...draft, notes: { ...draft.notes, pl: e.target.value } })} placeholder="Nuty (PL)" aria-label="Nuty (PL)" />
            <input className={inputCls} value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
            <input className={inputCls} value={draft.grape} onChange={(e) => setDraft({ ...draft, grape: e.target.value })} />
            <input className={inputCls} value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value })} />
            <input className={inputCls} value={draft.vintage ?? ""} onChange={(e) => setDraft({ ...draft, vintage: e.target.value })} />
            <input className={inputCls} type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-[color:var(--on-primary)] disabled:opacity-60">
              {busy ? "…" : "Zapisz"}
            </button>
            <button type="button" onClick={remove} disabled={busy} className="inline-flex h-9 items-center rounded-lg border border-rose-500/30 bg-rose-900/20 px-3 text-xs font-semibold text-rose-200">
              Usuń
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

/* ─────────────────────────  PAIRINGS TAB  ───────────────────────── */

function PairingsTab({
  slug,
  locale,
  dishes,
  wines,
  pairings,
  onStatus,
}: {
  slug: string;
  locale: Locale;
  dishes: ApiDish[];
  wines: ApiWine[];
  pairings: { dishId: string; wineId: string; reason: LocalizedString }[];
  onStatus: (kind: "ok" | "err", text: string) => void;
}) {
  const [activeDishId, setActiveDishId] = useState<string>(dishes[0]?.id ?? "");
  const dishOk = activeDishId && dishes.some((d) => d.id === activeDishId) ? activeDishId : (dishes[0]?.id ?? "");
  const activeDish = dishes.find((d) => d.id === dishOk);
  const pairingsForDish = useMemo(
    () => new Map(pairings.filter((p) => p.dishId === dishOk).map((p) => [p.wineId, p.reason])),
    [pairings, dishOk],
  );

  if (!activeDish) {
    return (
      <p className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
        Najpierw dodaj danie i wino.
      </p>
    );
  }

  const togglePair = async (wineId: string) => {
    if (pairingsForDish.has(wineId)) {
      try {
        await deletePairing(slug, activeDish.id, wineId);
        onStatus("ok", "Połączenie usunięte.");
      } catch (e) {
        onStatus("err", `Błąd: ${(e as Error).message}`);
      }
      return;
    }
    try {
      await upsertPairing(slug, {
        dishId: activeDish.id,
        wineId,
        reason: { en: "Balanced acidity and texture for this dish.", pl: "Zrównoważona kwasowość i tekstura dopasowana do tego dania." },
      });
      onStatus("ok", "Połączenie dodane.");
    } catch (e) {
      onStatus("err", `Błąd: ${(e as Error).message}`);
    }
  };

  const updateReason = async (wineId: string, lang: Locale, value: string) => {
    const current = pairingsForDish.get(wineId);
    if (!current) return;
    try {
      await upsertPairing(slug, {
        dishId: activeDish.id,
        wineId,
        reason: { ...current, [lang]: value },
      });
    } catch (e) {
      onStatus("err", `Błąd: ${(e as Error).message}`);
    }
  };

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-white/10 bg-[#081634] p-5">
        <p className="text-[11px] font-bold tracking-wider text-[var(--color-accent-gold)] uppercase">Wybierz danie</p>
        <select
          value={dishOk}
          onChange={(e) => setActiveDishId(e.target.value)}
          className={`${inputCls} mt-2`}
        >
          {dishes.map((d) => (
            <option key={d.id} value={d.id}>
              {t(d.name, locale)} - {d.category}
            </option>
          ))}
        </select>
      </article>

      <div className="grid gap-3 md:grid-cols-2">
        {wines.map((w) => {
          const reason = pairingsForDish.get(w.id);
          const selected = Boolean(reason);
          return (
            <article
              key={w.id}
              className={`rounded-xl border p-4 transition-colors ${
                selected ? "border-primary/45 bg-primary/8" : "border-white/10 bg-[#081634]"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-2 text-sm font-semibold text-white">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected}
                  onChange={() => togglePair(w.id)}
                />
                <span className="flex-1">
                  {t(w.name, locale)}
                  <span className="ml-2 text-[11px] font-normal text-gray-400">{w.region}</span>
                </span>
              </label>
              {selected && reason ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <textarea
                    className={`${inputCls} min-h-[60px]`}
                    placeholder="Reason (EN)" aria-label="Reason (EN)"
                    defaultValue={reason.en}
                    onBlur={(e) => updateReason(w.id, "en", e.target.value)}
                  />
                  <textarea
                    className={`${inputCls} min-h-[60px]`}
                    placeholder="Uzasadnienie (PL)" aria-label="Uzasadnienie (PL)"
                    defaultValue={reason.pl}
                    onBlur={(e) => updateReason(w.id, "pl", e.target.value)}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/12 bg-[#122446] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-[var(--color-accent-gold)] focus:outline-none";
