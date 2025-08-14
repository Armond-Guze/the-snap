"use client";

import { client } from "@/sanity/lib/client";
import { standingsQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { useState, useEffect } from "react";

interface StandingsTeam {
  _id: string;
  teamName: string;
  teamLogo?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  };
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  conference: string;
  division: string;
  season: string;
  lastUpdated: string;
}

const divisions = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West'
];

export default function StandingsPage() {
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed syncing/logo update/last updated UI per design request

  // Fetch standings data
  const fetchStandings = async () => {
    try {
      const data: StandingsTeam[] = await client.fetch(standingsQuery);
      setStandings(data);
  // last updated removed from UI
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed sync & logo update handlers (no longer used)

  useEffect(() => {
    fetchStandings();
  }, []);

  // Group teams by division
  const standingsByDivision = divisions.reduce((acc, division) => {
    acc[division] = standings.filter(team => team.division === division);
    return acc;
  }, {} as Record<string, StandingsTeam[]>);

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading standings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Compact Header / Tagline */}
      <header className="px-4 sm:px-6 lg:px-8 pt-8 pb-4 border-b border-gray-800/60 bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            NFL STANDINGS
          </h1>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-3xl">
            Stay updated on the NFL standings with the latest rankings and team performance insights from <span className="text-gray-200 font-semibold">The Snap</span>.
          </p>
        </div>
      </header>
      {/* Standings Content (moved up, improved design) */}
  <section className="relative pt-6 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl space-y-16">
          
          {/* AFC Conference */}
          <div>
            <div className="sticky top-0 z-10 bg-black/95 py-2.5 mb-3 rounded-xl shadow-lg border-b border-gray-800">
              <h2 className="text-xl md:text-2xl font-bold text-white text-center tracking-wide">American Football Conference (AFC)</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {divisions.slice(0, 4).map(division => (
                <div key={division} className="bg-black border border-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="bg-black px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white tracking-wide">{division}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-black/80">
                          <th className="px-2.5 py-1.5 text-left text-[10px] font-bold text-gray-300 uppercase tracking-wider">Team</th>
                          <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">W</th>
                          <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">L</th>
                          <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">Win %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standingsByDivision[division]?.map((team) => (
                          <tr 
                            key={team._id} 
                            className="border-b border-gray-800 hover:bg-gray-900/70 transition-colors bg-black"
                          >
                            <td className="px-2.5 py-2.5">
                              <div className="flex items-center gap-2">
                                {team.teamLogo?.asset ? (
                                  <Image
                                    src={urlFor(team.teamLogo).width(40).height(40).url()}
                                    alt={team.teamName}
                                    width={40}
                                    height={40}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-contain shadow"
                                  />
                                ) : (
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {team.teamName.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-white font-medium text-[13px] sm:text-sm truncate max-w-[110px] md:max-w-[160px]">{team.teamName}</span>
                              </div>
                            </td>
                            <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">
                              {team.wins}
                            </td>
                            <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">
                              {team.losses}
                            </td>
                            <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">
                              {(team.winPercentage * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {standingsByDivision[division]?.length === 0 && (
                    <div className="px-5 py-8 text-center text-gray-400 text-sm">No standings data available for {division}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NFC Conference */}
          <div>
            <div className="sticky top-0 z-10 bg-black/95 py-2.5 mb-3 rounded-xl shadow-lg border-b border-gray-800">
              <h2 className="text-xl md:text-2xl font-bold text-white text-center tracking-wide">National Football Conference (NFC)</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {divisions.slice(4, 8).map(division => (
                <div key={division} className="bg-black border border-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="bg-black px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white tracking-wide">{division}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-black/80">
                          <th className="px-2.5 py-1.5 text-left text-[10px] font-bold text-gray-300 uppercase tracking-wider">Team</th>
                          <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">W</th>
                          <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">L</th>
                          <th className="px-2.5 py-1.5 text-center text-[10px] font-bold text-gray-300 uppercase tracking-wider">Win %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standingsByDivision[division]?.map((team) => (
                          <tr 
                            key={team._id} 
                            className="border-b border-gray-800 hover:bg-gray-900/70 transition-colors bg-black"
                          >
                            <td className="px-2.5 py-2.5">
                              <div className="flex items-center gap-2">
                                {team.teamLogo?.asset ? (
                                  <Image
                                    src={urlFor(team.teamLogo).width(40).height(40).url()}
                                    alt={team.teamName}
                                    width={40}
                                    height={40}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-contain shadow"
                                  />
                                ) : (
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {team.teamName.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-white font-medium text-[13px] sm:text-sm truncate max-w-[110px] md:max-w-[160px]">{team.teamName}</span>
                              </div>
                            </td>
                            <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">
                              {team.wins}
                            </td>
                            <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">
                              {team.losses}
                            </td>
                            <td className="px-2.5 py-2.5 text-center text-white font-medium text-sm">
                              {(team.winPercentage * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {standingsByDivision[division]?.length === 0 && (
                    <div className="px-5 py-8 text-center text-gray-400 text-sm">No standings data available for {division}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
