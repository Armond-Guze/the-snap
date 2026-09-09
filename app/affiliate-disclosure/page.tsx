import type { Metadata } from 'next';
import { SimplePageShell, SimpleSection } from '../components/SimpleInfoPage';
import { SITE_URL } from '@/lib/site-config';
import { createWebsitePageMetadata } from '@/lib/seo';

export const metadata: Metadata = createWebsitePageMetadata({
  title: 'Affiliate and Sponsorship Disclosure | The Snap',
  description: 'How The Snap labels affiliate links, advertising, sponsorships, and betting-related commercial relationships.',
  canonicalUrl: `${SITE_URL}/affiliate-disclosure`,
});

export default function AffiliateDisclosurePage() {
  return (
    <SimplePageShell
      eyebrow="Transparency"
      title="Affiliate and Sponsorship Disclosure"
      intro="The Snap may earn revenue from advertising, sponsorships, or qualifying purchases made through clearly disclosed links."
    >
      <SimpleSection title="Affiliate links">
        <p>
          A page containing compensated affiliate links should disclose that relationship near the relevant recommendation. If a reader
          uses one of those links, The Snap may receive a commission without increasing the reader&apos;s price.
        </p>
      </SimpleSection>
      <SimpleSection title="Sponsored content and advertising">
        <p>
          Paid placements and sponsored editorial features must be labeled so they are distinguishable from independent coverage.
          Advertisers and sponsors do not receive a right to approve unrelated editorial conclusions.
        </p>
      </SimpleSection>
      <SimpleSection title="Betting and fantasy content">
        <p>
          Betting content is for informational and entertainment purposes and is not financial or legal advice. Availability and age
          requirements vary by jurisdiction. Readers are responsible for complying with local law and should use responsible-gaming tools.
        </p>
      </SimpleSection>
      <SimpleSection title="Questions">
        <p>
          Questions about a commercial relationship can be sent to <a href="mailto:thegamesnap@yahoo.com" className="font-semibold text-white hover:text-white/75">thegamesnap@yahoo.com</a>.
        </p>
      </SimpleSection>
      <p className="text-sm text-white/40">Last updated: August 9, 2026</p>
    </SimplePageShell>
  );
}
