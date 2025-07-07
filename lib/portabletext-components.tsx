// Custom PortableText components for rendering rich text content

import { PortableTextComponents } from '@portabletext/react'
import Link from 'next/link'
import Image from 'next/image'

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
            <span className="text-4xl text-gray-500 absolute -top-2 -left-2 font-serif">"</span>
            
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
