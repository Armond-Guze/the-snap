import { permanentRedirect } from 'next/navigation';

interface LegacyRankingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LegacyRankingsPage({ params }: LegacyRankingsPageProps) {
  const { slug } = await params;
  permanentRedirect(`/articles/${encodeURIComponent(slug)}`);
}
