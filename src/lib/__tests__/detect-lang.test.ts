import { describe, it, expect } from "vitest";
import { detectLang, LANG_NAME } from "../detect-lang";

describe("detectLang", () => {
  it("detects Cyrillic languages by script, splitting uk from ru", () => {
    expect(detectLang("что такое винокомпас")).toBe("ru");
    expect(detectLang("какое вино к рыбе?")).toBe("ru");
    // Ukrainian-only letters (і/ї/є/ґ) win over the generic Cyrillic branch
    expect(detectLang("Яке вино підходить до риби?")).toBe("uk");
    expect(detectLang("Що це за вино і чому?")).toBe("uk");
  });

  it("falls back to Russian for Cyrillic with no Ukrainian-only letter", () => {
    // Documented limitation: "яке вино до риби" shares its entire alphabet
    // with Russian, so it is reported as ru. Acceptable — the reply language
    // is still Cyrillic and readable to the guest.
    expect(detectLang("яке вино до риби")).toBe("ru");
  });

  it("detects Polish from its diacritics or its stop words", () => {
    expect(detectLang("Co to jest cierpkość?")).toBe("pl");
    expect(detectLang("Czym różni się świeże od oleiste?")).toBe("pl");
    // no diacritics at all — must still land on Polish via the word vote
    expect(detectLang("jakie wino dla kogo lubi tyton")).toBe("pl");
  });

  it("detects English", () => {
    expect(detectLang("What is astringency?")).toBe("en");
    expect(detectLang("which wine for fish")).toBe("en");
  });

  it("detects other guest languages", () => {
    expect(detectLang("Was ist Gerbstoff?")).toBe("de");
    expect(detectLang("Welcher Wein passt zu Fisch?")).toBe("de");
    expect(detectLang("Quel vin pour le poisson ?")).toBe("fr");
    expect(detectLang("¿Qué vino para el pescado?")).toBe("es");
  });

  it("returns unknown when there is no language signal", () => {
    expect(detectLang("ok")).toBe("unknown");
    expect(detectLang("👍")).toBe("unknown");
    expect(detectLang("2016")).toBe("unknown");
    expect(detectLang("")).toBe("unknown");
    expect(detectLang("   ")).toBe("unknown");
  });

  it("never returns a language without a display name", () => {
    for (const probe of ["что", "Co to jest?", "What is it?", "Was ist das?"]) {
      const l = detectLang(probe);
      if (l !== "unknown") expect(LANG_NAME[l]).toBeTruthy();
    }
  });
});
