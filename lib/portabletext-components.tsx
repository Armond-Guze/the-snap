// Custom PortableText components for rendering rich text content

import { PortableTextComponents } from '@portabletext/react'
import Link from 'next/link'
import Image from 'next/image'
// NOTE: We avoid runtime fetching in portable text render to keep it static.
// Player reference data should be GROQ-populated when querying the document.
type SanityImageRef = { asset?: { _ref?: string, url?: string }; alt?: string }
const urlFor = (src: SanityImageRef | undefined) => src?.asset?.url || ''

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

export const portableTextComponents: PortableTextComponents = {
  // Block-level components
  block: {
    normal: ({ children }) => <p className="mb-4 text-lg leading-relaxed">{children}</p>,
    h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 mt-8">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-bold mb-4 mt-6">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-bold mb-3 mt-5">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-bold mb-2 mt-4">{children}</h4>,
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
      const { player, playerName, team, position, headshot, style = 'banner', subtitle, useTeamColors } = value

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
          default: // banner
            const colors = useTeamColors && TEAM_COLORS[finalTeam]
            const gradientClass = colors && finalTeam
              ? `player-gradient-${finalTeam}`
              : 'bg-gradient-to-r from-white/10 to-white/5'
            return <div className={`relative my-10 py-10 px-6 sm:px-10 rounded-2xl overflow-hidden border border-white/10 backdrop-blur ${gradientClass}`}>{children}</div>
        }
      }

      return (
        <Wrapper>
          <div className={style === 'banner' ? 'flex items-center gap-6' : 'flex items-center gap-4'}>
            {finalHeadshot?.asset && (
              <div className={style === 'banner' ? 'w-28 h-28 relative rounded-xl overflow-hidden ring-2 ring-white/20 flex-shrink-0' : 'w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0'}>
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
              <h2 className={style === 'inline' ? 'text-2xl font-bold' : style === 'card' ? 'text-3xl font-extrabold' : 'text-4xl font-extrabold tracking-tight'}>
                {finalName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-wide text-gray-300">
                {finalTeam && <span className="px-2 py-0.5 bg-black/30 backdrop-blur-sm rounded-md text-white/90 border border-white/20">{finalTeam}</span>}
                {finalPos && <span className="px-2 py-0.5 bg-white/5 rounded-md text-gray-300">{finalPos}</span>}
              </div>
              {subtitle && <p className="text-gray-200 text-sm mt-2 max-w-xl">{subtitle}</p>}
            </div>
          </div>
        </Wrapper>
      )
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
