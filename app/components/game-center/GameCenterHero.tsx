import Image from 'next/image';
import { GameCenterHeroData } from '@/lib/game-center';

interface Props {
  data: GameCenterHeroData;
}

const toneStyles: Record<GameCenterHeroData['statusTone'], string> = {
  scheduled: 'bg-sky-500/10 text-sky-200 border border-sky-500/40',
  live: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40',
  final: 'bg-purple-500/15 text-purple-200 border border-purple-500/40',
};

export function GameCenterHero({ data }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/50">
      {data.backgroundImageUrl ? (
        <Image
          src={data.backgroundImageUrl}
          alt="Game backdrop"
          fill
          priority
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      ) : null}
      <div className="relative">
        <div className="flex flex-wrap items-center gap-4">
        <span className={`rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wide ${toneStyles[data.statusTone]}`}>
          {data.statusLabel}
        </span>
        <p className="text-sm text-slate-400">{data.subtitle}</p>
      </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <TeamCard team={data.scoreboard.away} align="right" />
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">GameCenter</p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{data.title}</h1>
            <p className="mt-2 text-sm text-slate-300">{data.kickoffLabel}</p>
            {data.detailLabel ? <p className="text-sm text-slate-400">{data.detailLabel}</p> : null}
          </div>
          <TeamCard team={data.scoreboard.home} align="left" />
        </div>
        {data.sponsorPanel ? <SponsorPanel panel={data.sponsorPanel} /> : null}
      </div>
    </section>
  );
}

function TeamCard({ team, align }: { team: GameCenterHeroData['scoreboard']['home']; align: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : ''}`}>
      <div className="flex items-center gap-3">
        {team.logo ? (
          <div className="relative h-12 w-12">
            <Image src={team.logo} alt={team.name} fill sizes="48px" />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 text-sm text-slate-300">
            {team.abbr}
          </div>
        )}
        <div className={align === 'right' ? 'text-right' : ''}>
          <p className="text-sm uppercase tracking-wide text-slate-400">{team.abbr}</p>
          <p className="text-xl font-semibold text-white">{team.name}</p>
          {team.recordHint ? <p className="text-xs text-slate-500">{team.recordHint}</p> : null}
        </div>
      </div>
      {typeof team.score === 'number' ? (
        <p className="mt-3 text-4xl font-bold text-white">{team.score}</p>
      ) : null}
    </div>
  );
}

function SponsorPanel({ panel }: { panel: NonNullable<GameCenterHeroData['sponsorPanel']> }) {
  const logoUrl = panel.logoUrl;
  return (
    <div
      className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-white backdrop-blur"
    >
      {logoUrl ? (
        <div className="relative h-12 w-12">
          <Image src={logoUrl} alt={panel.label || 'Sponsor'} fill sizes="48px" className="object-contain" />
        </div>
      ) : null}
      <div className="flex flex-col">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-300">{panel.label || 'Presented by'}</p>
        {panel.ctaText && panel.ctaUrl ? (
          <a
            href={panel.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-white underline-offset-2 hover:underline"
          >
            {panel.ctaText}
          </a>
        ) : null}
      </div>
    </div>
  );
}
