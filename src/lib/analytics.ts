"use client";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEvent = {
  name: string;
  payload: AnalyticsPayload;
  path: string;
  at: string;
};

const ANALYTICS_KEY = "wine_mobile_analytics_events_v1";

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

  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY);
    const current = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    const next = [...current, entry].slice(-400);
    window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage issues in private mode.
  }

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", name, payload);
  }
}
