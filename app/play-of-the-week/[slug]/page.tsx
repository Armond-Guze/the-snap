import { PortableText } from '@portabletext/react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PlayOfWeekCard from '@/app/components/PlayOfWeekCard'
import { client } from '@/sanity/lib/client'
import { playOfWeekDetailQuery } from '@/sanity/lib/queries'
import { portableTextComponents } from '@/lib/portabletext-components'
import type { PlayOfWeek } from '@/types'

export const revalidate = 120

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const slug = decodeURIComponent(params?.slug || '')
  if (!slug) return {}

  const play = await client.fetch<Pick<PlayOfWeek, 'title' | 'summary' | 'coverImage'>>(
    playOfWeekDetailQuery,
    { slug }
  )

  if (!play) return {}

  return {
    title: `${play.title} | Play of the Week`,
    description: play.summary || undefined,
    openGraph: {
      title: play.title,
      description: play.summary || undefined,
      images: play.coverImage?.asset?.url ? [{ url: play.coverImage.asset.url }] : undefined,
    },
  }
}

export default async function PlayOfTheWeekDetail(props: PageProps) {
  const params = await props.params
  const slug = decodeURIComponent(params?.slug || '')
  if (!slug) return notFound()

  const play = await client.fetch<PlayOfWeek>(playOfWeekDetailQuery, { slug })
  if (!play) return notFound()

  return (
    <main className="bg-black text-white min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Play of the Week</p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{play.title}</h1>
          {play.summary && <p className="text-gray-300 max-w-3xl">{play.summary}</p>}
        </div>

        <PlayOfWeekCard play={play} variant="featured" disableLink />

        {play.body && play.body.length > 0 && (
          <section className="prose prose-invert max-w-3xl text-white">
            <PortableText value={play.body} components={portableTextComponents} />
          </section>
        )}
      </div>
    </main>
  )
}
