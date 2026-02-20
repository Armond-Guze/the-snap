import { Metadata } from 'next'
import { DEFAULT_OG_IMAGE_PATH, SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: "NFL Standings – Division Leaders & Playoff Picture | The Snap",
  description: "Stay updated on NFL standings with division-by-division records and playoff race context. Fresh after every game window.",
  keywords: "NFL standings, NFL division standings, NFL playoff picture, NFL records, AFC standings, NFC standings",
  openGraph: {
    title: "NFL Standings – Division Leaders & Playoff Picture | The Snap",
    description: "Live NFL standings with records, division leaders, and playoff implications after every game.",
    url: `${SITE_URL}/standings`,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: 'NFL Standings - The Snap',
      },
    ],
  },
  twitter: {
    images: [DEFAULT_OG_IMAGE_PATH],
  },
  alternates: {
    canonical: '/standings',
  },
}

export default function StandingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <nav className="text-lg"> {/* Tailwind class for font size */}
      {children}
    </nav>
  )
}
