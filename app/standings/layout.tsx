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
  url: '/images/thesnap-logo-transparent.png',
        width: 600, // Reduced width
        height: 315, // Reduced height
        alt: 'The Snap - NFL Standings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "NFL Standings 2025 - Division Standings & Playoff Picture",
    description: "Current NFL standings for all divisions. Track team records and playoff implications.",
  images: ['/images/thesnap-logo-transparent.png'],
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
