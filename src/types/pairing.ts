export type PairingDish = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  tags: string[];
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
};

export type PairingDataset = {
  dishes: PairingDish[];
  wines: PairingWine[];
};
