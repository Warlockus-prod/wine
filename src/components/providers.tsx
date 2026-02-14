"use client";

import { ReactNode } from "react";
import { RestaurantsProvider } from "@/context/restaurants-context";

export function Providers({ children }: { children: ReactNode }) {
  return <RestaurantsProvider>{children}</RestaurantsProvider>;
}
