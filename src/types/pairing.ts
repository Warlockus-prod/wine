export type PairingDish = {
  id: string;
  name: string;
  price: number;
  description: string;
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
  name: string;
  region: string;
  year: number;
  price: number;
  rating: number;
  description: string;
  image: string;
  tags: string[];
  passport: WinePassport;
};

export type PairingDataset = {
  dishes: PairingDish[];
  wines: PairingWine[];
};
