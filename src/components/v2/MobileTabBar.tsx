"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/pairing", label: "Pairing", icon: "wine_bar" },
  { href: "/v1", label: "Backup", icon: "inventory_2" },
  { href: "/v1/admin", label: "Admin", icon: "settings" },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-[70] border-t border-white/10 bg-[#120a0ccc] px-2 pt-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href === "/v1" && pathname.startsWith("/v1/restaurants/")) ||
            (tab.href !== "/" &&
              tab.href !== "/v1" &&
              pathname.startsWith(`${tab.href}/`));

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center rounded-lg px-2 py-2 text-[11px] font-semibold ${
                  active ? "bg-primary/20 text-primary" : "text-gray-300"
                }`}
              >
                <span className="material-icons text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
