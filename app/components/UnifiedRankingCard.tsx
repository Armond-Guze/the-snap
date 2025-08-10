/**
 * Unified ranking card component for displaying team rankings
 * Works with both legacy and unified content types
 */

import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { TeamData } from "@/types/content";

interface UnifiedRankingCardProps {
  teamData: TeamData;
}

type MovementIndicator = {
  symbol: string;
  color: string;
};

// Helper function for movement indicators
function getMovementIndicator(change: number): MovementIndicator {
  if (change > 0) {
    return { symbol: `▲`, color: 'text-green-400' };
  } else if (change < 0) {
    return { symbol: `▼`, color: 'text-red-400' };
  }
  return { symbol: '—', color: 'text-gray-400' };
}

export default function UnifiedRankingCard({ teamData }: UnifiedRankingCardProps) {
  const change = teamData.previousRank ? teamData.previousRank - teamData.rank : 0;
  const movement = getMovementIndicator(change);

  return (
    <article className="group">
      {/* Compact Team Header */}
      <div className="relative bg-black p-3">
        {/* Team Color Accent */}
        {teamData.team?.primaryColor && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: teamData.team.primaryColor }}
          />
        )}
        
        <div className="flex items-center gap-4">
          {/* Rank Display */}
          <div className="flex flex-col items-center min-w-[60px] bg-black rounded-lg p-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Rank
            </span>
            <span className="text-2xl font-black text-white">
              {teamData.rank}
            </span>
          </div>

          {/* Team Logo */}
          {teamData.team?.logo?.asset && (
            <div className="flex-shrink-0">
              <Image
                src={urlFor(teamData.team.logo).width(60).height(60).url()}
                alt={`${teamData.team?.name || 'Team'} logo`}
                width={60}
                height={60}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain"
                priority={teamData.rank <= 5}
              />
            </div>
          )}

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                {teamData.team?.name || 'Unknown Team'}
              </h2>

              {/* Movement Indicator */}
              <div className="flex flex-col items-center min-w-[50px] rounded-lg p-2">
                <span className={`text-lg font-bold ${movement.color}`}>
                  {movement.symbol}
                </span>
                {change !== 0 ? (
                  <span className={`text-xs font-semibold ${movement.color}`}>
                    {Math.abs(change)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            </div>

            {/* Team Record */}
            {teamData.record && (
              <div className="text-sm text-gray-400 mt-1">
                Record: {teamData.record.wins}-{teamData.record.losses}
                {teamData.record.ties ? `-${teamData.record.ties}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-3 bg-black p-6">
        {teamData.reasoning && (
          <p className="text-2xl text-gray-200 leading-relaxed mb-8">
            {teamData.reasoning}
          </p>
        )}
        
        {/* Points display if available */}
        {teamData.points && (
          <div className="text-sm text-gray-400 mb-4">
            <span className="font-semibold">Points:</span> {teamData.points}
          </div>
        )}

        {/* Trend indicator */}
        {teamData.trend && (
          <div className="text-sm mb-4">
            <span className="text-gray-400 font-semibold">Trend:</span>{' '}
            <span className={`font-semibold ${
              teamData.trend === 'up' ? 'text-green-400' : 
              teamData.trend === 'down' ? 'text-red-400' : 
              'text-gray-400'
            }`}>
              {teamData.trend === 'up' ? '↗ Rising' : 
               teamData.trend === 'down' ? '↘ Falling' : 
               '→ Steady'}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
