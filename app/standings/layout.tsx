import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "2025 NFL Standings – Division Leaders & Playoff Picture | The Snap",
  description: "Stay updated on the 2025 NFL standings with division-by-division records and playoff race context. Fresh after every game window.",
  keywords: "NFL standings, NFL division standings, NFL playoff picture, NFL records, AFC standings, NFC standings, NFL playoffs 2025",
  openGraph: {
    title: "2025 NFL Standings – Division Leaders & Playoff Picture | The Snap",
    description: "Live 2025 NFL standings with records, division leaders, and playoff implications after every game.",
    url: 'https://thegamesnap.com/standings',
    images: [
      {
        url: '/images/thesnap-logo-new copy.jpg',
        width: 1200,
        height: 630,
        alt: 'NFL Standings - The Snap',
      },
    ],
  },
  twitter: {
    images: ['/images/thesnap-logo-new copy.jpg'],
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
