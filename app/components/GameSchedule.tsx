'use client';

import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { useState } from "react";

interface Game {
  _id: string;
  homeTeam: string;
  awayTeam: string;
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

export default function GameSchedule({ games, textureSrc }: GameScheduleProps) {
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const featuredGames = games;

  // The required distance between touchStart and touchEnd to trigger a swipe
  const minSwipeDistance = 50;

  const nextGame = () => {
    if (isAnimating) return; // Prevent rapid clicking
    
    setIsAnimating(true);
    setCurrentGameIndex((prev) => {
      const increment = 2; // Show 2 games on mobile
      return (prev + increment) % featuredGames.length;
    });
    
    // Reset animation state after transition completes
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevGame = () => {
    if (isAnimating) return; // Prevent rapid clicking
    
    setIsAnimating(true);
    setCurrentGameIndex((prev) => {
      const decrement = 2; // Show 2 games on mobile
      return (prev - decrement + featuredGames.length) % featuredGames.length;
    });
    
    // Reset animation state after transition completes
    setTimeout(() => setIsAnimating(false), 500);
  };

  const scrollLeft = () => {
    const container = document.getElementById('games-container');
    if (container) {
      const cardWidth = 156; // Updated to match new w-36 (144px + spacing)
      container.scrollBy({ left: -cardWidth * 1.5, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('games-container');
    if (container) {
      const cardWidth = 156; // Updated to match new w-36 (144px + spacing)
      container.scrollBy({ left: cardWidth * 1.5, behavior: 'smooth' });
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && featuredGames.length > 2) {
      nextGame();
    }
    if (isRightSwipe && featuredGames.length > 2) {
      prevGame();
    }
  };

  const renderGameCard = (game: Game) => {
    const gameDate = new Date(game.gameDate);
    const isToday = gameDate.toDateString() === new Date().toDateString();
    const dateString = gameDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    const time = gameDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toUpperCase();
    const importanceLabel = getImportanceLabel(game.gameImportance || '');
    const importanceColor = getImportanceColor(game.gameImportance || '');

    return (
      <div key={game._id} className="bg-shadcn-zinc rounded-lg p-2 hover:bg-gray-800 transition-colors duration-300">
        {/* Date and Time Header} */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${isToday ? 'text-green-400' : 'text-gray-300'}`}>
            {dateString}
          </span>
          <span className={`text-xs font-medium ${isToday ? 'text-green-400' : 'text-gray-300'}`}>
            {time}
          </span>
        </div>

        {/* Game Importance Badge */}
        {importanceLabel && (
          <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full mb-2 ${importanceColor}`}>
            <span className="text-white text-xs font-semibold">{importanceLabel}</span>
          </div>
        )}

        {/* Teams - Stacked Vertically */}
        <div className="space-y-1.5">
          {/* Away Team */}
          <div className="flex items-center space-x-1.5">
            {game.awayTeamLogo?.asset ? (
              <Image
                src={urlFor(game.awayTeamLogo).width(20).height(20).url()}
                alt={game.awayTeam}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {game.awayTeam.split(' ').pop()?.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-white text-xs font-bold truncate">
              {game.awayTeam.split(' ').pop()}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex items-center space-x-1.5">
            {game.homeTeamLogo?.asset ? (
              <Image
                src={urlFor(game.homeTeamLogo).width(20).height(20).url()}
                alt={game.homeTeam}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {game.homeTeam.split(' ').pop()?.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-white text-xs font-bold truncate">
              {game.homeTeam.split(' ').pop()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (!featuredGames?.length) {
    return (
      <section className="relative py-4 px-6 lg:px-8 border-b border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-lg font-bold text-white mb-2">This Week&apos;s Games</h2>
          <p className="text-gray-400">No featured games scheduled</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-4 px-4 lg:px-10 xl:px-12 bg-black">
      <div className="max-w-full xl:max-w-[1400px] 2xl:max-w-[1500px] mx-auto relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
          </div>
        </div>

        {/* Mobile Carousel - Two at a time */}
        <div className="block md:hidden">
          <div className="relative">
            {/* Game Counter */}
            <div className="text-center mb-2">
              
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevGame}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black rounded-full p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={featuredGames.length <= 2}
              title="Previous games"
              aria-label="View previous games"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextGame}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black rounded-full p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={featuredGames.length <= 2}
              title="Next games"
              aria-label="View next games"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Current Games - Show 2 at a time */}
            <div 
              className="mx-8 transition-all duration-500 ease-in-out transform"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="grid grid-cols-2 gap-3">
                {renderGameCard(featuredGames[currentGameIndex])}
                {featuredGames[currentGameIndex + 1] && renderGameCard(featuredGames[currentGameIndex + 1])}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center space-x-2 mt-4">
              {Array.from({ length: Math.ceil(featuredGames.length / 2) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentGameIndex(index * 2)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(currentGameIndex / 2) === index ? 'bg-white' : 'bg-gray-600'
                  }`}
                  aria-label={`View games ${index * 2 + 1}-${Math.min(index * 2 + 2, featuredGames.length)}`}
                  title={`Games ${index * 2 + 1}-${Math.min(index * 2 + 2, featuredGames.length)}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop/Tablet Horizontal Carousel */}
        <div className="hidden md:block relative">
          {/* Navigation Buttons */}
          <button
            onClick={scrollLeft}
            className="absolute left-4 lg:left-6 xl:left-8 top-1/2 -translate-y-1/2 z-10 bg-black rounded-full p-3 text-white shadow-lg"
            title="Scroll left"
            aria-label="Scroll to previous games"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={scrollRight}
            className="absolute right-4 lg:right-6 xl:right-8 top-1/2 -translate-y-1/2 z-10 bg-black rounded-full p-3 text-white shadow-lg"
            title="Scroll right"
            aria-label="Scroll to next games"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Scrollable Games Container */}
          <div 
            id="games-container"
            className="overflow-x-auto scrollbar-hide mx-12 lg:mx-16 xl:mx-20 px-2"
          >
            <div className="flex space-x-3 pb-2">
              {featuredGames.map((game) => (
                <div key={game._id} className="flex-shrink-0 w-36 min-w-36">
                  {renderGameCard(game)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
