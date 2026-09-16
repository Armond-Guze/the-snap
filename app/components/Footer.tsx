"use client";

import Image from "next/image";
import Link from "next/link";
import { FaEnvelope, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { openConsentPreferences } from "./consent";
import FooterReveal from "./FooterReveal";
import FooterBenefits from "./FooterBenefits";
import NewsletterSignup from "./NewsletterSignup";
import "./footer.css";

const mainLinks = [
  { label: "Contact & Support", href: "/contact" },
  { label: "Our Story", href: "/about" },
  { label: "Authors", href: "/authors" },
  { label: "Editorial Standards", href: "/editorial-standards" },
  { label: "Corrections", href: "/corrections-policy" },
  { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
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


const coverageLinks = [
  { label: "Latest Headlines", href: "/headlines" },
  { label: "Power Rankings", href: "/articles/power-rankings" },
  { label: "Fantasy Football", href: "/fantasy" },
  { label: "NFL Teams", href: "/teams" },
  { label: "Schedule", href: "/schedule" },
  { label: "Standings", href: "/standings" },
];
const groups = [{title: "NFL Coverage", links: coverageLinks}, {title: "Information", links: mainLinks}];

export default function Footer() {
  return (
    <footer className="snap-site-footer">
      <FooterBenefits />
      <FooterReveal>
        <div className="snap-footer-main">
          <div className="snap-footer-brand">
            <Link href="/" className="snap-footer-logo" aria-label="The Game Snap home">
              <Image src="/images/snap-wordmark-blue.svg" alt="" width={170} height={40} />
            </Link>
          </div>
          <nav className="snap-footer-link-columns" aria-label="Footer navigation">
            {groups.map(group => <section className="snap-footer-link-column" key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(link => <Link href={link.href} key={link.href}>{link.label}</Link>)}
            </section>)}
            <a className="snap-footer-contact-email" href="mailto:TheGameSnap@yahoo.com">TheGameSnap@yahoo.com</a>
          </nav>
          <section className="snap-footer-newsletter" aria-label="Newsletter signup">
            <h2>Stay in the game with The Snap newsletter</h2>
            <NewsletterSignup variant="footer" />
            <div className="snap-footer-social-icons" aria-label="Follow The Game Snap">
              {socials.filter(s => s.label !== "Email").map(({label,href,icon: Icon}) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon size={22} /></a>
              ))}
            </div>
          </section>
          <nav className="snap-footer-mobile-accordions" aria-label="Footer mobile navigation">
            {groups.map(group => <details className="snap-footer-mobile-accordion" key={group.title}>
              <summary>{group.title}</summary>
              <div className="snap-footer-mobile-accordion-links">
                {group.links.map(link => <Link href={link.href} key={link.href}>{link.label}</Link>)}
              </div>
            </details>)}
            <a className="snap-footer-contact-email" href="mailto:TheGameSnap@yahoo.com">TheGameSnap@yahoo.com</a>
          </nav>
        </div>
        <div className="snap-footer-bottom">
          <p className="snap-footer-bottom-copy">© {new Date().getFullYear()} The Game Snap. All rights reserved.</p>
          <div className="snap-footer-utility-links">
            <Link href="/rss.xml">RSS Feed</Link>
            <button type="button" onClick={openConsentPreferences}>Cookie preferences</button>
          </div>
          <p className="snap-footer-disclaimer">NFL news, rankings, analysis, and opinion. Betting coverage is for information and entertainment; verify applicable rules before acting.</p>
        </div>
      </FooterReveal>
    </footer>
  );
}
