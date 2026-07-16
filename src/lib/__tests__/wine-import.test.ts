import { describe, expect, it } from "vitest";
import {
  parseWineImport,
  parsePrice,
  normalizeStyle,
  toWinePayload,
  winePlural,
} from "@/lib/wine-import";

describe("parseWineImport — CSV with header", () => {
  it("parses comma CSV with quoted cells and a column subset", () => {
    const rows = parseWineImport(
      [
        "name,region,style,price",
        '"Château, Le Grand",Bordeaux,red,"120,50"',
        "Chablis AC,Burgundia,White,95",
        "", // empty line skipped
      ].join("\n"),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: "Château, Le Grand",
      region: "Bordeaux",
      style: "Red", // normalized from lowercase
      price: 120.5, // comma decimal
      errors: [],
    });
    expect(rows[1]).toMatchObject({ name: "Chablis AC", price: 95, errors: [] });
  });

  it("parses semicolon CSV with Polish headers", () => {
    const rows = parseWineImport(
      ["nazwa;szczep;styl;cena", "Rioja Reserva;Tempranillo;czerwone;140 zł"].join("\n"),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Rioja Reserva",
      grape: "Tempranillo",
      style: "Red",
      price: 140,
      errors: [],
    });
  });
});

describe("parseWineImport — pipe lines", () => {
  it("parses 'Name | Region | Grape | Style | Vintage | Price' and name-only lines", () => {
    const rows = parseWineImport(
      ["Barolo DOCG | Piemont | Nebbiolo | Red | 2019 | 240", "Prosecco Brut"].join("\n"),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: "Barolo DOCG",
      region: "Piemont",
      grape: "Nebbiolo",
      style: "Red",
      vintage: "2019",
      price: 240,
      errors: [],
    });
    expect(rows[1]).toMatchObject({ name: "Prosecco Brut", errors: [] });
    expect(rows[1].price).toBeNull();
  });
});

describe("parseWineImport — validation errors", () => {
  it("flags missing name, unknown style and bad price (row line numbers preserved)", () => {
    const rows = parseWineImport(
      [
        "name,style,price",
        ",Red,50", // missing name
        "Weird Wine,orange,50", // bad style
        "Pricey,White,abc", // bad price
        "OK Wine,White,50",
      ].join("\n"),
    );
    expect(rows).toHaveLength(4);
    expect(rows[0].errors.join(" ")).toContain("Brak nazwy");
    expect(rows[1].errors.join(" ")).toContain("Nieznany styl");
    expect(rows[2].errors.join(" ")).toContain("Nieprawidłowa cena");
    expect(rows[3].errors).toEqual([]);
    expect(rows[3].line).toBe(5);
  });

  it("parsePrice + normalizeStyle handle operator input variants", () => {
    expect(parsePrice("1 200,50")).toBe(1200.5);
    expect(parsePrice("$85")).toBe(85);
    expect(parsePrice("-5")).toBeNull();
    expect(parsePrice("100000")).toBeNull(); // above API cap
    expect(normalizeStyle("Rosé")).toBe("Rose");
    expect(normalizeStyle("MUSUJĄCE")).toBe("Sparkling");
    expect(normalizeStyle("orange")).toBeNull();
  });
});

describe("toWinePayload", () => {
  it("fills API-required defaults and sets both locales to the imported string", () => {
    const [row] = parseWineImport("Prosecco Brut");
    const payload = toWinePayload(row);
    expect(payload).toEqual({
      name: { en: "Prosecco Brut", pl: "Prosecco Brut" },
      notes: { en: "", pl: "" },
      region: "—", // API requires min(1)
      grape: "Blend",
      style: "White",
      vintage: undefined,
      price: 0,
    });

    const [full] = parseWineImport("Barolo | Piemont | Nebbiolo | czerwone | 2019 | 240");
    expect(toWinePayload(full)).toMatchObject({
      name: { en: "Barolo", pl: "Barolo" },
      region: "Piemont",
      style: "Red",
      vintage: "2019",
      price: 240,
    });
  });

  it("winePlural follows Polish plural rules", () => {
    expect(winePlural(1)).toBe("wino");
    expect(winePlural(3)).toBe("wina");
    expect(winePlural(5)).toBe("win");
    expect(winePlural(12)).toBe("win");
    expect(winePlural(22)).toBe("wina");
  });
});
