import { makeId } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import type {
  LocalizedString,
  PairingDish,
  PairingWine,
  WineAcidity,
  WineBody,
  WineTannin,
} from "@/types/pairing";

export const mirroredLocalized = (value: string): LocalizedString => ({
  en: value,
  pl: value,
});

export const setLocalized = (
  current: LocalizedString,
  locale: Locale,
  value: string,
): LocalizedString => ({
  ...current,
  [locale]: value,
});

export type ApiResponse = {
  matches?: Array<{ wineId: string; score: number; reason: string }>;
  error?: string;
};

export type ApiStatus = "idle" | "loading" | "ready" | "error";

export type AdminMobileTab = "dishes" | "wines";

export const parseTags = (input: string) =>
  input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);

export const toTagInput = (tags: string[]) => tags.join(", ");

export const bodyOptions: WineBody[] = ["light", "medium", "full"];
export const acidityOptions: WineAcidity[] = ["low", "medium", "high"];
export const tanninOptions: WineTannin[] = ["none", "soft", "medium", "high"];

const ROMAN = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
];
export const toRoman = (n: number): string => {
  if (n <= 20) return ROMAN[n] ?? String(n);
  // simple fallback for larger lists
  const map: Array<[number, string]> = [
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let v = n;
  for (const [val, sym] of map) {
    while (v >= val) {
      out += sym;
      v -= val;
    }
  }
  return out;
};

export type DishFormState = {
  name: string;
  price: string;
  description: string;
  image: string;
  tags: string;
};

export const initialDishForm: DishFormState = {
  name: "",
  price: "24",
  description: "",
  image: "",
  tags: "Main, Signature",
};

export type WineFormState = {
  name: string;
  region: string;
  year: string;
  price: string;
  rating: string;
  description: string;
  image: string;
  tags: string;
  grape: string;
  abv: string;
  body: WineBody;
  acidity: WineAcidity;
  tannin: WineTannin;
  servingTempC: string;
  decant: string;
};

export const initialWineForm: WineFormState = {
  name: "",
  region: "",
  year: "2021",
  price: "52",
  rating: "4.3",
  description: "",
  image: "",
  tags: "Balanced, Pairing",
  grape: "Blend",
  abv: "13",
  body: "medium",
  acidity: "medium",
  tannin: "soft",
  servingTempC: "10-14",
  decant: "No decant.",
};

export const buildDish = (dishForm: DishFormState): PairingDish => ({
  id: makeId("dish"),
  name: mirroredLocalized(dishForm.name.trim()),
  price: Math.max(1, Number(dishForm.price) || 1),
  description: mirroredLocalized(dishForm.description.trim()),
  image: dishForm.image.trim(),
  tags: parseTags(dishForm.tags),
});

export const buildWine = (wineForm: WineFormState): PairingWine => ({
  id: makeId("wine"),
  name: mirroredLocalized(wineForm.name.trim()),
  region: wineForm.region.trim(),
  year: Math.max(1900, Number(wineForm.year) || 2021),
  price: Math.max(1, Number(wineForm.price) || 1),
  rating: Math.min(5, Math.max(1, Number(wineForm.rating) || 4)),
  description: mirroredLocalized(
    wineForm.description.trim() || "Pairing-friendly wine profile.",
  ),
  image: wineForm.image.trim(),
  tags: parseTags(wineForm.tags),
  passport: {
    grape: wineForm.grape.trim() || "Blend",
    abv: Math.max(5, Math.min(20, Number(wineForm.abv) || 13)),
    body: wineForm.body,
    acidity: wineForm.acidity,
    tannin: wineForm.tannin,
    servingTempC: wineForm.servingTempC.trim() || "10-14",
    decant: wineForm.decant.trim() || "No decant.",
  },
});
