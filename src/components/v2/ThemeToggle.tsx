"use client";

/**
 * ThemeToggle - single-button switcher between dark and light theme.
 *
 * Behavior:
 *  - Reads/writes through `next-themes` (so it's persisted + system-aware).
 *  - Shows the icon for the OPPOSITE of the current theme (sun when dark,
 *    moon when light) - that's the conventional "what I'll switch to" cue.
 *  - Uses `resolvedTheme` instead of `theme` because `theme` can be
 *    "system" - we want the actually-rendered value.
 *  - Renders a stable placeholder pre-mount so the layout doesn't shift
 *    when next-themes hydrates.
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Icon from "@/components/v2/Icon";

interface Props {
  /** When true, renders the larger labelled variant for mobile menus. */
  withLabel?: boolean;
  className?: string;
}

export default function ThemeToggle({ withLabel, className }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // SSR-safe mount flag - required for next-themes to avoid hydration
    // mismatch. Standard pattern; the new-rules lint complains about it,
    // but there's no other way to detect "we are now in the browser".
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // SSR / pre-hydration placeholder - same dimensions, no flash.
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`theme-toggle inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 ${
          withLabel ? "h-10 px-3" : "h-10 w-10"
        } ${className ?? ""}`}
      >
        <Icon name="light_mode" className="text-[18px] opacity-0" />
      </button>
    );
  }

  const isLight = resolvedTheme === "light";
  const next = isLight ? "dark" : "light";
  const icon = isLight ? "dark_mode" : "light_mode"; // show what we'll switch TO
  const label = isLight ? "Tryb ciemny" : "Tryb jasny";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`theme-toggle group inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-current hover:bg-white/12 ${
        withLabel ? "h-10 px-3 text-xs font-semibold tracking-wider uppercase" : "h-10 w-10"
      } ${className ?? ""}`}
    >
      <Icon
        name={icon}
        className="text-[18px] transition-transform duration-300 group-hover:rotate-12"
        style={{ color: isLight ? "var(--ink-strong)" : "var(--color-accent-gold)" }}
      />
      {withLabel ? <span>{label}</span> : null}
    </button>
  );
}
