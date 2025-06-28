"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLinkClick = () => setMenuOpen(false);

  // Add Home link when not on homepage
  const navItems = [
    ...(pathname !== "/" ? [{ label: "Home", href: "/" }] : []),
    { label: "About", href: "/about" },
    { label: "Headlines", href: "/headlines" },
    { label: "Power Rankings", href: "/power-rankings" },
    { label: "NFL Standings", href: "/standings" },
    { label: "Newsletter", href: "/newsletter" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16 py-3">
        {/* Logo - Now serves as Home link */}
        <Link href="/" className="inline-flex items-center space-x-2 group">
          <Image
            src="/images/the-snap-logo.png"
            alt="FootballNews Logo"
            width={72}
            height={72}
            className="h-10 md:h-12 w-auto transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`relative text-sm font-semibold pb-1 transition-all duration-300 ${
                  isActive 
                    ? 'text-white after:w-full' 
                    : 'text-gray-200 hover:text-white'
                } after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full ${
                  isActive ? 'after:w-full' : 'after:w-0'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Enhanced Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            className="relative p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white group"
          >
            <div className="relative w-6 h-6">
              <span
                className={`absolute top-1 left-0 w-6 h-0.5 bg-gray-200 transition-all duration-300 ${
                  menuOpen ? 'rotate-45 translate-y-2' : 'rotate-0'
                }`}
              />
              <span
                className={`absolute top-3 left-0 w-6 h-0.5 bg-gray-200 transition-all duration-300 ${
                  menuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute top-5 left-0 w-6 h-0.5 bg-gray-200 transition-all duration-300 ${
                  menuOpen ? '-rotate-45 -translate-y-2' : 'rotate-0'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Enhanced Mobile Dropdown */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden border-t border-gray-800 ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-black px-6 py-6 space-y-1">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                onClick={handleLinkClick}
                className={`block text-base font-medium py-3 px-4 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'text-white bg-gray-800 border-l-4 border-white'
                    : 'text-gray-200 hover:text-white hover:bg-gray-800 hover:translate-x-2'
                } focus:outline-none focus:ring-2 focus:ring-white`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
