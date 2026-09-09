import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import StructuredData, { createWebsiteStructuredData, createOrganizationStructuredData } from "./components/StructuredData";
import LayoutWrapper from "./components/LayoutWrapper";
import AnalyticsGate from "./components/AnalyticsGate";
import CookieConsent from "./components/CookieConsent";
import AdSenseLoader from "./components/AdSenseLoader";
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_URL,
  SITE_BRAND,
  SITE_NAME,
  SITE_SOCIAL_URLS,
  SITE_TWITTER,
  SITE_URL,
} from "@/lib/site-config";

// Centralized config (build-time evaluated)
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION; // e.g. abcDEF123...

const LIGHT_THEME_ENABLED = process.env.NEXT_PUBLIC_ENABLE_LIGHT_THEME === "true";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: LIGHT_THEME_ENABLED ? "dark light" : "dark",
};

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
    SITE_NAME,
    [...SITE_SOCIAL_URLS]
  )

  return (
    <ClerkProvider>
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  {/* Explicit favicon links (square SVG for crisp scaling) */}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="alternate icon" href="/favicon.svg" />
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
