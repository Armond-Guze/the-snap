import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { sanityFetchDynamic } from '@/sanity/lib/fetch';
import { headlineDetailQuery } from '@/sanity/lib/queries';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 300;

interface HeadlinePageProps {
  params: Promise<{ slug?: string }>;
}

type LegacyHeadlineRedirect = {
  slug?: {
    current?: string;
  };
};

function normalizeSlug(slug?: string) {
  if (!slug) return '';
  return decodeURIComponent(slug).trim().replace(/^\/+|\/+$/g, '');
}

async function getPublishedHeadline(slug: string) {
  return sanityFetchDynamic<LegacyHeadlineRedirect>(
    headlineDetailQuery,
    { slug },
    300,
    null as unknown as LegacyHeadlineRedirect
  );
}

export async function generateMetadata(props: HeadlinePageProps): Promise<Metadata> {
  const params = await props.params;
  const fallbackSlug = normalizeSlug(params?.slug);
  if (!fallbackSlug) {
    return {
      robots: { index: false, follow: true },
    };
  }

  const headline = await getPublishedHeadline(fallbackSlug);
  const articleSlug = normalizeSlug(headline?.slug?.current) || fallbackSlug;
  const canonical = `${SITE_URL}/articles/${articleSlug}`;

  return {
    title: 'Redirecting to article | The Snap',
    alternates: { canonical },
    robots: { index: false, follow: true },
  };
}

export default async function HeadlinePage(props: HeadlinePageProps) {
  const params = await props.params;
  const fallbackSlug = normalizeSlug(params?.slug);
  if (!fallbackSlug) notFound();

  const headline = await getPublishedHeadline(fallbackSlug);
  if (!headline) notFound();

  const articleSlug = normalizeSlug(headline.slug?.current) || fallbackSlug;
  permanentRedirect(`/articles/${articleSlug}`);
}
