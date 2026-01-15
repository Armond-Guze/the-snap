import { redirect } from 'next/navigation';

type Params = Promise<{ week: string }>; // format: "1-2025"

export default async function RankingsWeekPage({ params }: { params: Params }) {
  const { week } = await params;
  const [w, season] = week.split('-');
  redirect(`/power-rankings/${season}/week-${w}`);
}
