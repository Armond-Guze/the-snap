"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SmartSearch from "./SmartSearch";
import ProfileMenu from "./ProfileMenu";
import { NAV_ITEMS } from "./navConfig";
import { CgClose } from 'react-icons/cg';
import { Newspaper, BarChart3, TrendingUp, Sparkles, CalendarDays, Target, Home as HomeIcon } from 'lucide-react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  const handleLinkClick = () => setMenuOpen(false);

  // focus management inside panel (basic trap)
  const firstFocusable = useRef<HTMLButtonElement | null>(null);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setMenuOpen(false);
    if (e.key === 'Tab' && menuOpen) {
      const panel = document.getElementById('mega-menu-panel');
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, [menuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => firstFocusable.current?.focus(), 10);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, handleKeyDown]);

  // Body scroll lock when menu is open (prevents underlying page scroll / jump)
  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.dataset.scrollY = String(scrollY);
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add('overflow-hidden');
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      const y = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.classList.remove('overflow-hidden');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, y);
    }
    return () => { // cleanup on unmount
      document.body.classList.remove('overflow-hidden');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Add Home link when not on homepage
  const navItems = [
    ...(pathname !== "/" ? [{ key: 'home', label: "Home", href: "/" }] : []),
    ...NAV_ITEMS,
  ];

  const navIcons: Record<string, ReactNode> = {
    home: <HomeIcon className="w-4 h-4" />,
    headlines: <Newspaper className="w-4 h-4" />,
    standings: <BarChart3 className="w-4 h-4" />,
    'power-rankings': <TrendingUp className="w-4 h-4" />,
    fantasy: <Sparkles className="w-4 h-4" />,
    calendar: <CalendarDays className="w-4 h-4" />,
    tankathon: <Target className="w-4 h-4" />
  };

  const iconStyles: Record<string, string> = {
    home: 'bg-zinc-700/30 text-zinc-200 group-hover:bg-zinc-600/40',
    headlines: 'bg-blue-600/20 text-blue-300 group-hover:bg-blue-600/30',
    standings: 'bg-amber-600/20 text-amber-300 group-hover:bg-amber-600/30',
    'power-rankings': 'bg-violet-600/20 text-violet-300 group-hover:bg-violet-600/30',
    fantasy: 'bg-emerald-600/20 text-emerald-300 group-hover:bg-emerald-600/30',
    calendar: 'bg-cyan-600/20 text-cyan-300 group-hover:bg-cyan-600/30',
    tankathon: 'bg-rose-600/20 text-rose-300 group-hover:bg-rose-600/30'
  };

  const navDescriptions: Record<string, string> = {
    home: 'Back to hub',
    headlines: 'Latest stories',
    standings: 'Division view',
    'power-rankings': 'Weekly movers',
    fantasy: 'Player intel',
    calendar: 'Save the dates',
    tankathon: 'Draft order live'
  };

  const cardAccents: Record<string, string> = {
    home: 'from-white/15 via-zinc-500/10 to-transparent',
    headlines: 'from-blue-400/25 via-transparent to-transparent',
    standings: 'from-amber-400/25 via-transparent to-transparent',
    'power-rankings': 'from-violet-400/25 via-transparent to-transparent',
    fantasy: 'from-emerald-400/25 via-transparent to-transparent',
    calendar: 'from-cyan-400/25 via-transparent to-transparent',
    tankathon: 'from-rose-400/25 via-transparent to-transparent'
  };

  return (
  <nav ref={navRef} className="bg-black sticky top-0 z-[60] shadow-2xl border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 lg:h-20 flex items-center">
      {/* Left: Hamburger */}
  <div className="flex items-center md:hidden">
  <button
          ref={firstFocusable}
          onClick={() => setMenuOpen(o=>!o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-controls="mega-menu-panel"
          className="mr-2 relative inline-flex items-center justify-center w-11 h-11 rounded-lg text-white hover:bg-white/5 transition-colors focus:outline-none"
        >
          {/* Custom animated hamburger to better match reference site styling */}
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          <div className="w-6 h-6 relative" aria-hidden="true">
            <span className={`absolute left-0 top-1 w-6 h-[2px] rounded-full bg-current transition-all duration-300 ease-out ${menuOpen ? 'rotate-45 translate-y-[11px]' : ''}`}></span>
            <span className={`absolute left-0 top-[11px] w-6 h-[2px] rounded-full bg-current transition-all duration-300 ease-out ${menuOpen ? 'opacity-0 scale-x-0' : 'opacity-70 group-hover:opacity-100'}`}></span>
            <span className={`absolute left-0 bottom-1 w-6 h-[2px] rounded-full bg-current transition-all duration-300 ease-out ${menuOpen ? '-rotate-45 -translate-y-[11px]' : ''}`}></span>
            {menuOpen && <CgClose className="absolute inset-0 m-auto w-5 h-5 opacity-0" />} {/* keep icon for a11y / future */}
          </div>
        </button>
      </div>
      {/* Center: Logo */}
      <div className="flex-1 flex justify-center md:justify-start">
        <Link href="/" className="inline-flex items-center group">
            <Image src="/images/thesnap-logo-transparent.png" alt="The Snap Logo" width={140} height={120} className="h-10 w-auto" />
        </Link>
      </div>
      {/* Desktop Nav Links */}
  <div className="hidden md:flex items-center gap-6 mx-6">
        {navItems.map(({ label, href, key }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={key || label}
              href={href}
      className={`relative text-sm font-semibold tracking-wide transition-colors after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${isActive ? 'text-white after:w-full' : 'text-white/60 hover:text-white after:w-0 hover:after:w-full'} focus:outline-none`}
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
        <div className="hidden sm/block"><SmartSearch /></div>
        <ProfileMenu />
      </div>
    </div>

    {/* Mobile off-canvas (left vertical window) */}
  <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Click area right side */}
      <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={()=>setMenuOpen(false)} />
      <div
        id="mega-menu-panel"
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 left-0 h-full w-[330px] max-w-[85%] border-r border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} 
        bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)] bg-gradient-to-b from-[#0b0b0b] via-[#050505] to-[#020202] supports-[backdrop-filter]:bg-black/80 backdrop-blur-xl`}
      >
        {/* Fixed Header inside panel keeps close button position & shows logo */}
        <div className="relative h-16 flex items-center border-b border-white/10 px-4">
          <button onClick={()=>setMenuOpen(false)} aria-label="Close menu" className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 focus:outline-none">
            <CgClose className="w-5 h-5 text-white" />
          </button>
          <Link href="/" onClick={handleLinkClick} className="mx-auto flex items-center">
            <Image src="/images/thesnap-logo-transparent.png" alt="The Snap Logo" width={180} height={180} className="h-12 w-auto" />
          </Link>
          {/* subtle bottom glow line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 text-white">
          {/* Grid of nav items - larger horizontal cards */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Featured</p>
            <div className="grid grid-cols-2 gap-4">
              {navItems.map(({ label, href, key }) => {
                const isActive = pathname === href;
                const cardKey = (key || label.toLowerCase().replace(/\s+/g, '-'));
                return (
                  <Link
                    key={key || label}
                    href={href}
                    onClick={handleLinkClick}
                    className={`group relative overflow-hidden rounded-2xl border h-28 px-3 py-3 text-center transition-all focus:outline-none
                    ${isActive ? 'border-white/40 text-white shadow-[0_12px_45px_rgba(0,0,0,0.5)] bg-white/[0.04]' : 'border-white/5 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/[0.02]'}
                    `}
                  >
                    <span className={`absolute inset-0 bg-gradient-to-br ${cardAccents[cardKey] || 'from-white/10 via-transparent to-transparent'} opacity-0 group-hover:opacity-100 transition duration-500`} aria-hidden="true" />
                    <span className="absolute inset-px rounded-[18px] bg-black/70 border border-white/5" aria-hidden="true" />
                    <div className="relative z-10 flex flex-col items-center justify-between h-full">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] backdrop-blur-sm transition-colors ${iconStyles[cardKey] || 'bg-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white'}`}>
                        {navIcons[cardKey] || <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[12px] leading-snug font-semibold tracking-wide">{label}</span>
                        <span className="block text-[10px] uppercase tracking-[0.25em] text-white/35">{navDescriptions[cardKey] || 'Explore'}</span>
                      </div>
                    </div>
                    {isActive && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse" />}
                  </Link>
                );
              })}
            </div>
            <Link
              href="/headlines"
              onClick={handleLinkClick}
              className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold tracking-wide text-white hover:border-white/30 hover:bg-white/10 transition-colors"
            >
              Catch Up on Headlines ↗
            </Link>
          </div>
          {/* Search inline */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Search</p>
            <form action="/headlines" method="GET" className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search articles..."
                className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 pl-10 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            </form>
          </div>
        </div>
        {/* Footer simplified */}
        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/40 flex items-center justify-start">
          <span>© {new Date().getFullYear()} The Snap</span>
        </div>
      </div>
    </div>
  </nav>
  );
}
