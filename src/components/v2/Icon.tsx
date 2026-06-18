/**
 * Inline-SVG icon set - replaces the Material Symbols web font for all app
 * chrome (nav, tab bar, theme toggle, chat). The font approach flashed the
 * ligature NAME ("light_mode", "settings") while loading and sometimes never
 * resolved over mobile networks, overlapping the wordmark. These SVGs have no
 * external dependency: they render instantly, inherit `currentColor`, and size
 * to the surrounding font-size (1em), so existing `text-base`/`text-sm` classes
 * keep working as drop-in replacements for the old <span class="material-icons">.
 */
import type { CSSProperties } from "react";

export type IconName =
  | "wine_bar"
  | "light_mode"
  | "dark_mode"
  | "menu"
  | "close"
  | "smartphone"
  | "person"
  | "travel_explore"
  | "settings"
  | "smart_toy"
  | "star"
  | "arrow_forward"
  | "auto_awesome"
  | "swipe"
  | "restaurant_menu";

const STROKE: Partial<Record<IconName, true>> = {
  menu: true,
  close: true,
  arrow_forward: true,
  light_mode: true,
  travel_explore: true,
  swipe: true,
  settings: true,
  smart_toy: true,
  restaurant_menu: true,
};

function paths(name: IconName) {
  switch (name) {
    case "wine_bar":
      return (
        <>
          <path d="M6 3h12l-.8 6.2A5.2 5.2 0 0 1 13 13.8V18h3v2H8v-2h3v-4.2A5.2 5.2 0 0 1 6.8 9.2L6 3z" fill="currentColor" />
        </>
      );
    case "light_mode":
      return (
        <>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
          <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "dark_mode":
      return <path d="M21 12.9A9 9 0 1 1 11.1 3a7 7 0 0 0 9.9 9.9z" fill="currentColor" />;
    case "menu":
      return <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
    case "close":
      return <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
    case "smartphone":
      return (
        <>
          <rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "person":
      return (
        <>
          <circle cx="12" cy="8" r="3.8" fill="currentColor" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0z" fill="currentColor" />
        </>
      );
    case "travel_explore":
      return (
        <>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M3 11h16M11 3a13 13 0 0 1 0 16M11 3a13 13 0 0 0 0 16" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </>
      );
    case "settings":
      return (
        <>
          <path
            d="M19.1 12.9a7.6 7.6 0 0 0 0-1.9l2-1.5-2-3.4-2.3.9a7 7 0 0 0-1.6-1l-.4-2.5H9.2l-.4 2.5a7 7 0 0 0-1.6 1l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 1.9l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 1.6 1l.4 2.5h5.6l.4-2.5a7 7 0 0 0 1.6-1l2.3.9 2-3.4-2-1.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </>
      );
    case "smart_toy":
      return (
        <>
          <path d="M12 2.5v2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="4" y="5" width="16" height="13" rx="3.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="9.2" cy="11.2" r="1.3" fill="currentColor" />
          <circle cx="14.8" cy="11.2" r="1.3" fill="currentColor" />
          <path d="M9.5 14.8h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M2.5 10v4M21.5 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "star":
      return <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" fill="currentColor" />;
    case "arrow_forward":
      return <path d="M5 12h13M12.5 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
    case "auto_awesome":
      return (
        <>
          <path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" fill="currentColor" />
          <path d="M18.5 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" fill="currentColor" />
        </>
      );
    case "swipe":
      return (
        <>
          <path d="M9 11V5.5a1.6 1.6 0 0 1 3.2 0V11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M12.2 9.2a1.5 1.5 0 0 1 3 0V11M15.2 10a1.5 1.5 0 0 1 3 0v3.5a5.5 5.5 0 0 1-5.5 5.5h-1.4a4 4 0 0 1-3-1.4L5 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "restaurant_menu":
      return (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    default:
      return null;
  }
}

export default function Icon({
  name,
  className,
  style,
  title,
}: {
  name: IconName | string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const fill = STROKE[name as IconName] ? "none" : "currentColor";
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill={fill}
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {paths(name as IconName)}
    </svg>
  );
}
