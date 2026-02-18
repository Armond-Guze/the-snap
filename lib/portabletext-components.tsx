// Custom PortableText components for rendering rich text content

import { PortableTextComponents } from '@portabletext/react'
import Link from 'next/link'
import Image from 'next/image'
import SnapGraphicCard from '@/app/components/SnapGraphicCard'
// NOTE: We avoid runtime fetching in portable text render to keep it static.
// Player reference data should be GROQ-populated when querying the document.
type SanityImageRef = { asset?: { _ref?: string, url?: string }; alt?: string }
const urlFor = (src: SanityImageRef | undefined) => src?.asset?.url || ''
type RankingCardValue = {
  rank?: number
  name?: string
  position?: string
  player?: { name?: string; team?: string; position?: string }
  team?: { title?: string; slug?: { current?: string } }
}

// Basic NFL team color map (primary, secondary)
const TEAM_COLORS: Record<string, { bg: string; accent: string }> = {
  BUF: { bg: '#00338D', accent: '#C60C30' },
  DAL: { bg: '#041E42', accent: '#869397' },
  KC: { bg: '#E31837', accent: '#FFB81C' },
  PHI: { bg: '#004C54', accent: '#A5ACAF' },
  SF: { bg: '#AA0000', accent: '#B3995D' },
  GB: { bg: '#203731', accent: '#FFB612' },
  MIA: { bg: '#008E97', accent: '#F58220' },
  NYJ: { bg: '#125740', accent: '#FFFFFF' },
  NE: { bg: '#002244', accent: '#C60C30' },
  PIT: { bg: '#101820', accent: '#FFB612' },
  BAL: { bg: '#241773', accent: '#9E7C0C' },
  DEN: { bg: '#002244', accent: '#FB4F14' },
  CHI: { bg: '#0B162A', accent: '#C83803' },
  DET: { bg: '#0076B6', accent: '#B0B7BC' },
  MIN: { bg: '#4F2683', accent: '#FFC62F' },
  NO: { bg: '#101820', accent: '#D3BC8D' },
  LV: { bg: '#000000', accent: '#A5ACAF' },
  LAC: { bg: '#0080C6', accent: '#FFC20E' },
  LAR: { bg: '#003594', accent: '#FFA300' },
  ATL: { bg: '#A71930', accent: '#000000' },
  CAR: { bg: '#0085CA', accent: '#101820' },
  CLE: { bg: '#311D00', accent: '#FF3C00' },
  HOU: { bg: '#03202F', accent: '#A71930' },
  IND: { bg: '#002C5F', accent: '#A2AAAD' },
  JAX: { bg: '#101820', accent: '#D7A22A' },
  TEN: { bg: '#0C2340', accent: '#4B92DB' },
  SEA: { bg: '#002244', accent: '#69BE28' },
  TB: { bg: '#D50A0A', accent: '#FF7900' },
  WAS: { bg: '#5A1414', accent: '#FFB612' },
  ARI: { bg: '#97233F', accent: '#FFB612' },
  CIN: { bg: '#FB4F14', accent: '#000000' },
  NYG: { bg: '#0B2265', accent: '#A71930' },
};

const TEAM_NAME_TO_CODE: Record<string, string> = {
  'arizona cardinals': 'ARI',
  'atlanta falcons': 'ATL',
  'baltimore ravens': 'BAL',
  'buffalo bills': 'BUF',
  'carolina panthers': 'CAR',
  'chicago bears': 'CHI',
  'cincinnati bengals': 'CIN',
  'cleveland browns': 'CLE',
  'dallas cowboys': 'DAL',
  'denver broncos': 'DEN',
  'detroit lions': 'DET',
  'green bay packers': 'GB',
  'houston texans': 'HOU',
  'indianapolis colts': 'IND',
  'jacksonville jaguars': 'JAX',
  'kansas city chiefs': 'KC',
  'las vegas raiders': 'LV',
  'los angeles chargers': 'LAC',
  'los angeles rams': 'LAR',
  'miami dolphins': 'MIA',
  'minnesota vikings': 'MIN',
  'new england patriots': 'NE',
  'new orleans saints': 'NO',
  'new york giants': 'NYG',
  'new york jets': 'NYJ',
  'philadelphia eagles': 'PHI',
  'pittsburgh steelers': 'PIT',
  'san francisco 49ers': 'SF',
  'seattle seahawks': 'SEA',
  'tampa bay buccaneers': 'TB',
  'tennessee titans': 'TEN',
  'washington commanders': 'WAS',
}

const TEAM_SLUG_TO_CODE: Record<string, string> = {
  'arizona-cardinals': 'ARI',
  'atlanta-falcons': 'ATL',
  'baltimore-ravens': 'BAL',
  'buffalo-bills': 'BUF',
  'carolina-panthers': 'CAR',
  'chicago-bears': 'CHI',
  'cincinnati-bengals': 'CIN',
  'cleveland-browns': 'CLE',
  'dallas-cowboys': 'DAL',
  'denver-broncos': 'DEN',
  'detroit-lions': 'DET',
  'green-bay-packers': 'GB',
  'houston-texans': 'HOU',
  'indianapolis-colts': 'IND',
  'jacksonville-jaguars': 'JAX',
  'kansas-city-chiefs': 'KC',
  'las-vegas-raiders': 'LV',
  'los-angeles-chargers': 'LAC',
  'los-angeles-rams': 'LAR',
  'miami-dolphins': 'MIA',
  'minnesota-vikings': 'MIN',
  'new-england-patriots': 'NE',
  'new-orleans-saints': 'NO',
  'new-york-giants': 'NYG',
  'new-york-jets': 'NYJ',
  'philadelphia-eagles': 'PHI',
  'pittsburgh-steelers': 'PIT',
  'san-francisco-49ers': 'SF',
  'seattle-seahawks': 'SEA',
  'tampa-bay-buccaneers': 'TB',
  'tennessee-titans': 'TEN',
  'washington-commanders': 'WAS',
}

const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '')
  const expanded = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  const r = parseInt(expanded.slice(0, 2), 16)
  const g = parseInt(expanded.slice(2, 4), 16)
  const b = parseInt(expanded.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const resolveTeamCode = (value: RankingCardValue): string | null => {
  const fromPlayer = typeof value?.player?.team === 'string' ? value.player.team.trim().toUpperCase() : ''
  if (fromPlayer && TEAM_COLORS[fromPlayer]) return fromPlayer

  const fromTeamTitle = typeof value?.team?.title === 'string' ? value.team.title.trim() : ''
  const fromTeamTitleCode = fromTeamTitle.toUpperCase()
  if (fromTeamTitleCode && TEAM_COLORS[fromTeamTitleCode]) return fromTeamTitleCode

  const fromTeamSlug = typeof value?.team?.slug?.current === 'string' ? value.team.slug.current.trim().toLowerCase() : ''
  const fromTeamSlugCode = fromTeamSlug.toUpperCase()
  if (fromTeamSlugCode && TEAM_COLORS[fromTeamSlugCode]) return fromTeamSlugCode

  const mappedFromTitle = TEAM_NAME_TO_CODE[fromTeamTitle.toLowerCase()]
  if (mappedFromTitle) return mappedFromTitle

  const mappedFromSlug = TEAM_SLUG_TO_CODE[fromTeamSlug]
  if (mappedFromSlug) return mappedFromSlug

  return null
}

// Utility to create deterministic slug IDs from heading text (TOC + deep links)
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks for wider runtime compatibility
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const portableTextComponents: PortableTextComponents = {
  // Block-level components
  block: {
    normal: ({ children }) => <p className="mb-5 text-[1.05rem] leading-relaxed tracking-[0.01em]">{children}</p>,
    h1: ({ children }) => <h1 className="text-4xl font-extrabold mb-6 mt-10 tracking-tight scroll-mt-28" id={slugify(String(children))}>{children}</h1>,
    h2: ({ children }) => {
      const text = String(children);
      const id = slugify(text);
      return (
        <h2
          id={id}
          className="group relative text-3xl font-bold mb-4 mt-12 tracking-tight scroll-mt-28"
        >
          <a
            href={`#${id}`}
            className="absolute -left-6 opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-white"
            aria-label="Link to section"
          >
            #
          </a>
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const text = String(children);
      const id = slugify(text);
      return (
        <h3
          id={id}
          className="group relative text-2xl font-semibold mb-3 mt-10 tracking-tight scroll-mt-28"
        >
          <a
            href={`#${id}`}
            className="absolute -left-6 opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-white"
            aria-label="Link to subsection"
          >
            #
          </a>
          {children}
        </h3>
      );
    },
    h4: ({ children }) => {
      const text = String(children);
      const id = slugify(text);
      return (
        <h4
          id={id}
          className="group relative text-xl font-semibold mb-2 mt-8 tracking-tight scroll-mt-28"
        >
          <a
            href={`#${id}`}
            className="absolute -left-6 opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-white"
            aria-label="Link to subsection"
          >
            #
          </a>
          {children}
        </h4>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-6 text-gray-300 bg-gray-900/50 py-4 rounded-r-lg">
        {children}
      </blockquote>
    ),
  },

  // List components
  list: {
    bullet: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
  },

  listItem: {
    bullet: ({ children }) => <li className="text-lg leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="text-lg leading-relaxed">{children}</li>,
  },

  // Inline mark components
  marks: {
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
    underline: ({ children }) => <u className="underline decoration-2 underline-offset-4 text-white">{children}</u>,
    large: ({ children }) => <span className="text-2xl font-bold text-white">{children}</span>,
    link: ({ children, value }) => {
      const href = value?.href || '#'
      
      // Check if it's an external link
      if (href.startsWith('http')) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors"
          >
            {children}
          </a>
        )
      }
      
      // Internal link
      return (
        <Link
          href={href}
          className="text-blue-400 hover:text-blue-300 underline transition-colors"
        >
          {children}
        </Link>
      )
    },
  },

  // Custom types
  types: {
    image: ({ value }) => {
      if (!value?.asset?.url) return null
      
      return (
        <div className="my-8">
          <div className="relative w-full h-96 rounded-lg overflow-hidden">
            <Image
              src={value.asset.url}
              alt={value.alt || 'Article image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          </div>
          {value.alt && (
            <p className="text-sm text-gray-400 mt-2 text-center italic">
              {value.alt}
            </p>
          )}
        </div>
      )
    },

    // Enhanced blockquote for player/coach quotes
    blockquote: ({ value }) => {
      const { text, author, title, team, source, style = 'default' } = value || {}
      
      if (!text) return null

      const getQuoteStyles = () => {
        switch (style) {
          case 'highlighted':
            return 'bg-gradient-to-r from-white/10 to-white/5 border-l-4 border-white p-6 rounded-r-xl my-8'
          case 'pullquote':
            return 'bg-gray-900/80 border-2 border-gray-600 p-8 rounded-xl my-10 text-center max-w-2xl mx-auto'
          case 'sidebar':
            return 'bg-gray-800/60 border border-gray-600 p-6 rounded-lg my-6 ml-8 max-w-sm float-right clear-right'
          default:
            return 'border-l-4 border-gray-400 pl-6 py-4 my-6 bg-gray-900/30 rounded-r-lg'
        }
      }

      return (
        <blockquote className={getQuoteStyles()}>
          <div className="relative">
            {/* Quote mark */}
            <span className="text-4xl text-gray-500 absolute -top-2 -left-2 font-serif">&ldquo;</span>
            
            {/* Quote text */}
            <p className={`text-lg leading-relaxed ${style === 'pullquote' ? 'text-xl font-medium' : ''} ${style === 'highlighted' ? 'text-white font-medium' : 'text-gray-200'} italic mb-4 ml-4`}>
              {text}
            </p>
            
            {/* Attribution */}
            {author && (
              <footer className="flex flex-col gap-1 ml-4">
                <cite className={`font-semibold not-italic ${style === 'highlighted' ? 'text-white' : 'text-gray-300'}`}>
                  — {author}
                </cite>
                {(title || team) && (
                  <span className="text-sm text-gray-400">
                    {title && team ? `${title}, ${team}` : title || team}
                  </span>
                )}
                {source && (
                  <span className="text-xs text-gray-500 mt-1">
                    Source: {source}
                  </span>
                )}
              </footer>
            )}
          </div>
        </blockquote>
      )
    },

    // Player Heading component
    playerHeading: ({ value }) => {
      if (!value) return null
  const { player, playerName, team, position, headshot, style = 'banner', subtitle, useTeamColors, rank } = value

      // If GROQ query expanded player reference, prefer those fields
      const finalName = player?.name || playerName
      const finalTeam = (player?.team || team || '').toUpperCase()
      const finalPos = player?.position || position
      const finalHeadshot: SanityImageRef | undefined = player?.headshot || headshot

      const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        switch (style) {
          case 'inline':
            return <div className="flex items-center gap-4 my-6 py-2 border-b border-gray-700">{children}</div>
          case 'card':
            return <div className="my-8 p-6 bg-gray-900/60 border border-gray-700 rounded-xl shadow-lg flex flex-col sm:flex-row gap-6">{children}</div>
          default: // banner (compact tweaks)
            const colors = useTeamColors && TEAM_COLORS[finalTeam]
            const gradientClass = colors && finalTeam
              ? `player-gradient-${finalTeam}`
              : 'bg-gradient-to-r from-white/10 to-white/5'
            // Reduced vertical spacing & padding for a more compact look
            return <div className={`relative my-8 py-6 px-5 sm:py-7 sm:px-8 rounded-xl overflow-hidden border border-white/10 backdrop-blur ${gradientClass}`}>{children}</div>
        }
      }

      return (
        <Wrapper>
          <div className={style === 'banner' ? 'flex items-center gap-5' : 'flex items-center gap-4'}>
            {finalHeadshot?.asset && (
              <div className={style === 'banner' ? 'w-24 h-24 relative rounded-xl overflow-hidden ring-2 ring-white/15 flex-shrink-0' : 'w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0'}>
                <Image
                  src={urlFor(finalHeadshot).toString()}
                  alt={finalHeadshot.alt || finalName || 'Player headshot'}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            )}
            <div className="space-y-1">
              <h2 className={
                style === 'inline'
                  ? 'text-2xl font-bold flex items-center gap-4'
                  : style === 'card'
                    ? 'text-3xl font-extrabold flex items-center gap-5'
                    : 'text-3xl sm:text-[2.25rem] font-extrabold tracking-tight flex items-center gap-5'
              }>
                {typeof rank === 'number' && !isNaN(rank) && (
                  <span className="shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/15 border border-white/20 font-extrabold text-3xl text-white shadow-sm backdrop-blur-sm">
                    {rank}
                  </span>
                )}
                <div className="flex flex-col leading-tight">
                  <span className="block">{finalName}</span>
                  {(finalTeam || finalPos) && (
                    <span className="mt-1 text-xs sm:text-sm font-medium tracking-wide text-gray-300/90 uppercase">
                      {[finalTeam, finalPos].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </div>
              </h2>
              {subtitle && <p className="text-gray-300 text-[13px] leading-snug mt-3 max-w-xl">{subtitle}</p>}
            </div>
          </div>
        </Wrapper>
      )
    },

    rankingCard: ({ value }) => {
      if (!value) return null

      const rankingValue = value as RankingCardValue
      const rank = typeof rankingValue.rank === 'number' ? rankingValue.rank : null
      const fallbackName =
        (typeof rankingValue.name === 'string' && rankingValue.name.trim()) ||
        (typeof rankingValue.player?.name === 'string' && rankingValue.player.name.trim()) ||
        (typeof rankingValue.team?.title === 'string' && rankingValue.team.title.trim()) ||
        'Ranking Entry'
      const position =
        (typeof rankingValue.player?.position === 'string' && rankingValue.player.position.trim()) ||
        (typeof rankingValue.position === 'string' && rankingValue.position.trim()) ||
        ''
      const teamCode = resolveTeamCode(rankingValue)
      const teamColors = teamCode ? TEAM_COLORS[teamCode] : null
      const cardStyle = teamColors
        ? {
            backgroundImage: `linear-gradient(145deg, ${hexToRgba(teamColors.bg, 0.96)} 0%, ${hexToRgba(teamColors.bg, 0.88)} 52%, ${hexToRgba(teamColors.accent, 0.66)} 100%)`,
            borderColor: hexToRgba(teamColors.accent, 0.46),
          }
        : undefined

      return (
        <article
          className={`my-8 overflow-hidden rounded-2xl border shadow-xl ${teamColors ? '' : 'border-white/15 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black'}`}
          style={cardStyle}
        >
          <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex min-w-0 items-start gap-4">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-2xl font-black text-white">
                {rank !== null ? rank : '?'}
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  {fallbackName}
                </h3>
              </div>
            </div>
            {position && (
              <div className="shrink-0 rounded-lg border border-white/25 bg-black/25 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
                {position.toUpperCase()}
              </div>
            )}
          </div>
        </article>
      )
    },

    // Snap-style graphic card (Aura Meter + Trajectory Sticker + Pressure Stamp)
    snapGraphicCard: ({ value }) => {
      return <SnapGraphicCard value={value} />
    },

    // Content dividers
    divider: ({ value }) => {
      const { style = 'line', spacing = 'medium', customText } = value || {}
      
      const getSpacingClass = () => {
        switch (spacing) {
          case 'small': return 'my-4'
          case 'large': return 'my-12'
          default: return 'my-8'
        }
      }

      const getDividerContent = () => {
        switch (style) {
          case 'dots':
            return (
              <div className="text-center text-gray-500 text-2xl tracking-widest">
                • • • • • • •
              </div>
            )
          case 'stars':
            return (
              <div className="text-center text-gray-400 text-xl tracking-wide">
                ★ ★ ★ ★ ★
              </div>
            )
          case 'nfl':
            return (
              <div className="text-center text-2xl tracking-wide">
                🏈 🏈 🏈
              </div>
            )
          case 'custom':
            return customText ? (
              <div className="text-center text-gray-400 font-medium">
                {customText}
              </div>
            ) : (
              <hr className="border-gray-600" />
            )
          default:
            return <hr className="border-gray-600" />
        }
      }

      return (
        <div className={`flex justify-center items-center ${getSpacingClass()}`}>
          {getDividerContent()}
        </div>
      )
    },
  },

  // Handle unknown marks gracefully
  unknownMark: ({ children }) => <span>{children}</span>,
  
  // Handle unknown types gracefully
  unknownType: ({ children }) => <div>{children}</div>,
}
