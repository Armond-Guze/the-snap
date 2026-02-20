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
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_URL,
  SITE_BRAND,
  SITE_NAME,
  SITE_TWITTER,
  SITE_URL,
} from "@/lib/site-config";

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
  title: `${SITE_BRAND} (${SITE_NAME}) – NFL News, Rankings & Analysis`,
  description: `${SITE_BRAND} (${SITE_NAME}) brings fan-driven NFL coverage focused on quarterbacks, key matchups, and breaking stories. Clean, no-fluff power rankings and analysis for true fans.`,
  authors: [{ name: `${SITE_BRAND} Editorial Team` }],
  creator: SITE_BRAND,
  publisher: SITE_BRAND,
  applicationName: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${SITE_BRAND} (${SITE_NAME}) – NFL News, Rankings & Analysis`,
    description: `${SITE_BRAND} (${SITE_NAME}) brings fan-driven NFL coverage focused on quarterbacks, key matchups, and breaking stories. Clean, no-fluff power rankings and analysis for true fans.`,
    url: SITE_URL,
    siteName: SITE_BRAND,
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - NFL News and Analysis`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_BRAND} (${SITE_NAME}) – NFL News, Rankings & Analysis`,
    description: `${SITE_BRAND} (${SITE_NAME}) brings fan-driven NFL coverage focused on quarterbacks, key matchups, and breaking stories. No fluff.`,
    creator: SITE_TWITTER,
    images: [DEFAULT_OG_IMAGE_URL],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: DEFAULT_OG_IMAGE_PATH, type: 'image/png', sizes: '32x32' },
      { url: DEFAULT_OG_IMAGE_PATH, type: 'image/png', sizes: '192x192' },
      { url: DEFAULT_OG_IMAGE_PATH, type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: DEFAULT_OG_IMAGE_PATH, sizes: '180x180', type: 'image/png' }
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
  const websiteData = createWebsiteStructuredData(SITE_BRAND, SITE_URL, SITE_NAME)
  const organizationData = createOrganizationStructuredData(
    SITE_BRAND,
    SITE_URL,
    DEFAULT_OG_IMAGE_URL,
    SITE_NAME
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
