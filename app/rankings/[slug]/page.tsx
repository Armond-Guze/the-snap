import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import type { Rankings } from "@/types";
import { generateSEOMetadata } from "@/lib/seo";
import { formatArticleDate } from "@/lib/date-utils";
import { portableTextComponents } from "@/lib/portabletext-components";
import { Metadata } from 'next';

interface RankingsPageProps {
  params: Promise<{ slug: string }>;
}

const rankingsDetailQuery = `
  *[_type == "rankings" && slug.current == $slug && published == true][0]{
    _id,
    title,
    slug,
    rankingType,
    summary,
    coverImage {
      asset->{ url }
    },
    author-> {
      name,
      image {
        asset->{ url }
      }
    },
    publishedAt,
    teams[] {
      rank,
      previousRank,
      teamName,
      teamLogo {
        asset->{ url }
      },
      teamColor,
      summary,
      analysis,
      stats[] {
        label,
        value
      }
    },
    methodology,
    seo
  }
`;

export async function generateMetadata(props: RankingsPageProps): Promise<Metadata> {
  const params = await props.params;
  if (!params?.slug) return {};

  const trimmedSlug = decodeURIComponent(params.slug).trim();

  const rankings = await client.fetch<Rankings>(
    rankingsDetailQuery,
    { slug: trimmedSlug }
  );

  if (!rankings) return {};

  return generateSEOMetadata(rankings, '/rankings');
}

export default async function RankingsPage(props: RankingsPageProps) {
  const params = await props.params;
  if (!params?.slug) return notFound();

  const trimmedSlug = decodeURIComponent(params.slug).trim();

  const rankings = await client.fetch<Rankings>(
    rankingsDetailQuery,
    { slug: trimmedSlug }
  );

  if (!rankings) notFound();

  return (
    <main className="bg-black text-white min-h-screen">
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {rankings.title}
          </h1>
          
          {rankings.summary && (
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
              {rankings.summary}
            </p>
          )}

          {rankings.author && (
            <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
              {rankings.author.image?.asset?.url && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={rankings.author.image.asset.url}
                    alt={rankings.author.name || "Author"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span>By {rankings.author.name}</span>
              <span>•</span>
              <span>{formatArticleDate(rankings.publishedAt)}</span>
            </div>
          )}
        </div>

        {/* Cover Image */}
        {rankings.coverImage?.asset?.url && (
          <div className="w-full mb-12">
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
              <Image
                src={rankings.coverImage.asset.url}
                alt={rankings.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Rankings List */}
        <div className="space-y-6 mb-12">
          {rankings.teams.map((team) => (
            <div 
              key={`${team.rank}-${team.teamName}`}
              className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-6">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{team.rank}</span>
                  </div>
                  {team.previousRank && team.previousRank !== team.rank && (
                    <div className="text-center mt-2">
                      <span className={`text-xs ${
                        team.rank < team.previousRank ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {team.rank < team.previousRank ? '↑' : '↓'} {Math.abs(team.rank - team.previousRank)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Team Logo */}
                {team.teamLogo?.asset?.url && (
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={team.teamLogo.asset.url}
                        alt={team.teamName}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2" style={{ color: team.teamColor || '#ffffff' }}>
                    {team.teamName}
                  </h3>
                  
                  {team.summary && (
                    <p className="text-gray-300 mb-4">{team.summary}</p>
                  )}

                  {/* Stats */}
                  {team.stats && team.stats.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {team.stats.map((stat, index) => (
                        <div key={index} className="text-center p-3 bg-slate-800/50 rounded-lg">
                          <div className="text-xl font-bold text-white">{stat.value}</div>
                          <div className="text-xs text-gray-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Analysis */}
                  {team.analysis && (
                    <div className="prose prose-invert prose-sm">
                      <PortableText value={team.analysis} components={portableTextComponents} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Methodology */}
        {rankings.methodology && (
          <div className="bg-slate-900/30 rounded-xl p-8 border border-slate-800/50">
            <h2 className="text-2xl font-bold text-white mb-6">Methodology</h2>
            <div className="prose prose-invert">
              <PortableText value={rankings.methodology} components={portableTextComponents} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
