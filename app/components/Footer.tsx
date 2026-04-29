"use client";

import Link from "next/link";
import type { SVGProps } from "react";

const mainLinks = [
  { label: "Contact & Support", href: "/contact" },
  { label: "Our Story", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Newsletter", href: "/newsletter" },
];

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14.7 3c.3 2 1.4 3.4 3.3 4.1v2.7a8 8 0 0 1-3.2-1.1v5.8a5.2 5.2 0 1 1-4.2-5.1v2.8a2.5 2.5 0 1 0 1.5 2.3V3h2.6Z" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 3H22l-6.8 7.8L23 21h-6.1l-4.8-6.2L6.7 21H3.6l7.3-8.4L3.3 3h6.2l4.3 5.6L18.9 3Zm-1.1 16h1.7L8.7 4.9H7l10.8 14.1Z" />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2A42.5 42.5 0 0 0 12 4.8c-3 0-5.6.1-7.6.4a2.8 2.8 0 0 0-2 2A30.7 30.7 0 0 0 2 12c0 1.9.1 3.5.4 4.8a2.8 2.8 0 0 0 2 2c2 .3 4.6.4 7.6.4s5.6-.1 7.6-.4a2.8 2.8 0 0 0 2-2A30.7 30.7 0 0 0 22 12c0-1.9-.1-3.5-.4-4.8ZM10 15.6V8.4l6.2 3.6L10 15.6Z" />
    </svg>
  );
}

function EmailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m5 7 7 5 7-5" />
    </svg>
  );
}

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/thesnapfootball",
    icon: InstagramIcon,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@thesnapfootball",
    icon: TikTokIcon,
  },
  {
    label: "X",
    href: "https://twitter.com/thesnapfootball",
    icon: XIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@thesnapfootball",
    icon: YouTubeIcon,
  },
  {
    label: "Email",
    href: "mailto:TheGameSnap@yahoo.com",
    icon: EmailIcon,
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
