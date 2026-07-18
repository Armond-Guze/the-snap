import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact The Snap",
  description: "Contact The Snap about corrections, site support, partnerships, business inquiries or NFL coverage feedback.",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: "Contact The Snap",
    description: "Contact The Snap about corrections, site support, partnerships, business inquiries or NFL coverage feedback.",
    url: `${SITE_URL}/contact`,
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
