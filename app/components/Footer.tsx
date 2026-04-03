"use client";

import Link from "next/link";
import { FaEnvelope, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";

const mainLinks = [
  { label: "Contact & Support", href: "/contact" },
  { label: "Our Story", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Newsletter", href: "/newsletter" },
];

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/thesnapfootball",
    icon: FaInstagram,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@thesnapfootball",
    icon: FaTiktok,
  },
  {
    label: "X",
    href: "https://x.com/thegamesnap",
    icon: FaXTwitter,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@thesnapfootball",
    icon: FaYoutube,
  },
  {
    label: "Email",
    href: "mailto:TheGameSnap@yahoo.com",
    icon: FaEnvelope,
  },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/10 bg-[#0b0b0d] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-10 md:block">
        <div className="absolute left-0 top-0 h-px w-[16%] bg-white/15" />
        <div className="absolute left-[16%] top-0 h-px w-12 origin-left rotate-[28deg] bg-white/15" />
        <div className="absolute left-[19.5%] top-0 h-px w-[80.5%] bg-white/15" />
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-7 pt-9 sm:px-8 md:pb-9 md:pt-11">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="space-y-3">
            <p className="text-[1.28rem] font-black uppercase tracking-[0.18em] text-white">
              The Snap
            </p>

            <div className="flex flex-wrap items-center gap-2.5 text-white">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="transition-colors hover:text-white/75"
                >
                  <Icon className="h-[17px] w-[17px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] lg:gap-x-5">
              {mainLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="font-medium text-white/90 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 text-[11px] text-white/70">
              <p className="leading-5">
                Owned and operated by The Snap. Copyright {currentYear} The Snap. All rights reserved.
              </p>
              <p className="mt-2.5 max-w-4xl leading-5 text-white/60">
                The Snap provides NFL news, rankings, analysis, and opinion content for informational and entertainment purposes.
                Betting coverage should not be treated as financial or legal advice. Always verify league, sportsbook, and local
                compliance rules before acting on any information published on this site.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
