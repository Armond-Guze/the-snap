import { permanentRedirect } from 'next/navigation';
import type { PageProps } from '@/types';

export default async function LegacyPowerRankingsSnapshot({ params }: PageProps) {
  const { season, week } = await params;
  permanentRedirect(`/articles/power-rankings/${season}/${week}`);
}
