import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import StructuredData, { createWebsiteStructuredData, createOrganizationStructuredData } from "./components/StructuredData";

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
        url: '/images/the-snap-logo.png',
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
    images: ['/images/the-snap-logo.png'],
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
    'https://thegamesnap.com/images/the-snap-logo.png'
  )

  return (
    <html lang="en">
      <head>
        <StructuredData data={websiteData} />
        <StructuredData data={organizationData} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
