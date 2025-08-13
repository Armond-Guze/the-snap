import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData, { createWebsiteStructuredData, createOrganizationStructuredData } from "./components/StructuredData";
import LayoutWrapper from "./components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Snap - NFL News, Power Rankings & Analysis",
  description: "Your premier destination for NFL insights, power rankings, and breaking news. Stay ahead of the game with expert analysis and comprehensive coverage.",
  keywords: "NFL news, NFL power rankings, NFL standings, football analysis, NFL trades, NFL draft, fantasy football, NFL scores",
  authors: [{ name: "The Snap Editorial Team" }],
  creator: "The Snap",
  publisher: "The Snap",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://thegamesnap.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "The Snap - NFL News, Power Rankings & Analysis",
    description: "Your premier destination for NFL insights, power rankings, and breaking news. Stay ahead of the game with expert analysis and comprehensive coverage.",
    url: 'https://thegamesnap.com',
    siteName: 'The Snap',
    images: [
      {
        url: '/images/the-snaplogo1.png',
        width: 1200,
        height: 630,
        alt: 'The Snap - NFL News and Analysis',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "The Snap - NFL News, Power Rankings & Analysis",
    description: "Your premier destination for NFL insights, power rankings, and breaking news.",
    creator: '@thesnap', // Replace with your actual Twitter handle
    images: ['/images/the-snaplogo1.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-actual-verification-code-here', // Replace with your Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteData = createWebsiteStructuredData('The Snap', 'https://thegamesnap.com')
  const organizationData = createOrganizationStructuredData(
    'The Snap', 
    'https://thegamesnap.com', 
    'https://thegamesnap.com/images/the-snaplogo1.png'
  )

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="dark only" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <StructuredData data={websiteData} />
        <StructuredData data={organizationData} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
