import type { Metadata } from 'next'
import PlayOfWeekCard from '@/app/components/PlayOfWeekCard'
import { sanityFetch } from '@/sanity/lib/fetch'
import { playOfWeekListQuery } from '@/sanity/lib/queries'
import type { PlayOfWeek } from '@/types'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Play of the Week | The Snap',
  description: 'One-play spotlight cards with difficulty, momentum, and skill badges.',
}

export default async function PlayOfTheWeekPage() {
  const plays = await sanityFetch<PlayOfWeek[]>(
    playOfWeekListQuery,
    {},
    { next: { revalidate: 120 } },
    []
  )

  if (!plays?.length) {
    return (
      <main className="bg-black text-white min-h-screen">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-extrabold">Play of the Week</h1>
          <p className="mt-4 text-gray-300">No plays published yet. Add a Play of the Week in Sanity to see it here.</p>
        </div>
      </main>
    )
  }

  const [featured, ...rest] = plays

  return (
    <main className="bg-black text-white min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8 lg:space-y-10">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Play of the Week</p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">The play that swung the week</h1>
          <p className="text-gray-300 max-w-3xl">Single-play story cards with difficulty dial, momentum arrow, and skill badges. Perfect for sharing big TDs, picks, sacks, and blocks.</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <PlayOfWeekCard play={featured} variant="featured" />
        </div>

        {rest.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            {rest.map((play) => (
              <PlayOfWeekCard key={play._id} play={play} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
