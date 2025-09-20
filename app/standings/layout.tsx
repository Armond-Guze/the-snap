import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "NFL Standings 2025 - Division Standings & Playoff Picture | The Snap",
  description: "Current NFL standings for all divisions. Track team records, win percentages, and playoff implications. Updated after every game with playoff scenarios.",
  keywords: "NFL standings, NFL division standings, NFL playoff picture, NFL records, AFC standings, NFC standings, NFL playoffs 2025",
  openGraph: {
    title: "NFL Standings 2025 - Division Standings & Playoff Picture | The Snap",
    description: "Current NFL standings for all divisions. Track team records, win percentages, and playoff implications.",
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
