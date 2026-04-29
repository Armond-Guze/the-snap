import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/page-metadata";

import NewsletterSignup from "../components/NewsletterSignup";
import { SimpleCard, SimplePageShell, SimpleSection } from "../components/SimpleInfoPage";

const benefits = [
  {
    title: "Weekly signal",
    body: "A cleaner read on what actually matters across the league instead of another noisy recap.",
  },
  {
    title: "Rankings drops",
    body: "Power rankings, offseason movement, and sharper team-level takeaways in one place.",
  },
  {
    title: "Useful updates",
    body: "Fantasy, betting, and content product updates when there is something worth opening.",
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "The Snap Newsletter | Weekly NFL Rankings and Analysis",
  description:
    "Subscribe to The Snap newsletter for weekly rankings, analysis, and product updates without the usual sports-media noise.",
  path: "/newsletter",
});

export default function NewsletterPage() {
  return (
    <SimplePageShell
      eyebrow="Newsletter"
      title="Get The Snap in your inbox."
      intro="A simple weekly email with rankings, analysis, and site updates. No blue gradients, no fake urgency, no extra noise."
    >
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <NewsletterSignup variant="sidebar" />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {benefits.map((benefit) => (
          <SimpleCard key={benefit.title} title={benefit.title} body={benefit.body} />
        ))}
      </section>

      <SimpleSection title="Prefer RSS?">
        <p>
          If you would rather follow headlines in an RSS reader, you can use the site feed instead of email.
        </p>
        <div className="pt-1">
          <a
            href="/rss.xml"
            className="inline-flex rounded-full border border-white/12 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Open RSS Feed
          </a>
        </div>
      </SimpleSection>

      <SimpleSection title="FAQ">
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-white">How often will emails go out?</h3>
            <p className="mt-2">Usually weekly, with occasional sends when there is a major update worth sending.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Can I unsubscribe?</h3>
            <p className="mt-2">Yes. Every email should have an unsubscribe option.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Is it free?</h3>
            <p className="mt-2">Yes. The newsletter is free.</p>
          </div>
        </div>
      </SimpleSection>
    </SimplePageShell>
  );
}
