'use client';

import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from './GameSchedule.module.css';

interface Game {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr?: string;
  awayAbbr?: string;
  homeRecord?: string;
  awayRecord?: string;
  homeTeamLogo?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  };
  awayTeamLogo?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  };
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  gameDate: string;
  tvNetwork?: string;
  gameImportance?: string;
  preview?: string;
  week: number;
}

interface GameScheduleProps {
  games: Game[];
  textureSrc?: string;
}

function getImportanceLabel(importance: string) {
  switch (importance) {
    case 'gotw': return 'Game of the Week';
    case 'division': return 'Division Rival';
    case 'playoff': return 'Playoff Implications';
    case 'primetime': return 'Primetime';
    default: return null;
  }
}

function getImportanceColor(importance: string) {
  switch (importance) {
    case 'gotw': return 'bg-yellow-600';
    case 'division': return 'bg-red-600';
    case 'playoff': return 'bg-white text-black border border-gray-300';
    case 'primetime': return 'bg-purple-600';
    default: return 'bg-gray-600';
  }
}

export default function GameSchedule({ games }: GameScheduleProps) {
  // Sort games by kickoff time ascending so they appear in chronological order
  const featuredGames = [...games].sort((a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  // Separate state for mobile horizontal list
  const [partialDesktopId, setPartialDesktopId] = useState<string | null>(null);
  const [partialMobileId, setPartialMobileId] = useState<string | null>(null);
  const desktopRef = useRef<HTMLDivElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);

  const detectPartial = useCallback((container: HTMLElement, setState: (id: string | null) => void) => {
    /*
      Identify the first card whose right edge extends beyond the visible container (trailing partial card).
      We purposefully ignore a small sub‑pixel variance by using Math.ceil on positions.
    */
    const cards = Array.from(container.querySelectorAll('[data-game-card="true"]')) as HTMLElement[];
    const cRect = container.getBoundingClientRect();
    const containerRight = Math.ceil(cRect.right);
    let found: string | null = null;
    for (const el of cards) {
      const r = el.getBoundingClientRect();
      const right = Math.ceil(r.right);
      const left = Math.floor(r.left);
      const fullyVisible = left >= cRect.left && right <= containerRight; // entirely within viewport
      const overlapsRight = left < containerRight && right > containerRight; // sticks out to the right
      if (!fullyVisible && overlapsRight) {
        found = el.dataset.id || null;
        break; // first such card is the trailing partial card
      }
    }
    setState(found);
  }, []);

  const checkScrollButtons = useCallback(() => {
    const desktop = desktopRef.current;
    if (desktop) {
      const { scrollLeft, scrollWidth, clientWidth } = desktop;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      detectPartial(desktop, setPartialDesktopId);
    }
    const mobile = mobileRef.current;
    if (mobile) {
      detectPartial(mobile, setPartialMobileId);
    }
  }, [detectPartial]);

  useEffect(() => {
    // Delay to next frame so layout is ready
    const id = requestAnimationFrame(() => checkScrollButtons());
    const desktop = desktopRef.current;
    const mobile = mobileRef.current;
    desktop?.addEventListener('scroll', checkScrollButtons, { passive: true });
    mobile?.addEventListener('scroll', checkScrollButtons, { passive: true });
    window.addEventListener('resize', checkScrollButtons);
    return () => {
      cancelAnimationFrame(id);
      desktop?.removeEventListener('scroll', checkScrollButtons);
      mobile?.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [featuredGames, checkScrollButtons]);

  // Slightly wider card to accommodate longer team names/records
  const CARD_WIDTH = 158; // px, aligns with w-[158px] below (tailwind arbitrary width)

  const scrollLeft = () => {
    const container = document.getElementById('games-container');
    if (container) {
      container.scrollBy({ left: -CARD_WIDTH * 1.5, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('games-container');
    if (container) {
      container.scrollBy({ left: CARD_WIDTH * 1.5, behavior: 'smooth' });
    }
  };

  const resolveLogo = (logo: Game['homeTeamLogo'], fallbackUrl?: string) => {
    if (logo?.asset) {
      return urlFor(logo).width(20).height(20).url();
    }
    return fallbackUrl;
  };

  const renderGameCard = (game: Game) => {
    const gameDate = new Date(game.gameDate);
    const now = new Date();
    const dateString = gameDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' });
    const time = gameDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    }).toUpperCase();
    const isToday =
      gameDate.toLocaleDateString('en-US', { timeZone: 'America/New_York' }) ===
      now.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
    const importanceLabel = getImportanceLabel(game.gameImportance || '');
    const importanceColor = getImportanceColor(game.gameImportance || '');
    const homeLogo = resolveLogo(game.homeTeamLogo, game.homeLogoUrl);
    const awayLogo = resolveLogo(game.awayTeamLogo, game.awayLogoUrl);

    return (
      <div
        key={game._id}
        data-game-card-inner
        className="rounded-lg p-2 transition-colors duration-300 border border-neutral-800 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm bg-[#111111]/95 hover:bg-[#181818]/95"
      >
        {/* Date and Time Header centered to left of teams not needed here; ensure team names are centered in their rows */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${isToday ? 'text-green-400' : 'text-gray-300'}`}>{dateString}</span>
          <span className={`text-xs font-medium ${isToday ? 'text-green-400' : 'text-gray-300'}`}>{time}</span>
        </div>

        {importanceLabel && (
          <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full mb-2 ${importanceColor}`}>
            <span className="text-white text-xs font-semibold">{importanceLabel}</span>
          </div>
        )}

        {/* Teams - Stacked Vertically and centered */}
        <div className="space-y-2">
          {/* Away Team */}
          <div className="flex items-center justify-start space-x-2">
            {awayLogo ? (
              <Image src={awayLogo} alt={game.awayTeam} width={24} height={24} className="w-6 h-6 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-extrabold">{game.awayTeam.split(' ').pop()?.charAt(0)}</span>
              </div>
            )}
            <span className="text-white text-[11px] sm:text-xs font-semibold tracking-tight uppercase leading-none text-center whitespace-normal">
              {game.awayTeam.split(' ').pop()}
            </span>
            <span className="text-gray-400 text-[10px] sm:text-[11px] font-semibold tabular-nums leading-none">{game.awayRecord || '0-0'}</span>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-start space-x-2">
            {homeLogo ? (
              <Image src={homeLogo} alt={game.homeTeam} width={24} height={24} className="w-6 h-6 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-extrabold">{game.homeTeam.split(' ').pop()?.charAt(0)}</span>
              </div>
            )}
            <span className="text-white text-[11px] sm:text-xs font-semibold tracking-tight uppercase leading-none text-center whitespace-normal">
              {game.homeTeam.split(' ').pop()}
            </span>
            <span className="text-gray-400 text-[10px] sm:text-[11px] font-semibold tabular-nums leading-none">{game.homeRecord || '0-0'}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!featuredGames?.length) {
    return (
      <section className="relative py-4 px-6 lg:px-8 border-b border-gray-800 bg-[hsl(0_0%_3.9%)]">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-lg font-bold text-white mb-2">This Week&apos;s Games</h2>
          <p className="text-gray-400">No featured games scheduled</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-4 px-4 lg:px-10 xl:px-12 2xl:px-16 3xl:px-20 bg-[hsl(0_0%_3.9%)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(0_0%_3.9%)/0.3] via-[hsl(0_0%_3.9%)/0.5] to-[hsl(0_0%_3.9%)/0.8]" />
      <div className="max-w-full xl:max-w-[1400px] 2xl:max-w-[1600px] 3xl:max-w-[1800px] mx-auto relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
          </div>
        </div>

        {/* Mobile Horizontal Scrolling - Show 2.5 games */}
        <div className="block md:hidden">
          <div className="relative">
            {/* Scrollable Games Container */}
            <div 
              id="mobile-games-container"
              ref={mobileRef}
              className={`overflow-x-auto scrollbar-hide px-4 ${styles.mobileScrollContainer}`}
            >
              <div className="flex space-x-3 pb-2">
  {featuredGames.map((game) => (
                  <div 
                    key={game._id} 
                    data-game-card="true"
                    data-id={game._id}
          className={`flex-shrink-0 w-[38vw] min-w-[150px] max-w-[180px] ${styles.gameCard} ${partialMobileId === game._id ? styles.partialEdge : ''}`}
                  >
                    {renderGameCard(game)}
                  </div>
                ))}
                {/* Add padding to ensure last card shows properly */}
                <div className="w-2 flex-shrink-0"></div>
              </div>
            </div>
            {/* Gradient overlays for mobile */}
            {/* Removed mobile gradient shadows per request */}

          </div>
        </div>

        {/* Desktop/Tablet Horizontal Carousel */}
        <div className="hidden md:block relative">
          {/* Navigation Buttons */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-4 lg:left-6 xl:left-8 top-1/2 -translate-y-1/2 z-10 bg-[hsl(0_0%_3.9%)] rounded-full p-3 text-white shadow-lg hover:bg-[hsl(0_0%_5%)] transition-colors duration-300"
              title="Scroll left"
              aria-label="Scroll to previous games"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-4 lg:right-6 xl:right-8 top-1/2 -translate-y-1/2 z-10 bg-[hsl(0_0%_3.9%)] rounded-full p-3 text-white shadow-lg hover:bg-[hsl(0_0%_5%)] transition-colors duration-300"
              title="Scroll right"
              aria-label="Scroll to next games"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Scrollable Games Container */}
          <div 
            id="games-container"
            ref={desktopRef}
            className="overflow-x-auto scrollbar-hide mx-12 lg:mx-16 xl:mx-20 px-2"
          >
            <div className="flex space-x-3 pb-2">
  {featuredGames.map((game) => (
                <div
                  key={game._id}
                  data-game-card="true"
                  data-id={game._id}
          className={`flex-shrink-0 w-[158px] min-w-[158px] ${partialDesktopId === game._id ? styles.partialEdge : ''}`}
                >
                  {renderGameCard(game)}
                </div>
              ))}
            </div>
          </div>
          {/* Keep left overlay; right handled by partial card shadow for better focus */}
          {/* Removed desktop left gradient shadow */}
        </div>
      </div>
    </section>
  );
}
