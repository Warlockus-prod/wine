import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of next/link, useRouter, redirect, usePathname.
// Use these everywhere instead of next/link / next/navigation so URLs get the
// right locale prefix automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
