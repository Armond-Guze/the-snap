import type { Metadata } from "next";
import NewsletterSignup from "../components/NewsletterSignup";
import { SimpleCard, SimplePageShell, SimpleSection } from "../components/SimpleInfoPage";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "The Snap NFL Newsletter",
  description: "Get The Snap's NFL rankings, analysis, fantasy coverage and important site updates by email.",
  alternates: { canonical: `${SITE_URL}/newsletter` },
  openGraph: {
    title: "The Snap NFL Newsletter",
    description: "Get The Snap's NFL rankings, analysis, fantasy coverage and important site updates by email.",
    url: `${SITE_URL}/newsletter`,
    type: "website",
  },
};

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

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ newsletter?: string | string[] }>;
}) {
  const params = await searchParams;
  const status = Array.isArray(params.newsletter) ? params.newsletter[0] : params.newsletter;

  return (
    <SimplePageShell
      eyebrow="Newsletter"
      title="Get The Snap in your inbox."
      intro="A simple weekly email with rankings, analysis, and site updates. No blue gradients, no fake urgency, no extra noise."
    >
      {status === 'success' && (
        <p role="status" className="rounded-2xl border border-emerald-300/25 bg-emerald-50 px-5 py-4 text-emerald-900">
          Check your inbox and use the confirmation link to finish subscribing.
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="rounded-2xl border border-red-300/25 bg-red-50 px-5 py-4 text-red-900">
          We could not complete that signup. Please check the address and try again.
        </p>
      )}

      <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
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
            className="inline-flex rounded-full border border-neutral-200 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Open RSS Feed
          </a>
        </div>
      </SimpleSection>

      <SimpleSection title="FAQ">
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">How often will emails go out?</h3>
            <p className="mt-2">Usually weekly, with occasional sends when there is a major update worth sending.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Can I unsubscribe?</h3>
            <p className="mt-2">Yes. Every email should have an unsubscribe option.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Is it free?</h3>
            <p className="mt-2">Yes. The newsletter is free.</p>
          </div>
        </div>
      </SimpleSection>
    </SimplePageShell>
  );
}
