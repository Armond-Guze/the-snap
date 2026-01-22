import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
  description: 'Follow the latest NFL Power Rankings updated each week for all 32 teams. See who is rising or falling with fresh commentary on every squad.',
  openGraph: {
    title: 'NFL Power Rankings – Weekly Team Rankings & Analysis | The Snap',
    description: 'Weekly updated rankings for all 32 NFL teams with movement notes and analysis.',
    url: 'https://thegamesnap.com/articles/power-rankings',
    type: 'website',
  },
  alternates: { canonical: 'https://thegamesnap.com/articles/power-rankings' },
};

export default function PowerRankingsPage() {
  redirect('/articles/power-rankings');
}
