"use client";

import { Capacitor } from "@capacitor/core";
import { Bell, Home, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type TabItem = {
  key: string;
  label: string;
  href: string;
  icon: typeof Home;
  isActive: (pathname: string) => boolean;
};

const TAB_ITEMS: TabItem[] = [
  {
    key: "home",
    label: "Home",
    href: "/",
    icon: Home,
    isActive: (pathname) => pathname === "/",
  },
  {
    key: "alerts",
    label: "Alerts",
    href: "/headlines",
    icon: Bell,
    isActive: (pathname) => pathname === "/headlines" || pathname.startsWith("/headlines/"),
  },
  {
    key: "scores",
    label: "Scores",
    href: "/schedule",
    icon: Trophy,
    isActive: (pathname) =>
      pathname === "/schedule" ||
      pathname.startsWith("/schedule/") ||
      pathname === "/standings" ||
      pathname.startsWith("/standings/"),
  },
  {
    key: "account",
    label: "Account",
    href: "/account",
    icon: User,
    isActive: (pathname) =>
      pathname === "/account" ||
      pathname.startsWith("/account/") ||
      pathname === "/sign-in" ||
      pathname.startsWith("/sign-in/") ||
      pathname === "/sign-up" ||
      pathname.startsWith("/sign-up/"),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const [showTabs, setShowTabs] = useState(false);

  useEffect(() => {
    setShowTabs(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios");
  }, []);

  if (!showTabs) return null;

  return (
    <>
      <div className="md:hidden h-[calc(68px+env(safe-area-inset-bottom,0px))]" aria-hidden="true" />
      <nav
        aria-label="Bottom navigation"
        className="md:hidden fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[hsl(0_0%_3.9%)/0.96] px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] backdrop-blur-xl"
      >
        <ul className="mx-auto flex max-w-md items-center gap-1">
          {TAB_ITEMS.map((tab) => {
            const active = tab.isActive(pathname);
            const Icon = tab.icon;
            return (
              <li key={tab.key} className="flex-1">
                <Link
                  href={tab.href}
                  className={`flex min-h-[56px] flex-col items-center justify-center rounded-xl text-[11px] font-semibold transition-colors ${
                    active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <Icon className={`mb-1 h-5 w-5 ${active ? "text-white" : "text-white/70"}`} />
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
