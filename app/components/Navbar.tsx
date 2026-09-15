"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronRight, CircleUserRound, Menu } from "lucide-react";
import { FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { useUser } from "@clerk/nextjs";
import ProfileMenu from "./ProfileMenu";
import SmartSearch from "./SmartSearch";
import { TEAM_META } from "@/lib/schedule";
import "./navigation.css";

const primaryLinks = [
  { href: "/headlines", label: "Headlines" },
  { href: "/articles/power-rankings", label: "Power Rankings" },
  { href: "/fantasy", label: "Fantasy" },
  { href: "/schedule", label: "Schedule" },
];
const moreLinks = [
  { href: "/teams", label: "NFL Teams" },
  { href: "/standings", label: "Standings" },
  { href: "/draft", label: "Draft" },
  { href: "/about", label: "Our Story" },
];
const socials = [
  { label: "Instagram", href: "https://www.instagram.com/thesnapfootball", Icon: FaInstagram },
  { label: "TikTok", href: "https://www.tiktok.com/@thesnapfootball", Icon: FaTiktok },
  { label: "X", href: "https://x.com/thegamesnap", Icon: FaXTwitter },
  { label: "YouTube", href: "https://www.youtube.com/@thesnapfootball", Icon: FaYoutube },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const teamsRef = useRef<HTMLDetailsElement>(null);
  const touchStartY = useRef<number | null>(null);
  const accountHref = isSignedIn ? "/account" : "/sign-in";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1101px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    const closeTeams = (event: MouseEvent) => {
      if (!teamsRef.current?.contains(event.target as Node)) teamsRef.current?.removeAttribute("open");
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && teamsRef.current?.open) {
        teamsRef.current.removeAttribute("open");
        teamsRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("click", closeTeams);
    document.addEventListener("keydown", onEscape);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.removeEventListener("click", closeTeams);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <header className="snap-header">
        <Dialog.Trigger className="snap-menu-toggle" aria-label="Open menu"><Menu size={24} strokeWidth={1.6} /></Dialog.Trigger>
        <Link href="/" className="snap-brand" aria-label="The Game Snap home">
          <Image src="/images/thesnap-logo-new%20copy123.png" alt="The Snap" width={1595} height={410} priority />
        </Link>
        <nav className="snap-desktop-nav" aria-label="Primary navigation">
          {primaryLinks.map(({href,label}) => <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}><span className="snap-nav-label">{label}</span></Link>)}
          <details className="snap-nav-more" ref={teamsRef}>
            <summary>More <ChevronDown size={15} aria-hidden="true" /></summary>
            <div className="snap-nav-dropdown">
              <div className="snap-nav-quick-links">{moreLinks.map(link => <Link href={link.href} key={link.href} onClick={() => teamsRef.current?.removeAttribute("open")}>{link.label}</Link>)}</div>
              <p>Find your team</p>
              <div className="snap-nav-teams">{Object.entries(TEAM_META).map(([code,team]) => <Link key={code} href={`/teams/${team.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} onClick={() => teamsRef.current?.removeAttribute("open")}>{team.name}</Link>)}</div>
            </div>
          </details>
        </nav>
        <div className="snap-header-actions">
          <SmartSearch variant="header" />
          <div className="snap-header-profile"><ProfileMenu /></div>
        </div>
      </header>
      <Dialog.Portal>
        <Dialog.Overlay className="snap-menu-backdrop" />
        <Dialog.Content className="snap-navigation-sheet" aria-describedby="snap-menu-description">
          <Dialog.Title className="sr-only">The Snap navigation</Dialog.Title>
          <Dialog.Description id="snap-menu-description" className="sr-only">Explore NFL coverage, teams, and your account.</Dialog.Description>
          <Dialog.Close className="snap-navigation-sheet-handle" aria-label="Close menu"
            onTouchStart={event => { touchStartY.current = event.touches[0].clientY; }}
            onTouchEnd={event => {
              if (touchStartY.current !== null && event.changedTouches[0].clientY - touchStartY.current > 45) setMobileOpen(false);
              touchStartY.current = null;
            }}><span /></Dialog.Close>
          <nav className="snap-navigation-sheet-links" aria-label="Mobile primary navigation">
            {[{href:"/",label:"Home"}, ...primaryLinks, ...moreLinks].map(({href,label}) => <Dialog.Close asChild key={href}><Link href={href} aria-current={isActive(href) ? "page" : undefined}><span className="snap-nav-label">{label}</span><ChevronRight size={19} strokeWidth={1.6} aria-hidden="true" /></Link></Dialog.Close>)}
          </nav>
          <div className="snap-navigation-sheet-footer">
            <div className="snap-navigation-sheet-locale"><Link href="/newsletter" onClick={() => setMobileOpen(false)}>The Snap newsletter</Link><Link href="/contact" onClick={() => setMobileOpen(false)}>Contact us</Link></div>
            <div className="snap-navigation-sheet-account-row">
              <Dialog.Close asChild><Link className="snap-navigation-sheet-login" href={accountHref}><CircleUserRound size={18} />{isSignedIn ? "Account" : "Login"}</Link></Dialog.Close>
              <div className="snap-navigation-sheet-socials" aria-label="Follow The Snap">{socials.map(({label,href,Icon}) => <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"><Icon /></a>)}</div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
