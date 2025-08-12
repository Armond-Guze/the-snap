"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SmartSearch from "./SmartSearch";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  const handleLinkClick = () => setMenuOpen(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Add Home link when not on homepage
  const navItems = [
    ...(pathname !== "/" ? [{ label: "Home", href: "/" }] : []),
    { label: "Headlines", href: "/headlines" },
    { label: "Power Rankings", href: "/power-rankings" },
    { label: "NFL Standings", href: "/standings" },
    { label: "Fantasy", href: "/fantasy" },
  ];

  return (
    <nav ref={navRef} className="bg-black/95 backdrop-blur-xl sticky top-0 z-50 shadow-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 py-3">
        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between h-full relative">
          {/* Left spacer for mobile */}
          <div className="flex items-center space-x-3">
            <SmartSearch />
          </div>
          
          {/* Centered Logo for mobile */}
          <Link href="/" className="inline-flex items-center space-x-2 group absolute left-1/2 transform -translate-x-1/2">
            <Image
              src="/images/the-snap-logo.png"
              alt="FootballNews Logo"
              width={60}
              height={60}
              className="h-8 w-auto transition-transform group-hover:scale-105"
              priority
            />
          </Link>
          
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            className="relative p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-95 active:bg-white/15 group shadow-lg hover:shadow-xl"
          >
            <div className="relative w-5 h-5">
              <span
                className={`absolute top-0 left-0 w-5 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${
                  menuOpen ? 'rotate-45 translate-y-2' : 'rotate-0'
                }`}
              />
              <span
                className={`absolute top-2 left-0 w-5 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${
                  menuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                }`}
              />
              <span
                className={`absolute top-4 left-0 w-5 h-0.5 bg-white rounded-full transition-all duration-300 ease-out ${
                  menuOpen ? '-rotate-45 -translate-y-2' : 'rotate-0'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between h-full">
          {/* Logo - Now serves as Home link */}
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <Image
              src="/images/the-snap-logo.png"
              alt="FootballNews Logo"
              width={60}
              height={60}
              className="h-8 md:h-10 w-auto transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Menu + Search */}
          <div className="flex items-center space-x-6">
            {/* Navigation Links */}
            <div className="flex items-center space-x-8">
              {navItems.map(({ label, href }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`relative text-sm font-semibold pb-1 transition-all duration-300 group ${
                      isActive 
                        ? 'text-white after:w-full' 
                        : 'text-gray-300 hover:text-gray-100'
                    } after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-gradient-to-r after:from-white after:to-gray-300 after:transition-all after:duration-300 hover:after:w-full ${
                      isActive ? 'after:w-full' : 'after:w-0'
                    }`}
                  >
                    <span className="relative z-10">{label}</span>
                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-0 rounded-lg bg-white/5 scale-0 group-hover:scale-100 transition-transform duration-300 opacity-0 group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
            
            {/* Search Component */}
            <SmartSearch />
          </div>
        </div>
      </div>

      {/* Enhanced Professional Mobile Dropdown */}
      <div
        className={`md:hidden transition-all duration-300 ease-out overflow-hidden backdrop-blur-xl border-t border-white/10 ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-black/95 backdrop-blur-xl px-6 py-6 space-y-1 shadow-2xl">
          {navItems.map(({ label, href }, index) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                onClick={handleLinkClick}
                className={`block text-lg font-medium py-4 px-5 rounded-xl transition-all duration-300 transform hover:translate-x-1 ${
                  isActive
                    ? 'text-white bg-white/10 border-l-4 border-white shadow-lg backdrop-blur-sm'
                    : 'text-gray-200 hover:text-white hover:bg-white/5 hover:backdrop-blur-sm'
                } active:scale-95 active:bg-white/10`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <span className="flex items-center justify-between">
                  {label}
                  {isActive && (
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </span>
              </Link>
            );
          })}
          
          {/* Professional separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />
        </div>
      </div>
    </nav>
  );
}
