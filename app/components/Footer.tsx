"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { Mail, Instagram, Youtube, Twitter, Music2 } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "About", href: "/about" },
    { label: "Headlines", href: "/headlines" },
    { label: "Power Rankings", href: "/articles/power-rankings" },
    { label: "NFL Standings", href: "/standings" },
  ];

  return (
    <footer className="bg-[hsl(0_0%_3.9%)] border-t border-gray-800 py-8 md:py-10 text-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
	<div className="hidden md:grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex flex-col items-start mb-4">
              <Image
                src="/images/thesnap-logo-new%20copy123.png"
                alt="The Game Snap Logo"
                width={110}
                height={110}
                className="h-4 md:h-5 w-auto max-w-none shrink-0 mb-2"
                priority
              />
              <h3 className="text-2xl font-bold text-white leading-snug">
                The Game Snap
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your premier destination for NFL insights, power rankings, and breaking news.
            </p>
          </div>

          {/* Site Sections */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Explore</h4>
            <ul className="space-y-2">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div />
        </div>

        {/* Mobile stack */}
        <div className="md:hidden border-t border-gray-800 mt-6 pt-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Explore</h4>
            <ul className="space-y-2">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="block py-1 text-gray-400 hover:text-white transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div />
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 md:mt-12 pt-6 border-t border-gray-800">
          {/* Quick social icon row */}
          <div className="flex items-center justify-center mb-4 gap-5 text-gray-400">
            <a href="https://www.instagram.com/thesnapfootball" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Instagram size={18} /></a>
            <a href="https://www.youtube.com/@thesnapfootball" aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Youtube size={18} /></a>
            <a href="https://twitter.com/thesnapfootball" aria-label="Twitter / X" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Twitter size={18} /></a>
            <a href="https://www.tiktok.com/@thesnapfootball" aria-label="TikTok" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Music2 size={18} /></a>
            <a href="mailto:TheGameSnap@yahoo.com" aria-label="Email" className="hover:text-white transition-colors"><Mail size={18} /></a>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-xs text-gray-500 text-center md:text-left">
              &copy; {currentYear} The Game Snap. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-1 text-xs text-gray-500">
              <Link href="/privacy-policy" className="hover:text-gray-400 transition-colors">Privacy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-gray-400 transition-colors">Contact</Link>
              <span className="hidden sm:inline">•</span>
              <span className="text-gray-600">Not affiliated with the NFL.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

interface FooterLinkProps {
  href: string;
  label: string;
  icon: ReactNode;
  external?: boolean;
}

function FooterLink({ href, label, icon, external }: FooterLinkProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

export default Footer;
