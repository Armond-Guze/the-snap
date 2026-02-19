"use client";

import { ReactNode, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Home as HomeIcon,
  Menu,
  Newspaper,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { NAV_ITEMS, type NavItem } from "./navConfig";
import ProfileMenu from "./ProfileMenu";
import SmartSearch from "./SmartSearch";
import ThemeToggle from "./ThemeToggle";
import { TEAM_META } from "@/lib/schedule";
import { TEAM_COLORS } from "./teamLogos";

const DIVISION_GROUPS: { title: string; teams: (keyof typeof TEAM_META)[] }[] = [
  { title: "AFC East", teams: ["BUF", "MIA", "NE", "NYJ"] },
  { title: "AFC North", teams: ["BAL", "CIN", "CLE", "PIT"] },
  { title: "AFC South", teams: ["HOU", "IND", "JAX", "TEN"] },
  { title: "AFC West", teams: ["DEN", "KC", "LAC", "LV"] },
  { title: "NFC East", teams: ["DAL", "NYG", "PHI", "WAS"] },
  { title: "NFC North", teams: ["CHI", "DET", "GB", "MIN"] },
  { title: "NFC South", teams: ["ATL", "CAR", "NO", "TB"] },
  { title: "NFC West", teams: ["ARI", "LAR", "SEA", "SF"] },
];

const MOBILE_TEAM_CODES: (keyof typeof TEAM_META)[] = ["KC", "BUF", "PHI", "DAL", "SF", "DET", "BAL", "MIA"];
const FANTASY_NAV_ITEM: NavItem = { key: "fantasy", label: "Fantasy", href: "/fantasy" };

function shouldKeepFantasyInMainNav(now = new Date()): boolean {
  const override = process.env.NEXT_PUBLIC_FANTASY_NAV_MODE?.trim().toLowerCase();
  if (override === "main") return true;
  if (override === "more") return false;

  const month = now.getUTCMonth(); // 0=Jan ... 11=Dec
  return month >= 7 || month <= 0;
}

function insertAfterKey(items: NavItem[], key: string, item: NavItem): NavItem[] {
  if (items.some((entry) => entry.key === item.key)) return items;
  const idx = items.findIndex((entry) => entry.key === key);
  if (idx === -1) return [...items, item];
  return [...items.slice(0, idx + 1), item, ...items.slice(idx + 1)];
}

function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function slugifyTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function resolveTeamCode(pathname: string): string | undefined {
  const teamMatch = pathname.match(/^\/teams\/([a-z0-9-]+)/i);
  const teamSlug = teamMatch?.[1]?.toLowerCase();
  if (!teamSlug) return undefined;
  if (TEAM_META[teamSlug.toUpperCase()]) return teamSlug.toUpperCase();
  return Object.entries(TEAM_META).find(([, meta]) => slugifyTeamName(meta.name) === teamSlug)?.[0];
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const teamCode = resolveTeamCode(pathname);
  const teamAccent = teamCode && TEAM_COLORS[teamCode] ? TEAM_COLORS[teamCode] : null;

  const homeNavItem: NavItem = { key: "home", label: "Home", href: "/" };
  const desktopBaseNavItems: NavItem[] = [homeNavItem, ...NAV_ITEMS];
  const mobileBaseNavItems: NavItem[] = pathname === "/" ? NAV_ITEMS : [homeNavItem, ...NAV_ITEMS];

  const showFantasyInMainNav = shouldKeepFantasyInMainNav();
  const navItems = showFantasyInMainNav
    ? insertAfterKey(desktopBaseNavItems, "headlines", FANTASY_NAV_ITEM)
    : desktopBaseNavItems;
  const mobileNavItems = showFantasyInMainNav
    ? insertAfterKey(mobileBaseNavItems, "headlines", FANTASY_NAV_ITEM)
    : mobileBaseNavItems;
  const moreItems = showFantasyInMainNav ? [] : [FANTASY_NAV_ITEM];
  const singleMoreItem = moreItems.length === 1 ? moreItems[0] : null;
  const hasDropdownMore = moreItems.length > 1;
  const mobileMenuItems = singleMoreItem ? [...mobileNavItems, singleMoreItem] : mobileNavItems;

  const navIcons: Record<string, ReactNode> = {
    home: <HomeIcon className="h-4 w-4" />,
    headlines: <Newspaper className="h-4 w-4" />,
    standings: <BarChart3 className="h-4 w-4" />,
    draft: <BookOpen className="h-4 w-4" />,
    "power-rankings": <TrendingUp className="h-4 w-4" />,
    fantasy: <Sparkles className="h-4 w-4" />,
    calendar: <CalendarDays className="h-4 w-4" />,
    schedule: <CalendarDays className="h-4 w-4" />,
    tankathon: <Target className="h-4 w-4" />,
  };

  return (
    <nav
      className="theme-nav relative sticky top-0 z-[60] shadow-2xl"
      style={
        teamAccent
          ? {
              borderBottomColor: teamAccent,
              boxShadow: `0 8px 30px -12px ${teamAccent}66`,
              backgroundImage: `linear-gradient(90deg, ${teamAccent}66 0%, ${teamAccent}55 55%, ${teamAccent}44 100%)`,
            }
          : undefined
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-[84rem] items-center px-4 md:px-6 2xl:max-w-[92rem] 3xl:max-w-[102rem]">
        <div className="flex items-center md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className="mr-2 h-10 w-10 text-white hover:bg-white/10 hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="h-full w-[300px] max-w-[84%] border-r border-white/10 bg-[hsl(0_0%_3.9%)] p-0 text-white backdrop-blur-xl supports-[backdrop-filter]:bg-[hsl(0_0%_3.9%)/0.92] sm:max-w-[84%]"
            >
              <div className="border-b border-white/10 px-4 py-4">
                <SheetClose asChild>
                  <Link href="/" className="inline-flex items-center overflow-visible">
                    <span className="relative -my-1 block h-[2.7rem] w-[102px]">
                      <Image
                        src="/images/thesnap-logo-new%20copy123.png"
                        alt="The Snap Logo"
                        fill
                        sizes="120px"
                        className="object-contain"
                      />
                    </span>
                  </Link>
                </SheetClose>

                <SheetHeader className="mt-3 space-y-1 text-left">
                  <SheetTitle className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                    Navigation
                  </SheetTitle>
                  <SheetDescription className="text-xs text-white/55">
                    Browse The Snap sections and team pages.
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 text-white">
                <div className="rounded-xl bg-white/[0.04] p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Theme</p>
                  <ThemeToggle />
                </div>

                <div className="space-y-1.5">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Menu</p>
                  {mobileMenuItems.map(({ label, href, key }) => {
                    const isActive = isPathActive(pathname, href);
                    const itemKey = key || label.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <SheetClose asChild key={key || label}>
                        <Button
                          asChild
                          variant="ghost"
                          className={cn(
                            "h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-sm font-semibold",
                            isActive
                              ? "bg-white/[0.12] text-white hover:bg-white/[0.16] hover:text-white"
                              : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                          )}
                        >
                          <Link href={href}>
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/85">
                              {navIcons[itemKey] || <Sparkles className="h-4 w-4" />}
                            </span>
                            <span>{label}</span>
                          </Link>
                        </Button>
                      </SheetClose>
                    );
                  })}
                </div>

                {hasDropdownMore && (
                  <div className="space-y-1.5">
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">More</p>
                    {moreItems.map(({ key, label, href }) => {
                      const isActive = isPathActive(pathname, href);
                      const itemKey = key || label.toLowerCase().replace(/\s+/g, "-");
                      return (
                        <SheetClose asChild key={key || label}>
                          <Button
                            asChild
                            variant="ghost"
                            className={cn(
                              "h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-sm font-semibold",
                              isActive
                                ? "bg-white/[0.12] text-white hover:bg-white/[0.16] hover:text-white"
                                : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                            )}
                          >
                            <Link href={href}>
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/85">
                                {navIcons[itemKey] || <Sparkles className="h-4 w-4" />}
                              </span>
                              <span>{label}</span>
                            </Link>
                          </Button>
                        </SheetClose>
                      );
                    })}
                  </div>
                )}

                <div className="rounded-xl bg-white/[0.04] p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Search</p>
                  <form action="/headlines" method="GET" className="relative">
                    <input
                      type="text"
                      name="search"
                      placeholder="Search articles..."
                      className="w-full rounded-lg bg-white/10 px-3 py-2 pl-10 text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-white/30"
                    />
                    <svg
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </form>
                </div>

                <div>
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Popular Teams</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {MOBILE_TEAM_CODES.map((code) => {
                      const meta = TEAM_META[code];
                      const accent = TEAM_COLORS[code] || "#9ca3af";
                      return (
                        <SheetClose asChild key={code}>
                          <Link
                            href={`/teams/${slugifyTeamName(meta?.name || code)}`}
                            className="rounded-lg px-2 py-2 text-center font-bold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: `${accent}44` }}
                          >
                            {code}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/40">© {new Date().getFullYear()} The Snap</div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 justify-center md:justify-start">
          <Link href="/" className="group inline-flex items-center overflow-visible">
            <span className="relative -my-0.5 block h-[2rem] w-[78px] md:h-[2.2rem] md:w-[86px]">
              <Image
                src="/images/thesnap-logo-new%20copy123.png"
                alt="The Snap Logo"
                fill
                sizes="(min-width: 768px) 140px, 120px"
                className="object-contain"
              />
            </span>
          </Link>
        </div>

        <div className="mx-6 hidden flex-1 items-center md:flex">
          <NavigationMenu className="w-full justify-start">
            <NavigationMenuList className="gap-1.5">
              {navItems.map(({ label, href, key }) => {
                if (key === "schedule") return null;

                if (key === "standings") {
                  const isTeamsActive =
                    pathname.startsWith("/standings") ||
                    pathname.startsWith("/schedule") ||
                    pathname.startsWith("/teams");

                  return (
                    <NavigationMenuItem key="teams">
                      <NavigationMenuTrigger
                        className={cn(
                          isTeamsActive ? "bg-white/10 text-white" : "text-white/65 hover:text-white",
                          "px-4 text-[15px]"
                        )}
                      >
                        Teams
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="max-w-[90vw] p-5 md:w-[860px]">
                        <div className="grid grid-cols-4 gap-6">
                          {DIVISION_GROUPS.map((group) => (
                            <div key={group.title} className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{group.title}</p>
                              <div className="flex flex-col space-y-1">
                                {group.teams.map((code) => {
                                  const meta = TEAM_META[code];
                                  const nickname = meta?.name ? meta.name.split(" ").slice(-1).join(" ") : code;
                                  const accent = TEAM_COLORS[code] || "#9ca3af";
                                  return (
                                    <Link
                                      key={code}
                                      href={`/teams/${slugifyTeamName(meta?.name || code)}`}
                                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-white/85 transition-colors hover:text-white"
                                      style={{ backgroundColor: `${accent}33` }}
                                    >
                                      <span>{nickname}</span>
                                      <span className="text-[11px] font-bold text-white">{code}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                          <Link
                            href="/standings"
                            className={cn(
                              "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                              pathname.startsWith("/standings")
                                ? "border-white/30 bg-white/10 text-white"
                                : "border-white/10 text-white/85 hover:border-white/20 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            NFL Standings
                          </Link>
                          <Link
                            href="/schedule"
                            className={cn(
                              "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
                              pathname.startsWith("/schedule")
                                ? "border-white/30 bg-white/10 text-white"
                                : "border-white/10 text-white/85 hover:border-white/20 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            Schedule
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }

                const isActive = isPathActive(pathname, href);
                return (
                  <NavigationMenuItem key={key || label}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={href}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "px-4 text-[15px]",
                          isActive ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}

              {singleMoreItem && (
                <NavigationMenuItem key={singleMoreItem.key}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={singleMoreItem.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "px-4 text-[15px]",
                        isPathActive(pathname, singleMoreItem.href)
                          ? "bg-white/10 text-white"
                          : "text-white/65 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {singleMoreItem.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {hasDropdownMore && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="px-4 text-[15px] text-white/65 hover:text-white">More</NavigationMenuTrigger>
                  <NavigationMenuContent className="p-2 md:w-44">
                    <div className="flex flex-col gap-1">
                      {moreItems.map((item) => (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                            isPathActive(pathname, item.href)
                              ? "bg-white/10 text-white"
                              : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <SmartSearch />
          </div>
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </nav>
  );
}
