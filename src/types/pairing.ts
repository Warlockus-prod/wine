/**
 * Localized text — keep both languages in lockstep.
 * If only one language exists at runtime (legacy import, partial admin edit)
 * the helper `t(...)` falls back to whichever value is non-empty.
 */
export type LocalizedString = {
  en: string;
  pl: string;
};

export type PairingDish = {
  id: string;
  name: LocalizedString;
  price: number;
  description: LocalizedString;
  image: string;
  tags: string[];
};

export type WineBody = "light" | "medium" | "full";
export type WineAcidity = "low" | "medium" | "high";
export type WineTannin = "none" | "soft" | "medium" | "high";

export type WinePassport = {
  grape: string;
  abv: number;
  body: WineBody;
  acidity: WineAcidity;
  tannin: WineTannin;
  servingTempC: string;
  decant: string;
};

export type PairingWine = {
  id: string;
  name: LocalizedString;
  region: string;
  year: number;
  vintageLabel?: string;
  price: number;
  rating: number;
  description: LocalizedString;
  image: string;
  tags: string[];
  passport: WinePassport;
};

export type CuratedPairing = {
  dishId: string;
  wineId: string;
  reason: LocalizedString;
};

export type PairingDataset = {
  dishes: PairingDish[];
  wines: PairingWine[];
  pairings: CuratedPairing[];
};
