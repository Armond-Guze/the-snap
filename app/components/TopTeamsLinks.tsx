import Link from 'next/link';
import { TEAM_META } from '@/lib/schedule';

// Simple curated order (adjust or compute via rankings later)
const FEATURED: string[] = ['KC','SF','PHI','BUF','DAL','BAL','DET','MIA'];

export default function TopTeamsLinks() {
  const teams = FEATURED.filter(t => TEAM_META[t]).slice(0,8);
  const slugifyTeamName = (name: string) => name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Top Teams</h4>
      <ul className="grid grid-cols-2 gap-2 text-sm">
        {teams.map(t => (
          <li key={t}>
            <Link href={`/teams/${slugifyTeamName(TEAM_META[t].name)}`} className="text-gray-400 hover:text-white transition-colors">{TEAM_META[t].name.split(' ').slice(-1)[0]}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
