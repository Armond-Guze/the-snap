import type { Metadata } from "next";
import { redirect } from 'next/navigation'

import { buildPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign Up | The Snap",
  description: "Create a The Snap account.",
  path: "/sign-up",
  noIndex: true,
});

export default function SignUpPage() {
  redirect('/sign-in')
}
