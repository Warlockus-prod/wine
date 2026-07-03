"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Icon, { type IconName } from "@/components/v2/Icon";

const GUEST_TABS: { href: string; key: "home" | "pairing"; icon: IconName }[] = [
  { href: "/", key: "home", icon: "travel_explore" },
  { href: "/pairing", key: "pairing", icon: "wine_bar" },
];

export default function MobileTabBar() {
  // Locale-stripped pathname (@/i18n/navigation) so active/admin checks work in
  // both EN (root) and PL (/pl) without the prefix breaking the match.
  const pathname = usePathname();
  const tx = useTranslations("nav");

  // The Admin tab is an operator surface — a QR guest must never see (or tap
  // into) the editor chrome. Only include it while already inside /admin so
  // operators keep the nav there.
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const tabs = inAdmin
    ? [...GUEST_TABS, { href: "/admin", key: "admin" as const, icon: "settings" as IconName }]
    : GUEST_TABS;

  return (
    <nav
      aria-label={tx("bottomNav")}
      className="fixed right-0 bottom-0 left-0 z-[70] border-t border-white/10 bg-[#0b1f44cc] px-2 pt-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      <ul className={`grid gap-1 ${tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(`${tab.href}/`));

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg px-3 py-2.5 text-[12px] font-semibold ${
                  active ? "bg-primary/20 text-primary" : "text-gray-300"
                }`}
              >
                <Icon name={tab.icon} className="text-base" />
                <span>{tx(tab.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
