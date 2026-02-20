import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
  description: 'Follow the latest NFL Power Rankings updated each week for all 32 teams. See who is rising or falling with fresh commentary on every squad.',
  openGraph: {
    title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
    description: 'Weekly updated rankings for all 32 NFL teams with movement notes and analysis.',
    url: `${SITE_URL}/articles/power-rankings`,
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/articles/power-rankings` },
};

export default function PowerRankingsPage() {
  redirect('/articles/power-rankings');
}
