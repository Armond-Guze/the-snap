"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SmartSearch from "./SmartSearch";
import ProfileMenu from "./ProfileMenu";
import { NAV_ITEMS } from "./navConfig";
import { TEAM_META } from "@/lib/schedule";
import { TEAM_COLORS } from "./teamLogos";
import { Newspaper, BarChart3, TrendingUp, Sparkles, CalendarDays, Target, Home as HomeIcon, ChevronDown, Menu, X } from "lucide-react";

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

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const teamsCloseTimeout = useRef<number | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const teamMatch = pathname.match(/^\/teams\/([a-z0-9-]+)/i);
  const teamSlug = teamMatch?.[1]?.toLowerCase();
  const slugifyTeamName = (name: string) => name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const teamCode = teamSlug && TEAM_META[teamSlug.toUpperCase()]
    ? teamSlug.toUpperCase()
    : teamSlug
      ? Object.entries(TEAM_META).find(([, meta]) => slugifyTeamName(meta.name) === teamSlug)?.[0]
      : undefined;
  const teamAccent = teamCode && TEAM_COLORS[teamCode] ? TEAM_COLORS[teamCode] : null;

  const closeAllMenus = useCallback(() => {
    setMenuOpen(false);
    setTeamsOpen(false);
  }, []);

  const handleLinkClick = () => setMenuOpen(false);

  const firstFocusable = useRef<HTMLButtonElement | null>(null);
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllMenus();
      if (e.key === "Tab" && menuOpen) {
        const panel = document.getElementById("mega-menu-panel");
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    },
    [menuOpen, closeAllMenus]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        closeAllMenus();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllMenus();
    };

    if (menuOpen || teamsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }

    if (menuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => firstFocusable.current?.focus(), 10);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, teamsOpen, handleKeyDown, closeAllMenus]);

  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.dataset.scrollY = String(scrollY);
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add("overflow-hidden");
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      const y = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.classList.remove("overflow-hidden");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, y);
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    closeAllMenus();
  }, [pathname, closeAllMenus]);

  const navItems = [
    ...(pathname !== "/" ? [{ key: "home", label: "Home", href: "/" }] : []),
    ...NAV_ITEMS,
  ];

  const navIcons: Record<string, ReactNode> = {
    home: <HomeIcon className="w-4 h-4" />,
    headlines: <Newspaper className="w-4 h-4" />,
    standings: <BarChart3 className="w-4 h-4" />,
    "power-rankings": <TrendingUp className="w-4 h-4" />,
    fantasy: <Sparkles className="w-4 h-4" />,
    calendar: <CalendarDays className="w-4 h-4" />,
    tankathon: <Target className="w-4 h-4" />,
  };

  return (
    <nav
      ref={navRef}
      className="relative bg-[hsl(0_0%_3.9%)] sticky top-0 z-[60] shadow-2xl"
      style={teamAccent ? {
        borderBottomColor: teamAccent,
        boxShadow: `0 8px 30px -12px ${teamAccent}66`,
        backgroundImage: `linear-gradient(90deg, ${teamAccent}66 0%, ${teamAccent}55 55%, ${teamAccent}44 100%)`
      } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 lg:h-16 flex items-center overflow-visible">
        {/* Left: Hamburger */}
        <div className="flex items-center md:hidden">
          <button
            ref={firstFocusable}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-controls="mega-menu-panel"
            className="mr-2 relative inline-flex items-center justify-center w-11 h-11 rounded-lg text-white hover:bg-white/5 transition-colors focus:outline-none"
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <div className="w-6 h-6 relative" aria-hidden="true">
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </div>
          </button>
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center md:justify-start">
          <Link href="/" className="inline-flex items-center group overflow-visible">
            <span className="relative block h-[2.4rem] md:h-[2.6rem] w-[92px] md:w-[100px] -my-0.5">
              <Image
                src="/images/thesnap-logo-new%20copy123.png"
                alt="The Snap Logo"
                fill
                priority
                sizes="(min-width: 768px) 140px, 120px"
                className="object-contain"
              />
            </span>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6 mx-6">
          {navItems.map(({ label, href, key }) => {
            if (key === "schedule") return null;

            if (key === "standings") {
              const isTeamsActive =
                pathname.startsWith("/standings") ||
                pathname.startsWith("/schedule") ||
                pathname.startsWith("/teams");
              return (
                <div
                  key="teams"
                  className="relative"
                  onMouseEnter={() => {
                    if (teamsCloseTimeout.current) {
                      window.clearTimeout(teamsCloseTimeout.current);
                      teamsCloseTimeout.current = null;
                    }
                    setTeamsOpen(true);
                  }}
                  onMouseLeave={() => {
                    teamsCloseTimeout.current = window.setTimeout(() => {
                      setTeamsOpen(false);
                      teamsCloseTimeout.current = null;
                    }, 180);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setTeamsOpen((o) => !o)}
                    className={`relative text-sm font-semibold tracking-wide transition-colors after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 flex items-center gap-1 cursor-pointer ${
                      isTeamsActive
                        ? "text-white after:w-full"
                        : "text-white/60 hover:text-white after:w-0 hover:after:w-full"
                    } focus:outline-none`}
                  >
                    Teams
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${teamsOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    id="teams-menu"
                    className={`absolute left-1/2 top-full mt-3 w-[860px] max-w-[90vw] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1f1f1f] shadow-2xl p-5 transition-all duration-200 ease-out ${
                      teamsOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="grid grid-cols-4 gap-6">
                      {DIVISION_GROUPS.map((group) => (
                        <div key={group.title} className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-semibold">{group.title}</p>
                          <div className="flex flex-col space-y-1">
                            {group.teams.map((code) => {
                              const meta = TEAM_META[code];
                              const nickname = meta?.name ? meta.name.split(" ").slice(-1).join(" ") : code;
                              const accent = TEAM_COLORS[code] || "#9ca3af";
                              return (
                                <Link
                                  key={code}
                                  href={`/teams/${slugifyTeamName(meta?.name || code)}`}
                                  onClick={() => setTeamsOpen(false)}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-white/85 hover:text-white transition-colors"
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
                        onClick={() => setTeamsOpen(false)}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors border ${
                          pathname.startsWith("/standings")
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-white/10 text-white/85 hover:border-white/20 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        NFL Standings
                      </Link>
                      <Link
                        href="/schedule"
                        onClick={() => setTeamsOpen(false)}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors border ${
                          pathname.startsWith("/schedule")
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-white/10 text-white/85 hover:border-white/20 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        Schedule
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            const isActive = pathname === href;
            return (
              <Link
                key={key || label}
                href={href}
                className={`relative text-sm font-semibold tracking-wide transition-colors after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${
                  isActive ? "text-white after:w-full" : "text-white/60 hover:text-white after:w-0 hover:after:w-full"
                } focus:outline-none`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right: Search + Profile */}
        <div className="flex items-center gap-4">
          <Link
            href="/headlines"
            className="hidden lg:inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white hover:text-black transition-colors"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            Latest Headlines
          </Link>
          <div className="hidden sm:block">
            <SmartSearch />
          </div>
          <ProfileMenu />
        </div>
      </div>

      {/* Mobile off-canvas (simple list menu) */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-[hsl(0_0%_3.9%)/0.75] backdrop-blur-sm transition-opacity ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          id="mega-menu-panel"
          role="dialog"
          aria-modal="true"
          className={`absolute left-0 top-0 flex h-full w-[300px] max-w-[84%] transform flex-col border-r border-white/10 bg-[hsl(0_0%_3.9%)] shadow-2xl transition-transform duration-300 supports-[backdrop-filter]:bg-[hsl(0_0%_3.9%)/0.88] backdrop-blur-xl ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="relative flex h-20 items-center border-b border-white/10 px-4">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="rounded-lg p-2 text-white hover:bg-white/10 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <Link href="/" onClick={handleLinkClick} className="mx-auto mr-10 flex items-center overflow-visible">
              <span className="relative block h-[3.2rem] w-[120px] -my-1">
                <Image
                  src="/images/thesnap-logo-new%20copy123.png"
                  alt="The Snap Logo"
                  fill
                  priority
                  sizes="120px"
                  className="object-contain"
                />
              </span>
            </Link>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 text-white">
            <div className="space-y-1.5">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Menu</p>
              {navItems.map(({ label, href, key }) => {
                const isActive = pathname === href;
                const itemKey = key || label.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={key || label}
                    href={href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-white/[0.12] text-white"
                        : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/85">
                      {navIcons[itemKey] || <Sparkles className="h-4 w-4" />}
                    </span>
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-xl bg-white/[0.04] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Search</p>
              <form action="/headlines" method="GET" className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search articles..."
                  className="w-full rounded-lg bg-white/10 px-3 py-2 pl-10 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
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
                    <Link
                      key={code}
                      href={`/teams/${slugifyTeamName(meta?.name || code)}`}
                      onClick={handleLinkClick}
                      className="rounded-lg px-2 py-2 text-center font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: `${accent}44` }}
                    >
                      {code}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/40">
            © {new Date().getFullYear()} The Snap
          </div>
        </div>
      </div>
    </nav>
  );
}
