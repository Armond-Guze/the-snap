import Image from 'next/image'

type SnapGraphicCardValue = {
  title?: string
  subtitle?: string
  serial?: string
  callout?: string
  grade?: 'A' | 'B' | 'C' | 'D' | 'F' | string
  aura?: {
    tier?: 'fog' | 'ember' | 'plasma' | 'supernova' | string
    value?: number
    labelOverride?: string
  }
  trajectory?: {
    type?: string
    variant?: string
  }
  pressure?: 'clean' | 'muddy' | 'chaos' | string
  dawgIndex?: {
    value?: number
    lowLabel?: string
    highLabel?: string
  }
  subject?: {
    primaryPlayer?: { name?: string; team?: string; position?: string }
    playerName?: string
    team?: string
    position?: string
  }
  media?: {
    image?: { asset?: { url?: string }; alt?: string }
    videoUrl?: string
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function titleCase(input: string) {
  return input
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function auraBackgroundClass(tier?: string) {
  switch (tier) {
    case 'ember':
      return 'bg-championship-gold'
    case 'plasma':
      return 'bg-sports-blue'
    case 'supernova':
      return 'bg-stadium-night'
    case 'fog':
    default:
      return 'bg-near-black'
  }
}

function pressureLabel(value?: string) {
  switch (value) {
    case 'muddy':
      return 'MUDDY'
    case 'chaos':
      return 'CHAOS'
    case 'clean':
    default:
      return 'CLEAN'
  }
}

function trajectoryIcon(type?: string) {
  switch (type) {
    case 'moonball':
      return '◜◝'
    case 'rope':
      return '—'
    case 'layer':
      return '≈'
    case 'back-shoulder':
      return '↩'
    case 'slot-fade':
      return '⟋'
    default:
      return '◎'
  }
}

export default function SnapGraphicCard({ value }: { value: SnapGraphicCardValue }) {
  if (!value) return null

  const auraValue = clamp(typeof value.aura?.value === 'number' ? value.aura.value : 70, 0, 100)
  const auraTier = value.aura?.tier || 'fog'
  const auraLabel = (value.aura?.labelOverride || titleCase(String(auraTier))).toUpperCase()

  const subjectName =
    value.subject?.primaryPlayer?.name ||
    value.subject?.playerName ||
    undefined

  const subjectMetaParts = [
    (value.subject?.primaryPlayer?.team || value.subject?.team || '').toUpperCase() || null,
    (value.subject?.primaryPlayer?.position || value.subject?.position || '').toUpperCase() || null,
  ].filter(Boolean)

  const pressure = pressureLabel(value.pressure)

  const dawgValueRaw = typeof value.dawgIndex?.value === 'number' ? value.dawgIndex.value : undefined
  const dawgValue = typeof dawgValueRaw === 'number' ? clamp(Math.round(dawgValueRaw), 0, 10) : undefined
  const dawgLowLabel = (value.dawgIndex?.lowLabel || 'House Cat').toUpperCase()
  const dawgHighLabel = (value.dawgIndex?.highLabel || 'Junkyard Dawg').toUpperCase()

  const trajectoryType = value.trajectory?.type ? titleCase(value.trajectory.type) : 'Trajectory'
  const trajectoryVariant = value.trajectory?.variant ? titleCase(value.trajectory.variant) : ''

  const imageUrl = value.media?.image?.asset?.url
  const imageAlt = value.media?.image?.alt || value.title || 'Graphic'

  const needleTop = 100 - auraValue

  return (
    <div className="my-8">
      <div
        className={
          `relative overflow-hidden border border-white/10 ${auraBackgroundClass(auraTier)} backdrop-blur-sm ` +
          'p-5 sm:p-6'
        }
        style={{
          clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
        }}
      >
        {/* Broadcast texture overlays (no new colors: just opacity + white) */}
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute inset-0 bg-white/5" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
        </div>

        {/* Calibration mark (brand repeatable detail) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-70">
          <span className="block h-[2px] w-6 bg-white/60" />
          <span className="block h-[2px] w-4 bg-white/40" />
          <span className="block h-[2px] w-2 bg-white/30" />
        </div>

        <div className="relative flex flex-col gap-4">
          {/* Top row: title + stamps */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {value.title && (
                <div className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-snug">
                  {value.title}
                </div>
              )}
              {value.subtitle && (
                <div className="mt-1 text-xs sm:text-sm text-white/70 font-medium">
                  {value.subtitle}
                </div>
              )}
              {subjectName && (
                <div className="mt-2 text-xs uppercase tracking-wider text-white/60">
                  {subjectName}
                  {subjectMetaParts.length ? ` • ${subjectMetaParts.join(' • ')}` : ''}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {/* Pressure stamp */}
              <div className="rotate-[-6deg] rounded border border-white/25 bg-black/40 px-2 py-1 text-[10px] font-extrabold tracking-[0.22em] text-white/90">
                {pressure}
              </div>

              {/* Dawg Index */}
              {typeof dawgValue === 'number' && (
                <div className="w-[220px] max-w-[70vw]">
                  <div className="flex items-center justify-between text-[9px] font-extrabold tracking-[0.18em] text-white/60">
                    <span>DAWG</span>
                    <span>{dawgValue}/10</span>
                  </div>
                  <div className="mt-1 grid grid-cols-10 gap-[3px]">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const lit = i < dawgValue
                      return (
                        <span
                          key={i}
                          className={
                            'block h-[8px] rounded-sm border ' +
                            (lit
                              ? 'bg-white/70 border-white/35'
                              : 'bg-black/30 border-white/15')
                          }
                        />
                      )
                    })}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] font-bold tracking-[0.12em] text-white/45">
                    <span>{dawgLowLabel}</span>
                    <span>{dawgHighLabel}</span>
                  </div>
                </div>
              )}

              {/* Serial */}
              {value.serial && (
                <div className="text-[10px] tracking-widest text-white/50 font-semibold">
                  {value.serial}
                </div>
              )}
            </div>
          </div>

          {/* Middle: meter + content */}
          <div className="grid grid-cols-1 sm:grid-cols-[92px_1fr] gap-4 sm:gap-6 items-stretch">
            {/* Aura Meter */}
            <div className="relative flex sm:flex-col items-center sm:items-stretch gap-3">
              <div className="flex flex-col items-start">
                <div className="text-[10px] font-extrabold tracking-[0.22em] text-white/70">
                  AURA
                </div>
                <div className="mt-1 text-xs font-bold text-white">
                  {auraLabel}
                </div>
              </div>

              <div className="relative h-16 sm:h-44 w-full sm:w-12 rounded-md border border-white/15 bg-black/35 overflow-hidden">
                {/* Fill */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-white/20"
                  style={{ height: `${auraValue}%` }}
                />
                {/* Scanline texture */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(180deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 1px, transparent 1px, transparent 6px)',
                  }}
                />
                {/* Needle */}
                <div
                  className="absolute left-0 right-0 h-[2px] bg-white"
                  style={{ top: `${needleTop}%` }}
                />
                {/* Ticks */}
                <div className="absolute inset-0 flex flex-col justify-between py-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-end">
                      <span className="block h-[1px] w-3 bg-white/25" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="ml-auto sm:ml-0 text-3xl sm:text-4xl font-black text-white leading-none">
                {value.grade || '—'}
              </div>
            </div>

            {/* Right side: sticker + media + callout */}
            <div className="flex flex-col gap-4">
              {/* Trajectory sticker */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-bold text-white">
                  <span className="text-white/80" aria-hidden>
                    {trajectoryIcon(value.trajectory?.type)}
                  </span>
                  <span className="tracking-wide">
                    {trajectoryType.toUpperCase()}
                    {trajectoryVariant ? ` + ${trajectoryVariant.toUpperCase()}` : ''}
                  </span>
                  {/* Tail notch */}
                  <span className="absolute -right-2 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-white/20 bg-black/35" />
                </div>

                {value.media?.videoUrl && (
                  <a
                    href={value.media.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white/70 underline hover:text-white transition-colors"
                  >
                    Watch
                  </a>
                )}
              </div>

              {imageUrl && (
                <div className="relative w-full h-44 sm:h-52 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                  <Image
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
              )}

              {value.callout && (
                <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3">
                  <div className="text-[10px] font-extrabold tracking-[0.22em] text-white/60">
                    WHY IT HIT
                  </div>
                  <div className="mt-1 text-sm sm:text-base font-semibold text-white/90 leading-snug">
                    {value.callout}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
