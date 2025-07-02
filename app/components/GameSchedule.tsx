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
    case 'playoff': return 'bg-blue-600';
    case 'primetime': return 'bg-purple-600';
    default: return 'bg-gray-600';
  }
}

export default function GameSchedule({ games }: GameScheduleProps) {
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const featuredGames = games;

  // The required distance between touchStart and touchEnd to trigger a swipe
  const minSwipeDistance = 50;

  const nextGame = () => {
    setCurrentGameIndex((prev) => (prev + 1) % featuredGames.length);
  };

  const prevGame = () => {
    setCurrentGameIndex((prev) => (prev - 1 + featuredGames.length) % featuredGames.length);
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

    if (isLeftSwipe && featuredGames.length > 1) {
      nextGame();
    }
    if (isRightSwipe && featuredGames.length > 1) {
      prevGame();
    }
  };

  if (!featuredGames?.length) {
    return (
      <section className="py-4 px-6 lg:px-8 bg-black border-b bg-near-black border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
          </div>
          <span className="text-sm text-gray-400">Week {featuredGames[0]?.week}</span>
        </div>

        {/* Mobile Carousel */}
        <div className="block md:hidden">
          <div className="relative">
            {/* Game Counter */}
            <div className="text-center mb-2">
              <span className="text-sm text-gray-400">
                {currentGameIndex + 1} of {featuredGames.length}
              </span>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevGame}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 rounded-full p-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={featuredGames.length <= 1}
              title="Previous game"
              aria-label="View previous game"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextGame}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 rounded-full p-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={featuredGames.length <= 1}
              title="Next game"
              aria-label="View next game"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Current Game Card */}
            <div 
              className="mx-8 transition-transform duration-300 ease-in-out"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {renderGameCard(featuredGames[currentGameIndex])}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center space-x-2 mt-4">
              {featuredGames.map((game, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentGameIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentGameIndex ? 'bg-white' : 'bg-gray-600'
                  }`}
                  aria-label={`View game ${index + 1}: ${game.awayTeam} at ${game.homeTeam}`}
                  title={`${game.awayTeam} @ ${game.homeTeam}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {featuredGames.map((game) => renderGameCard(game))}
        </div>
      </div>
    </section>
  );

  function renderGameCard(game: Game) {
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
      <div key={game._id} className="bg-deep-black rounded-lg p-2 hover:bg-gray-900 transition-colors duration-300">
        {/* Game Importance Badge */}
        {importanceLabel && (
          <div className={`inline-flex items-center px-2 py-1 rounded-full mb-1 ${importanceColor}`}>
            <span className="text-white text-xs font-semibold">{importanceLabel}</span>
          </div>
        )}

        {/* Teams - Side by Side */}
        <div className="flex items-center justify-between mb-2">
          {/* Away Team */}
          <div className="flex items-center space-x-1 flex-1 min-w-0">
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
            <span className="text-white text-sm font-semibold truncate">
              {game.awayTeam.split(' ').pop()}
            </span>
          </div>

          {/* VS */}
          <div className="px-2">
            <span className="text-gray-400 text-xs font-bold">@</span>
          </div>

          {/* Home Team */}
          <div className="flex items-center space-x-1 flex-1 justify-end min-w-0">
            <span className="text-white text-sm font-semibold truncate text-right">
              {game.homeTeam.split(' ').pop()}
            </span>
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
          </div>
        </div>

        {/* Game Info */}
        <div className="border-t border-gray-700 pt-2">
          <div className="text-center">
            <span className={`text-sm font-medium block ${isToday ? 'text-green-400' : 'text-gray-300'}`}>
              {dateString}
            </span>
            <span className={`text-sm font-medium ${isToday ? 'text-green-400' : 'text-gray-300'}`}>
              {time}
            </span>
          </div>
        </div>
      </div>
    );
  }
}
