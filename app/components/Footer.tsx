"use client";

import Link from "next/link";
import Image from "next/image";
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
    <footer className="theme-footer py-10 md:py-12 text-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="hidden md:flex flex-col items-center text-center gap-8">
          <Image
            src="/images/thesnap-logo-new%20copy123.png"
            alt="The Game Snap Logo"
            width={110}
            height={110}
            className="h-5 w-auto max-w-none shrink-0"
          />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-400">
            {quickLinks.map(({ label, href }) => (
              <Link key={label} href={href} className="hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="md:hidden flex flex-col items-center text-center gap-5">
          <Image
            src="/images/thesnap-logo-new%20copy123.png"
            alt="The Game Snap Logo"
            width={110}
            height={110}
            className="h-5 w-auto max-w-none shrink-0"
          />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-400">
            {quickLinks.map(({ label, href }) => (
              <Link key={label} href={href} className="hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 md:mt-12 border-t border-white/10 pt-6">
          <div className="mb-4 flex items-center justify-center gap-5 text-gray-400">
            <a href="https://www.instagram.com/thesnapfootball" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Instagram className="w-[18px] h-[18px] md:w-5 md:h-5" /></a>
            <a href="https://www.youtube.com/@thesnapfootball" aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Youtube className="w-[18px] h-[18px] md:w-5 md:h-5" /></a>
            <a href="https://twitter.com/thesnapfootball" aria-label="Twitter / X" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Twitter className="w-[18px] h-[18px] md:w-5 md:h-5" /></a>
            <a href="https://www.tiktok.com/@thesnapfootball" aria-label="TikTok" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Music2 className="w-[18px] h-[18px] md:w-5 md:h-5" /></a>
            <a href="mailto:TheGameSnap@yahoo.com" aria-label="Email" className="hover:text-white transition-colors"><Mail className="w-[18px] h-[18px] md:w-5 md:h-5" /></a>
          </div>

          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              &copy; {currentYear} The Game Snap. All rights reserved.
            </div>
            <div className="text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1 text-xs text-gray-500">
                <Link href="/privacy-policy" className="hover:text-gray-400 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
                <Link href="/contact" className="hover:text-gray-400 transition-colors">Contact</Link>
              </div>
              <div className="mt-1 text-[11px] text-gray-600">Not affiliated with the NFL.</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
