"use client";

/**
 * Client analytics — localStorage trail + batched ingest to /api/events.
 *
 * trackEvent(name, payload) keeps the original behaviour (local ring buffer +
 * optional gtag) AND, when the name maps onto one of the server-side
 * CLIENT_EVENT_TYPES, enqueues the event for /api/events. The queue flushes
 * as a batch (max 50 per the API contract) every few seconds, at 12 queued
 * events, or when the tab hides (sendBeacon so nothing is lost on close).
 *
 * Ids: browsers know public SLUGs / external ids, not DB uuids — so the
 * restaurant slug travels as `restaurantSlug` (resolved server-side into the
 * indexed restaurant_id column) and dish/wine external ids ride in props.
 */

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEvent = {
  name: string;
  payload: AnalyticsPayload;
  path: string;
  at: string;
};

const ANALYTICS_KEY = "wine_mobile_analytics_events_v1";
const ANON_KEY = "wn_anon_id_v1";

// Local name → server CLIENT_EVENT_TYPES (see src/app/api/events/route.ts).
// Names not in this map stay local-only (debug/perf breadcrumbs).
const SERVER_TYPE_BY_NAME: Record<string, string> = {
  page_view: "page_view",
  pairing_page_open: "page_view",
  restaurant_view: "restaurant_view",
  dish_select: "dish_select",
  pairing_dish_selected: "dish_select",
  wine_select: "wine_select",
  pairing_wine_selected: "wine_select",
  pairing_request: "pairing_request",
  pairing_ai_success: "pairing_request",
  pairing_ai_fallback: "pairing_request",
  compass_intensity_set: "compass_intensity_set",
};

interface ServerEvent {
  type: string;
  restaurantSlug?: string;
  sessionId?: string;
  anonymousId?: string;
  props: Record<string, unknown>;
}

const queue: ServerEvent[] = [];
let flushTimer: number | null = null;

/** Stable per-browser UUID, shared by the event queue AND the chat route so
 *  a guest's questions group into one conversation server-side. */
export function getAnonymousId(): string | undefined {
  return anonymousId();
}

function anonymousId(): string | undefined {
  try {
    let v = window.localStorage.getItem(ANON_KEY);
    if (!v) {
      v = crypto.randomUUID();
      window.localStorage.setItem(ANON_KEY, v);
    }
    return v;
  } catch {
    return undefined;
  }
}

function flush(useBeacon = false) {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 50);
  const body = JSON.stringify(batch);
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* analytics must never surface errors */
    });
  } catch {
    /* ignore */
  }
}

function scheduleFlush() {
  if (queue.length >= 12) {
    if (flushTimer !== null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
    flush();
    return;
  }
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flush();
  }, 4000);
}

let lifecycleHooked = false;
function hookLifecycle() {
  if (lifecycleHooked) return;
  lifecycleHooked = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const entry: AnalyticsEvent = {
    name,
    payload,
    path: window.location.pathname,
    at: new Date().toISOString(),
  };

  // 1) Local ring buffer (unchanged behaviour — handy for debugging).
  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY);
    const current = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    const next = [...current, entry].slice(-400);
    window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage issues in private mode.
  }

  // 2) Optional gtag passthrough (unchanged).
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", name, payload);
  }

  // 3) Server ingest for the whitelisted, dashboard-relevant types.
  const type = SERVER_TYPE_BY_NAME[name];
  if (!type) return;
  hookLifecycle();
  const { restaurant_slug: restaurantSlug, ...rest } = payload;
  queue.push({
    type,
    ...(typeof restaurantSlug === "string" && restaurantSlug ? { restaurantSlug } : {}),
    anonymousId: anonymousId(),
    props: { name, path: entry.path, ...rest },
  });
  scheduleFlush();
}
