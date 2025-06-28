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
  const [syncing, setSyncing] = useState(false);
  const [updatingLogos, setUpdatingLogos] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Fetch standings data
  const fetchStandings = async () => {
    try {
      const data: StandingsTeam[] = await client.fetch(standingsQuery);
      setStandings(data);
      if (data.length > 0 && data[0].lastUpdated) {
        setLastSyncTime(data[0].lastUpdated);
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manual sync function
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync-standings', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Sync result:', result);
        
        // Refresh the standings data
        await fetchStandings();
        setLastSyncTime(new Date().toISOString());
      } else {
        console.error('Sync failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Manual logo update function
  const handleLogoUpdate = async () => {
    setUpdatingLogos(true);
    try {
      const response = await fetch('/api/update-logos', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Logo update result:', result);
        
        // Refresh the standings data to show new logos
        await fetchStandings();
      } else {
        console.error('Logo update failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error during logo update:', error);
    } finally {
      setUpdatingLogos(false);
    }
  };

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
      {/* Hero Section */}
      <section className="relative py-24 px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              NFL Standings
            </h1>
            <div className="w-24 h-1 bg-white mx-auto mb-6"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Current team standings organized by division
            </p>
            
            {lastSyncTime && (
              <p className="text-sm text-gray-400">
                Last updated: {new Date(lastSyncTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Standings Content */}
      <section className="relative py-12 px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl space-y-16">
          
          {/* AFC Conference */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              American Football Conference (AFC)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {divisions.slice(0, 4).map(division => (
                <div key={division} className="bg-black border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="bg-black px-6 py-4 border-b border-gray-800">
                    <h3 className="text-xl font-bold text-white">{division}</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-black">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Team</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">W</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">L</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Win %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standingsByDivision[division]?.map((team, index) => (
                          <tr 
                            key={team._id} 
                            className={`border-b border-gray-800 hover:bg-gray-900 transition-colors ${
                              index === 0 ? 'bg-gray-900/50' : 'bg-black'
                            }`}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-3">
                                {team.teamLogo?.asset ? (
                                  <Image
                                    src={urlFor(team.teamLogo).width(40).height(40).url()}
                                    alt={team.teamName}
                                    width={40}
                                    height={40}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-contain"
                                  />
                                ) : (
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {team.teamName.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-white font-medium text-sm sm:text-base">{team.teamName}</span>
                                {index === 0 && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full hidden sm:inline">
                                    Leader
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center text-white font-semibold">
                              {team.wins}
                            </td>
                            <td className="px-4 py-4 text-center text-white font-semibold">
                              {team.losses}
                            </td>
                            <td className="px-4 py-4 text-center text-white font-semibold">
                              {(team.winPercentage * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {standingsByDivision[division]?.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-400">
                      No standings data available for {division}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NFC Conference */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              National Football Conference (NFC)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {divisions.slice(4, 8).map(division => (
                <div key={division} className="bg-black border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="bg-black px-6 py-4 border-b border-gray-800">
                    <h3 className="text-xl font-bold text-white">{division}</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-black">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Team</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">W</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">L</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Win %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standingsByDivision[division]?.map((team, index) => (
                          <tr 
                            key={team._id} 
                            className={`border-b border-gray-800 hover:bg-gray-900 transition-colors ${
                              index === 0 ? 'bg-gray-900/50' : 'bg-black'
                            }`}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-3">
                                {team.teamLogo?.asset ? (
                                  <Image
                                    src={urlFor(team.teamLogo).width(40).height(40).url()}
                                    alt={team.teamName}
                                    width={40}
                                    height={40}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-contain"
                                  />
                                ) : (
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {team.teamName.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-white font-medium text-sm sm:text-base">{team.teamName}</span>
                                {index === 0 && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full hidden sm:inline">
                                    Leader
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center text-white font-semibold">
                              {team.wins}
                            </td>
                            <td className="px-4 py-4 text-center text-white font-semibold">
                              {team.losses}
                            </td>
                            <td className="px-4 py-4 text-center text-white font-semibold">
                              {(team.winPercentage * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {standingsByDivision[division]?.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-400">
                      No standings data available for {division}
                    </div>
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
