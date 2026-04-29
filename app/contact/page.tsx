import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact The Snap | Support, Feedback, and Business Inquiries",
  description:
    "Get in touch with The Snap for support, corrections, partnerships, feedback, or general site questions.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageClient />;
}
