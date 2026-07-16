"use client";

/**
 * TasteChat - read-only-style chat with the Vinokompas guide bot.
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

const HELLO_PL =
  "Cześć! Pomogę dobrać wino. Zrób tak: 1) kliknij danie z menu albo ustaw smak na kompasie, 2) a ja od razu pokażę dopasowane wino i wyjaśnię dlaczego. Nie wiesz od czego zacząć? Kliknij gotowe pytanie poniżej.";

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
}

export default function TasteChat({
  profile,
  storageKey = "wn_taste_chat_v1",
  pageContext,
  headerInsetRight = false,
  prefill = null,
  onPrefillConsumed,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: HELLO_PL },
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
        const restored = JSON.parse(raw) as ChatMessage[];
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
          // Page context flows to /api/chat as a system-prompt suffix so
          // the bot knows what the user is looking at right now.
          pageContext,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? "Błąd serwera");
      }
      setMessages((prev) => {
        const next = prev.slice(0, -1);
        return [...next, { role: "assistant", content: data.reply! }];
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Coś poszło nie tak.";
      setError(msg);
      setMessages((prev) => {
        const next = prev.slice(0, -1);
        return [
          ...next,
          {
            role: "assistant",
            content: "Hmm, chwilowo nie mogę odpowiedzieć - spróbuj ponownie za chwilę.",
          },
        ];
      });
    } finally {
      setSending(false);
      composerRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([{ role: "assistant", content: HELLO_PL }]);
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
              {sending ? "pisze…" : "online"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[40px] items-center rounded-full border border-white/15 px-4 text-[11px] font-semibold tracking-wider text-gray-300 uppercase transition hover:border-white/35 hover:text-white"
        >
          Wyczyść
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
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion chips */}
      {messages.length <= 2 ? (
        <div className="border-t border-white/8 px-3 py-3">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.22em] text-gray-400 uppercase">
            Spróbuj zapytać
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS_PL.map((s) => (
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
          placeholder="Zapytaj o smaki, wrażenia, wino…"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-[#122446] px-3 py-2.5 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-[var(--color-accent-gold)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent-gold)]"
          aria-label="Twoje pytanie"
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-[color:var(--on-primary)] shadow-[0_8px_20px_rgba(199,159,105,0.3)] transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "…" : "Wyślij"}
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
