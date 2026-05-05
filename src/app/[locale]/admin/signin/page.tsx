"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

// Sign-in is interactive; no value in pre-rendering. Forces this page to
// render at request-time so useSearchParams() works without Suspense
// gymnastics.
export const dynamic = "force-dynamic";

function SignInForm() {
  const search = useSearchParams();
  const status = search.get("status");
  const returnTo = search.get("returnTo") ?? "/admin";
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(status === "check-email");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    setError(null);
    try {
      const result = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl: returnTo,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coś poszło nie tak");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-[rgba(197,160,89,0.32)] bg-[#150a0c] p-7">
      <p className="text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
        Cellar Compass
      </p>
      <h1 className="pitch-display mt-3 text-3xl text-white">Logowanie do panelu</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#cbc1b1]">
        Wpisz email — wyślemy magic-link, kliknięcie zaloguje cię bez hasła.
      </p>

      {done ? (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-900/20 p-4 text-sm text-emerald-100">
          <p className="font-semibold">Sprawdź skrzynkę.</p>
          <p className="mt-1 text-emerald-200/85">
            Wysłaliśmy link logowania na <span className="font-mono">{email}</span>. Klikniesz — wrócisz prosto do panelu.
          </p>
          <p className="mt-3 text-[11px] italic text-emerald-300/70">
            Jeśli SMTP jeszcze nie skonfigurowane — link pojawi się w logach kontenera (admin VPS-a wie skąd wziąć).
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold tracking-wide text-gray-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ty@restauracja.pl"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1a0e10] px-3 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-[var(--color-accent-gold)] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !email}
            className="pitch-cta-primary w-full justify-center"
          >
            {pending ? "Wysyłanie…" : "Wyślij magic-link"}
          </button>
          {error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-900/20 p-2 text-xs text-rose-200">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="mobile-safe-bottom flex min-h-screen flex-col items-center justify-center bg-background-dark px-5 py-12">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-3xl bg-white/5" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
