import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import StructuredData, { createWebsiteStructuredData, createOrganizationStructuredData } from "./components/StructuredData";
import LayoutWrapper from "./components/LayoutWrapper";
import AnalyticsGate from "./components/AnalyticsGate";
import CookieConsent from "./components/CookieConsent";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Centralized config (build-time evaluated)
const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID; // e.g. ca-pub-7706858365277925
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION; // e.g. abcDEF123...

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const LIGHT_THEME_ENABLED = process.env.NEXT_PUBLIC_ENABLE_LIGHT_THEME === "true";

const themeInitScript = `
(() => {
  try {
    const root = document.documentElement;
    ${LIGHT_THEME_ENABLED
      ? `
    const storageKey = "theme-preference";
    const saved = localStorage.getItem(storageKey);
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved === "light" || saved === "dark" ? saved : (systemDark ? "dark" : "light");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.classList.toggle("dark", theme === "dark");
    `
      : `
    const storageKey = "theme-preference";
    root.dataset.theme = "dark";
    root.style.colorScheme = "dark";
    root.classList.add("dark");
    try {
      localStorage.setItem(storageKey, "dark");
    } catch {
      // Ignore storage failures.
    }
    `}
  } catch {
    // Keep server-rendered defaults if storage/media access fails.
  }
})();
`;

export const metadata: Metadata = {
  title: "The Game Snap (The Snap) – NFL News, Rankings & Analysis",
  description: "The Game Snap (The Snap) brings fan-driven NFL coverage focused on quarterbacks, key matchups, and breaking stories. Clean, no-fluff power rankings and analysis for true fans.",
  authors: [{ name: "The Game Snap Editorial Team" }],
  creator: "The Game Snap",
  publisher: "The Game Snap",
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
    title: "The Game Snap (The Snap) – NFL News, Rankings & Analysis",
    description: "The Game Snap (The Snap) brings fan-driven NFL coverage focused on quarterbacks, key matchups, and breaking stories. Clean, no-fluff power rankings and analysis for true fans.",
    url: 'https://thegamesnap.com',
    siteName: 'The Game Snap',
    images: [
  {
    url: 'https://thegamesnap.com/images/thesnap-logo-transparent.png',
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
    title: "The Game Snap (The Snap) – NFL News, Rankings & Analysis",
    description: "The Game Snap (The Snap) brings fan-driven NFL coverage focused on quarterbacks, key matchups, and breaking stories. No fluff.",
    creator: '@thesnap',
    images: ['https://thegamesnap.com/images/thesnap-logo-transparent.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/thesnap-logo-transparent.png', type: 'image/png', sizes: '32x32' },
      { url: '/images/thesnap-logo-transparent.png', type: 'image/png', sizes: '192x192' },
      { url: '/images/thesnap-logo-transparent.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: '/images/thesnap-logo-transparent.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/favicon.svg']
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
  // Inject Google Search Console verification only if provided
  verification: GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteData = createWebsiteStructuredData('The Game Snap', 'https://thegamesnap.com', 'The Snap')
  const organizationData = createOrganizationStructuredData(
    'The Game Snap',
    'https://thegamesnap.com',
    'https://thegamesnap.com/images/thesnap-logo-transparent.png',
    'The Snap'
  )

  return (
    <ClerkProvider>
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content={LIGHT_THEME_ENABLED ? "dark light" : "dark"} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  {/* Explicit favicon links (square SVG for crisp scaling) */}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="alternate icon" href="/favicon.svg" />
  {/* RSS feed autodiscovery */}
  <link rel="alternate" type="application/rss+xml" title="The Snap NFL Headlines" href="/rss.xml" />
        {/* Google AdSense (conditionally loaded) */}
        {ADS_ENABLED && ADSENSE_CLIENT && (
          <Script
            strategy="afterInteractive"
            // NOTE: AdSense requires the client param in the src query string. Keep 'ca-pub-' prefix.
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
  <StructuredData id="sd-website" data={websiteData} />
  <StructuredData id="sd-organization" data={organizationData} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
  {/* Typography experiment toggle removed; default scale always active */}
        <CookieConsent />
        <AnalyticsGate />
  <SpeedInsights />
      </body>
    </html>
    </ClerkProvider>
  );
}
