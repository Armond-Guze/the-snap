import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "NFL Power Rankings - Week by Week Team Rankings | The Snap",
  description: "Comprehensive NFL power rankings updated weekly. See how all 32 NFL teams stack up with expert analysis, win probabilities, and detailed team breakdowns.",
  keywords: "NFL power rankings, NFL team rankings, NFL team analysis, NFL standings, football rankings",
  openGraph: {
    title: "NFL Power Rankings - Week by Week Team Rankings | The Snap",
    description: "Comprehensive NFL power rankings updated weekly. See how all 32 NFL teams stack up with expert analysis.",
    url: 'https://thegamesnap.com/power-rankings',
    images: [
      {
        url: '/images/thesnap-logo-new copy.jpg',
        width: 1200,
        height: 630,
        alt: 'The Snap - NFL Power Rankings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "NFL Power Rankings - Week by Week Team Rankings",
    description: "Comprehensive NFL power rankings updated weekly. See how all 32 NFL teams stack up.",
    images: ['/images/thesnap-logo-new copy.jpg'],
  },
  alternates: {
    canonical: '/power-rankings',
  },
}

export default function PowerRankingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
