import { describe, it, expect } from "vitest";
import {
  resolveRetentionDays,
  RetentionConfigError,
  DEFAULT_CHAT_RETENTION_DAYS,
  MIN_CHAT_RETENTION_DAYS,
  MAX_CHAT_RETENTION_DAYS,
} from "@/lib/chat-retention";

describe("resolveRetentionDays", () => {
  it("defaults to 90 days when unset", () => {
    expect(resolveRetentionDays(undefined)).toBe(DEFAULT_CHAT_RETENTION_DAYS);
    expect(resolveRetentionDays(null)).toBe(DEFAULT_CHAT_RETENTION_DAYS);
    expect(resolveRetentionDays("")).toBe(DEFAULT_CHAT_RETENTION_DAYS);
    expect(resolveRetentionDays("   ")).toBe(DEFAULT_CHAT_RETENTION_DAYS);
  });

  it("accepts a plain integer count of days", () => {
    expect(resolveRetentionDays("30")).toBe(30);
    expect(resolveRetentionDays(" 180 ")).toBe(180);
    expect(resolveRetentionDays(String(MIN_CHAT_RETENTION_DAYS))).toBe(MIN_CHAT_RETENTION_DAYS);
    expect(resolveRetentionDays(String(MAX_CHAT_RETENTION_DAYS))).toBe(MAX_CHAT_RETENTION_DAYS);
  });

  /** The whole point of the guard: this job DELETEs, so a bad value must
   *  stop it, never silently widen or zero the window. */
  it("refuses a window that would wipe the table", () => {
    for (const bad of ["0", "1", "6"]) {
      expect(() => resolveRetentionDays(bad)).toThrow(RetentionConfigError);
    }
  });

  it("refuses values that are not plainly digits", () => {
    // "90.0" and "1e3" parse fine via Number() — that is exactly why we do not
    // use Number(); "-5" would otherwise sail past a naive `< MIN` check only
    // because it IS caught, but "0x5A" would become 90.
    for (const bad of ["90.5", "1e3", "0x5A", "ninety", "-30", "30d", "NaN", "Infinity"]) {
      expect(() => resolveRetentionDays(bad), bad).toThrow(RetentionConfigError);
    }
  });

  it("refuses an implausibly large window", () => {
    expect(() => resolveRetentionDays(String(MAX_CHAT_RETENTION_DAYS + 1))).toThrow(
      RetentionConfigError,
    );
    expect(() => resolveRetentionDays("1763654400")).toThrow(RetentionConfigError);
  });

  it("covers the widest range the admin analytics page offers", () => {
    // the page has 7/30/90-day chips; retention must not undercut them
    expect(DEFAULT_CHAT_RETENTION_DAYS).toBeGreaterThanOrEqual(90);
  });
});
