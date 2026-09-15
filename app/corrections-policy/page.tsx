import type { Metadata } from 'next';
import { SimpleList, SimplePageShell, SimpleSection } from '../components/SimpleInfoPage';
import { SITE_URL } from '@/lib/site-config';
import { createWebsitePageMetadata } from '@/lib/seo';

export const metadata: Metadata = createWebsitePageMetadata({
  title: 'Corrections Policy | The Snap',
  description: 'How to report an error and how The Snap handles corrections and material updates.',
  canonicalUrl: `${SITE_URL}/corrections-policy`,
});

export default function CorrectionsPolicyPage() {
  return (
    <SimplePageShell
      eyebrow="Editorial trust"
      title="Corrections Policy"
      intro="Accuracy matters. Readers and sources can report a possible error, and material corrections should be made transparently."
    >
      <SimpleSection title="Report a possible error">
        <p>
          Email <a href="mailto:thegamesnap@yahoo.com?subject=Correction%20request" className="font-semibold text-neutral-900 hover:text-neutral-600">thegamesnap@yahoo.com</a> with
          the page URL, the statement you believe is wrong, and a reliable supporting source when available.
        </p>
      </SimpleSection>

      <SimpleSection title="What happens next">
        <SimpleList items={[
          'We review the cited passage and the best available primary or authoritative evidence.',
          'If a material factual error is confirmed, we update the story and add an update or correction note when context requires it.',
          'Minor spelling, grammar, formatting, or link repairs may be fixed without a separate note when they do not change meaning.',
          'Developing stories may be updated as new verified information becomes available.',
        ]} />
      </SimpleSection>

      <SimpleSection title="Disagreements and opinion">
        <p>
          Rankings, projections, and analysis can involve judgment. A disagreement with a conclusion is not automatically a factual
          error, but any underlying incorrect fact will still be reviewed.
        </p>
      </SimpleSection>

      <p className="text-sm text-neutral-600">Last updated: August 9, 2026</p>
    </SimplePageShell>
  );
}
