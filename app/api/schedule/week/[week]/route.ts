import { NextResponse } from 'next/server';
import { getScheduleWeekOrCurrent } from '@/lib/schedule';

export const revalidate = 300;

interface Params { week: string }

export async function GET(
  _req: Request,
  ctx: { params: Promise<Params>; searchParams: URLSearchParams }
) {
  try {
    const params = await ctx.params;
    const url = new URL(_req.url);
    const team = url.searchParams.get('team')?.toUpperCase();
    const weekNum = Number(params.week);
    const { week, games } = await getScheduleWeekOrCurrent(weekNum);
    const filtered = team ? games.filter(g => g.home === team || g.away === team) : games;
    return NextResponse.json({ week, count: filtered.length, games: filtered });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
