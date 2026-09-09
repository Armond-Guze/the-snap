import type { Metadata } from 'next';
import Link from 'next/link';
import { SimpleList, SimplePageShell, SimpleSection } from '../components/SimpleInfoPage';
import { SITE_URL } from '@/lib/site-config';
import { createWebsitePageMetadata } from '@/lib/seo';

export const metadata: Metadata = createWebsitePageMetadata({
  title: 'Editorial Standards | The Snap',
  description: 'How The Snap sources, reviews, updates, and labels its NFL reporting and analysis.',
  canonicalUrl: `${SITE_URL}/editorial-standards`,
});

export default function EditorialStandardsPage() {
  return (
    <SimplePageShell
      eyebrow="Editorial trust"
      title="Editorial Standards"
      intro="The Snap aims to publish direct, useful NFL coverage while making the source, analysis, and status of each story clear."
    >
      <SimpleSection title="Reporting and sourcing">
        <SimpleList items={[
          'News stories should identify and link to the original or most authoritative available source.',
          'Anonymous social posts, aggregators, and screenshots are not treated as confirmation on their own.',
          'Rumors, reports, official announcements, analysis, and opinion must be labeled accurately.',
          'Statistics and contract details should be checked against league, team, filing, or established data sources when available.',
        ]} />
      </SimpleSection>

      <SimpleSection title="Original value">
        <p>
          Articles should add useful context, comparison, calculation, reporting, or a clearly identified point of view. We do not
          aim to publish lightly reworded versions of another outlet&apos;s work.
        </p>
      </SimpleSection>

      <SimpleSection title="AI-assisted work">
        <p>
          Software, including generative AI, may help with research organization, drafting, editing, data checks, or production.
          It is not a source and does not replace editorial responsibility. Published claims should be checked against named sources,
          and an editor remains responsible for the final page.
        </p>
      </SimpleSection>

      <SimpleSection title="Updates and corrections">
        <p>
          Material updates should show an updated date and, when useful, a note explaining what changed. Factual errors are corrected
          as promptly as practical under our <Link href="/corrections-policy">corrections policy</Link>.
        </p>
      </SimpleSection>

      <SimpleSection title="Independence and commercial content">
        <p>
          Advertising, sponsorships, affiliate relationships, and supplied products do not determine editorial conclusions. Paid or
          materially sponsored content must be clearly labeled. See the <Link href="/affiliate-disclosure">affiliate disclosure</Link>.
        </p>
      </SimpleSection>

      <p className="text-sm text-white/40">Last updated: August 9, 2026</p>
    </SimplePageShell>
  );
}
