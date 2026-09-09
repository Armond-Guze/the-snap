import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { sanityFetchDynamic } from '@/sanity/lib/fetch';
import { SITE_URL } from '@/lib/site-config';
import { createWebsitePageMetadata } from '@/lib/seo';

type AuthorListItem = {
  _id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
};

export const metadata: Metadata = createWebsitePageMetadata({
  title: 'Authors and Editorial Team | The Snap',
  description: 'Meet the writers and editorial team responsible for The Snap NFL coverage.',
  canonicalUrl: `${SITE_URL}/authors`,
});

export default async function AuthorsPage() {
  const authors = await sanityFetchDynamic<AuthorListItem[]>(
    `*[_type == "author" && defined(slug.current)] | order(name asc){
      _id,
      name,
      "slug": slug.current,
      "imageUrl": image.asset->url
    }`,
    {},
    3600,
    []
  );

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Editorial team</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Authors at The Snap</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-white/70">
          These profiles identify who is responsible for our NFL reporting, analysis, rankings, and updates.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {authors.map((author) => (
            <Link
              key={author._id}
              href={`/authors/${author.slug}`}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-emerald-300/40 hover:bg-white/[0.07]"
            >
              {author.imageUrl ? (
                <Image src={author.imageUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-emerald-300/10 text-xl font-black text-emerald-200">
                  {author.name.slice(0, 1)}
                </span>
              )}
              <span>
                <span className="block text-lg font-bold">{author.name}</span>
                <span className="mt-1 block text-sm text-white/60">View profile and recent coverage</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
