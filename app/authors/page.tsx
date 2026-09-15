import { SimplePageShell } from '../components/SimpleInfoPage';
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
    <SimplePageShell eyebrow="Editorial team" title="Authors at The Snap" intro="These profiles identify who is responsible for our NFL reporting, analysis, rankings, and updates.">
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {authors.map((author) => (
            <Link
              key={author._id}
              href={`/authors/${author.slug}`}
              className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 transition hover:border-neutral-400 hover:bg-neutral-100"
            >
              {author.imageUrl ? (
                <Image src={author.imageUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-neutral-200 text-xl font-black text-neutral-900">
                  {author.name.slice(0, 1)}
                </span>
              )}
              <span>
                <span className="block text-lg font-bold">{author.name}</span>
                <span className="mt-1 block text-sm text-neutral-600">View profile and recent coverage</span>
              </span>
            </Link>
          ))}
        </div>
    </SimplePageShell>
  );
}
