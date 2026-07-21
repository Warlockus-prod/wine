"use client";

/**
 * TasteChat - read-only-style chat with the Vinocompas guide bot.
 *
 * UX rules (per Jakub Parowski feedback in /pairing):
 *  - Bot replies in chat bubbles, no typing indicator clutter.
 *  - Guest can type free-form OR tap suggestion chips.
 *  - Chat panel adapts to mobile: chips wrap, input becomes sticky bottom.
 *
 * Talks to /api/chat (server-side OpenAI). Optional `profile` prop lets the
 * compass component pass the user's current selection so the bot grounds its
 * answers in their taste.
 */

import { useEffect, useRef, useState } from "react";
import { pickL, type CompassLang } from "@/data/wine-compass-kb";
import { getAnonymousId } from "@/lib/analytics";
import type { CompassProfile } from "./TasteCompass";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

const SUGGESTIONS_PL = [
  "Co to jest cierpkość?",
  "Jakie wino dla kogoś kto lubi tytoń?",
  "Czym różni się świeże od oleiste?",
  "Jakie wino dla kogoś kto lubi cytrusy?",
  "Co znaczy moja kombinacja na kompasie?",
];

const SUGGESTIONS_EN = [
  "What is astringency?",
  "Which wine for someone who likes tobacco?",
  "How does fresh differ from oily?",
  "Which wine for someone who likes citrus?",
  "What does my compass combination mean?",
];

/**
 * Opening line, per surface (client 2026-07-18: "в pairing предлагает помочь
 * с едой и вином, в samouczek — про Vinocompas и обучение"). The old single
 * greeting mentioned BOTH a menu and the wheel, so on either page half of it
 * was noise. Pages pass their own via the `greeting` prop; these are the
 * defaults/fallbacks.
 */
const HELLO_PL =
  "Cześć! Pomogę dobrać wino. Kliknij danie z karty albo ustaw smak na kole, a pokażę dopasowaną butelkę i wyjaśnię dlaczego. Nie wiesz od czego zacząć? Kliknij gotowe pytanie poniżej.";

const HELLO_EN =
  "Hi! I'll help you pick a wine. Tap a dish from the menu or set a taste on the wheel, and I'll show a matched bottle and explain why. Not sure where to start? Tap a ready-made question below.";

/** /samouczek — teaching the method, not selling a bottle. */
export const HELLO_SAMOUCZEK_PL =
  "Cześć! Jestem Twoim przewodnikiem po Vinocompasie. Przeprowadzę Cię przez trzy etapy: smaki, wrażenia i tendencje. Zaznacz cokolwiek na kole, a wyjaśnię, co to wrażenie znaczy i w jakich winach je spotkasz. Możesz też kliknąć gotowe pytanie poniżej.";
export const HELLO_SAMOUCZEK_EN =
  "Hi! I'm your guide to the Vinocompas. I'll walk you through three stages: tastes, sensations and tendencies. Set anything on the wheel and I'll explain what that sensation means and which wines carry it. You can also tap a ready-made question below.";

/** /pairing — a dish is on the table, the job is the bottle next to it. */
export const HELLO_PAIRING_PL =
  "Cześć! Pomogę dobrać wino do dania. Kliknij pozycję z karty, a pokażę dopasowane wino i wyjaśnię, dlaczego pasuje. Możesz też zapytać o konkretną butelkę albo o to, co podać do całego stołu.";
export const HELLO_PAIRING_EN =
  "Hi! I'll help you match wine to a dish. Tap an item from the menu and I'll show the matched wine and explain why it works. You can also ask about a specific bottle, or what to serve for the whole table.";

/** Inline emphasis: `**bold**` / `*italic*` → React nodes. The model answers
 *  in light markdown; we used to print the raw string, so replies showed
 *  literal asterisks ("wrażeniem **szorstkie**", client 2026-07-18). Built as
 *  nodes, never dangerouslySetInnerHTML — the reply is model output. */
function renderInline(s: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={`${keyBase}-b${k++}`}>{m[1]}</strong>);
    else out.push(<em key={`${keyBase}-i${k++}`}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

/** Block layer: keeps the model's line breaks and turns "- x" / "1. x" rows
 *  into hanging-indent lines so multi-step answers stay readable in a bubble. */
function renderReply(text: string): React.ReactNode {
  return text.split(/\r?\n/).map((raw, i) => {
    const key = `l${i}`;
    if (!raw.trim()) return <span key={key} className="block h-2" />;
    const bullet = raw.match(/^\s*[-•]\s+(.*)$/);
    const numbered = raw.match(/^\s*(\d+[.)])\s+(.*)$/);
    if (bullet || numbered) {
      const marker = bullet ? "·" : numbered![1];
      const body = bullet ? bullet[1] : numbered![2];
      return (
        <span key={key} className="mt-0.5 flex gap-1.5">
          <span aria-hidden className="shrink-0 opacity-70">
            {marker}
          </span>
          <span>{renderInline(body, key)}</span>
        </span>
      );
    }
    return (
      <span key={key} className="block">
        {renderInline(raw, key)}
      </span>
    );
  });
}

interface Props {
  profile?: CompassProfile;
  /** Stable storage key so we keep the conversation across reloads. */
  storageKey?: string;
  /** Page-aware context - short summary of what the user is currently
   *  looking at (e.g. "Dish: Duck Confit · Wine: Trimbach Riesling ·
   *  Restaurant: Atelier Amaro"). Sent to /api/chat as a system-level hint
   *  so the bot can ground its replies. NOT shown in the chat UI. */
  pageContext?: string;
  /** When true (the floating panel passes this), reserve right padding in the
   *  header so the panel's own absolute close-X doesn't overlap "Wyczyść". */
  headerInsetRight?: boolean;
  /** Question to auto-send once on mount/arrival. FloatingTasteChat buffers
   *  the `wn:open-chat` detail here so a prefill fired while this panel was
   *  collapsed (unmounted) is not lost. */
  prefill?: string | null;
  /** Called after the prefill has been dispatched so the parent can clear it. */
  onPrefillConsumed?: () => void;
  /** UI-chrome language. PL primary, EN at the root locale. The bot reply
   *  language already follows `document.documentElement.lang`; this prop lets
   *  the surrounding chrome (greeting, chips, buttons, placeholders, aria)
   *  match. Defaults to "pl" so existing PL call-sites are unchanged. */
  lang?: CompassLang;
  /** Contextual chips built by the page (stage / last click / visible
   *  section). Falls back to the static KB list when empty. */
  suggestions?: string[];
  /** Opening line for THIS surface (/samouczek teaches the method,
   *  /pairing matches a dish). Used for a fresh conversation and for
   *  "Wyczyść" — an existing history is never rewritten. */
  greeting?: string;
}

export default function TasteChat({
  profile,
  storageKey = "wn_taste_chat_v1",
  pageContext,
  headerInsetRight = false,
  prefill = null,
  onPrefillConsumed,
  lang = "pl",
  suggestions: suggestionsProp,
  greeting,
}: Props) {
  const hello = greeting ?? pickL(lang, HELLO_PL, HELLO_EN);
  // Contextual chips come from the page (it knows the stage / last click /
  // visible section); the static KB list is the fallback for callers that
  // don't supply any.
  const suggestions =
    suggestionsProp && suggestionsProp.length > 0
      ? suggestionsProp
      : lang === "pl"
        ? SUGGESTIONS_PL
        : SUGGESTIONS_EN;
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: hello },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  // Restore + persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const restored = (JSON.parse(raw) as ChatMessage[])
          // A reload mid-send used to resurrect the pulsing "…" bubble forever.
          .filter((m) => !m.pending);
        if (Array.isArray(restored) && restored.length > 0) {
          setMessages(restored);
        }
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, storageKey]);

  // Auto-scroll on new message
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Latest-`send` ref so deferred callers never capture a stale closure.
  // (The old window-listener here was registered with [] deps and sent with
  // the FIRST render's empty message list — wiping history — and missed the
  // event entirely while the floating panel was collapsed. The listener now
  // lives in FloatingTasteChat, which buffers the prefill into a prop.)
  const sendRef = useRef<(text: string) => void>(() => {});
  useEffect(() => {
    sendRef.current = send;
  });

  // Auto-send the buffered prefill once it arrives (defer a tick so the
  // panel has time to mount/scroll first).
  useEffect(() => {
    if (!prefill) return;
    const t = window.setTimeout(() => {
      sendRef.current(prefill);
      onPrefillConsumed?.();
    }, 80);
    return () => window.clearTimeout(t);
    // Only the prefill text itself should re-trigger the send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setInput("");
    const baseHistory = [...messages, { role: "user" as const, content: trimmed }];
    setMessages([
      ...baseHistory,
      { role: "assistant", content: "…", pending: true },
    ]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: baseHistory.map(({ role, content }) => ({ role, content })),
          profile,
          // Reply language follows the UI locale (EN page → English answers).
          locale: typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "pl",
          // Page context flows to /api/chat as a system-prompt suffix so
          // the bot knows what the user is looking at right now.
          pageContext,
          // Same per-browser id the analytics queue uses, so the server can
          // group a guest's questions into one stored conversation.
          anonymousId: getAnonymousId(),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? pickL(lang, "Błąd serwera", "Server error"));
      }
      setMessages((prev) => {
        const next = prev.slice(0, -1);
        return [...next, { role: "assistant", content: data.reply! }];
      });
    } catch (err) {
      // Server errors carry a friendly PL string; transport errors leak raw
      // English ("Failed to fetch") - keep those behind the PL fallback.
      const raw = err instanceof Error ? err.message : "";
      const msg = raw && !/failed to fetch|networkerror|load failed/i.test(raw)
        ? raw
        : pickL(
            lang,
            "Coś poszło nie tak - sprawdź połączenie i spróbuj ponownie.",
            "Something went wrong - check your connection and try again.",
          );
      setError(msg);
      setMessages((prev) => {
        const next = prev.slice(0, -1);
        return [
          ...next,
          {
            role: "assistant",
            content: pickL(
              lang,
              "Hmm, chwilowo nie mogę odpowiedzieć - spróbuj ponownie za chwilę.",
              "Hmm, I can't answer right now - please try again in a moment.",
            ),
          },
        ];
      });
    } finally {
      setSending(false);
      composerRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([{ role: "assistant", content: hello }]);
    setError(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-[rgba(199,159,105,0.32)] bg-[#081634] sm:min-h-[420px]">
      {/* Header */}
      <div className={`flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3 ${headerInsetRight ? "pr-14" : ""}`}>
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary"
            aria-hidden
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2V5a3 3 0 0 1 3-3Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] text-primary uppercase">
              Vinovigator
            </p>
            <p className="text-[11px] italic text-[var(--color-accent-gold)] opacity-80">
              {sending ? pickL(lang, "pisze…", "typing…") : "online"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[40px] items-center rounded-full border border-white/15 px-4 text-[11px] font-semibold tracking-wider text-gray-300 uppercase transition hover:border-white/35 hover:text-white"
        >
          {pickL(lang, "Wyczyść", "Clear")}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="hide-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div
              key={i}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              aria-live={m.pending ? "polite" : undefined}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${
                  isUser
                    ? "rounded-br-sm bg-white text-ink"
                    : "rounded-bl-sm border border-primary/22 bg-primary/10 text-gray-100"
                } ${m.pending ? "animate-pulse opacity-70" : ""}`}
              >
                {isUser ? m.content : renderReply(m.content)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion chips — contextual and ALWAYS present (they used to
          vanish after the second message, exactly when the guest starts
          needing prompts). The label softens once the conversation is
          running so the row doesn't keep shouting "Try asking". Chips only
          ever fire on tap: auto-sending on hover/scroll would mean invisible
          paid OpenAI calls (audit HIGH). */}
      {suggestions.length > 0 ? (
        <div className="border-t border-white/8 px-3 py-3">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.22em] text-gray-400 uppercase">
            {messages.length <= 2
              ? pickL(lang, "Spróbuj zapytać", "Try asking")
              : pickL(lang, "Zapytaj dalej", "Ask next")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={sending}
                className="rounded-full border border-[rgba(199,159,105,0.28)] bg-black/20 px-3 py-1.5 text-[12px] text-gray-200 transition hover:border-[var(--color-accent-gold)] hover:text-white disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-white/8 bg-[#081634] p-3"
      >
        <textarea
          ref={composerRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          maxLength={800}
          // Short enough to stay on ONE line next to the Send button at
          // 320-390px — the old 3-noun placeholder wrapped and its second
          // line was clipped by the 1-row box (client 2026-07-18).
          placeholder={pickL(lang, "Zapytaj o smaki i wino…", "Ask about tastes and wine…")}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-[#122446] px-3 py-2.5 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-[var(--color-accent-gold)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent-gold)]"
          aria-label={pickL(lang, "Twoje pytanie", "Your question")}
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-[color:var(--on-primary)] shadow-[0_8px_20px_rgba(199,159,105,0.3)] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "…" : pickL(lang, "Wyślij", "Send")}
          <svg width="14" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
            <path d="M1 5h15m0 0L12 1m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      {error ? (
        <p className="border-t border-rose-500/20 bg-rose-900/20 px-3 py-2 text-[11px] text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
