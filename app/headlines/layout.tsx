import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "NFL Headlines & Breaking News - The Snap",
  description: "Stay updated with the latest NFL headlines, breaking news, trade rumors, and injury reports. Get comprehensive coverage of all 32 NFL teams.",
  keywords: "NFL headlines, NFL news, NFL breaking news, NFL trade rumors, NFL injury reports, NFL updates, football news",
  openGraph: {
    title: "NFL Headlines & Breaking News - The Snap",
    description: "Stay updated with the latest NFL headlines, breaking news, trade rumors, and injury reports.",
    url: 'https://thegamesnap.com/headlines',
    images: [
  {
    url: '/images/thesnap-logo-new copy.jpg',
    width: 1200,
    height: 630,
    alt: 'The Snap - NFL Headlines',
  },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "NFL Headlines & Breaking News - The Snap",
    description: "Stay updated with the latest NFL headlines, breaking news, trade rumors, and injury reports.",
  images: ['/images/thesnap-logo-new copy.jpg'],
  },
  alternates: {
    canonical: '/headlines',
  },
}

export default function HeadlinesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
