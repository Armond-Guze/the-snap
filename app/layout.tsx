import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import StructuredData, { createWebsiteStructuredData, createOrganizationStructuredData } from "./components/StructuredData";
import LayoutWrapper from "./components/LayoutWrapper";
import AnalyticsGate from "./components/AnalyticsGate";
import CookieConsent from "./components/CookieConsent";
import AdSenseLoader from "./components/AdSenseLoader";
import {
  DEFAULT_OG_IMAGE_URL,
  SITE_BRAND,
  SITE_NAME,
  SITE_SOCIAL_URLS,
  SITE_TWITTER,
  SITE_URL,
} from "@/lib/site-config";

// Centralized config (build-time evaluated)
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION; // e.g. abcDEF123...


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

// Keep the requested light appearance stable across saved preferences and OS themes.
const themeInitScript = `
(() => {
  const root = document.documentElement;
  root.dataset.theme = "light";
  root.style.colorScheme = "light";
  root.classList.remove("dark");
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
      { url: '/favicon.ico?v=3', sizes: '16x16 32x32 48x48' },
      { url: '/snap-icon-32-v3.png', type: 'image/png', sizes: '32x32' },
      { url: '/snap-icon-192-v3.png', type: 'image/png', sizes: '192x192' },
      { url: '/snap-icon-512-v3.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.svg?v=3', type: 'image/svg+xml', sizes: 'any' }
    ],
    apple: [
      { url: '/snap-icon-180-v3.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/favicon.ico?v=3']
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
    SITE_NAME,
    [...SITE_SOCIAL_URLS]
  )

  return (
    <ClerkProvider>
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  {/* RSS feed autodiscovery */}
  <link rel="alternate" type="application/rss+xml" title="The Snap NFL Headlines" href="/rss.xml" />
  <StructuredData id="sd-website" data={websiteData} />
  <StructuredData id="sd-organization" data={organizationData} />
      </head>
      <body className="antialiased">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
  {/* Typography experiment toggle removed; default scale always active */}
        <CookieConsent />
        <AdSenseLoader />
        <AnalyticsGate />
      </body>
    </html>
    </ClerkProvider>
  );
}
