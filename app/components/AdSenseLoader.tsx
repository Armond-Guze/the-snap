"use client";

import Script from "next/script";
import { useConsentPreferences } from "./consent";

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

export default function AdSenseLoader() {
  const consent = useConsentPreferences();

  if (!ADS_ENABLED || !ADSENSE_CLIENT || !consent?.advertising) return null;

  return (
    <Script
      id="adsense-loader"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`}
      crossOrigin="anonymous"
    />
  );
}
