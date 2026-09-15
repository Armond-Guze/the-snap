import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { portableTextComponents } from '@/lib/portabletext-components';
import { DEFAULT_OG_IMAGE_URL, SITE_BRAND, SITE_URL } from '@/lib/site-config';
import { sanityFetchDynamic } from '@/sanity/lib/fetch';
import type { PortableTextContent } from '@/types';

type AuthorProfile = {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  imageAlt?: string;
  bio?: PortableTextContent;
};

type AuthorArticle = {
  _id: string;
  title: string;
  homepageTitle?: string;
  slug: string;
  date?: string;
  summary?: string;
};

type AuthorPageProps = { params: Promise<{ slug: string }> };

const authorQuery = `*[_type == "author" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  "imageUrl": image.asset->url,
  "imageAlt": image.alt,
  bio
}`;

async function getAuthor(slug: string) {
  return sanityFetchDynamic<AuthorProfile | null>(authorQuery, { slug }, 3600, null);
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return {};
  const description = `${author.name} author profile, editorial information, and recent NFL coverage from The Snap.`;
  const canonical = `${SITE_URL}/authors/${author.slug}`;
  const socialImage = author.imageUrl || DEFAULT_OG_IMAGE_URL;
  return {
    title: `${author.name} | The Snap Authors`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${author.name} | The Snap`,
      description,
      url: canonical,
      siteName: SITE_BRAND,
      type: 'profile',
      images: [{ url: socialImage, alt: author.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${author.name} | The Snap`,
      description,
      images: [socialImage],
    },
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const [author, articles] = await Promise.all([
    getAuthor(slug),
    sanityFetchDynamic<AuthorArticle[]>(
      `*[_type == "article" && published == true && author->slug.current == $slug]
        | order(coalesce(date, publishedAt, _createdAt) desc)[0...24]{
          _id,
          title,
          homepageTitle,
          "slug": slug.current,
          "date": coalesce(date, publishedAt, _createdAt),
          summary
        }`,
      { slug },
      300,
      []
    ),
  ]);

  if (!author) notFound();

  return (
    <main className="snap-info-page min-h-screen px-6 py-14">
      <div className="mx-auto max-w-4xl">
        <Link href="/authors" className="text-sm font-semibold text-neutral-700 hover:text-neutral-900">← All authors</Link>
        <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
          {author.imageUrl ? (
            <Image src={author.imageUrl} alt={author.imageAlt || author.name} width={128} height={128} className="h-32 w-32 rounded-full object-cover" priority />
          ) : (
            <span aria-hidden="true" className="grid h-32 w-32 place-items-center rounded-full bg-neutral-100 text-4xl font-black text-neutral-900">
              {author.name.slice(0, 1)}
            </span>
          )}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-700">Author</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{author.name}</h1>
          </div>
        </header>

        <section className="prose prose-neutral mt-10 max-w-none rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          {Array.isArray(author.bio) && author.bio.length > 0 ? (
            <PortableText value={author.bio} components={portableTextComponents} />
          ) : (
            <p>{author.name} is responsible for NFL news, analysis, rankings, and editorial updates published under this byline.</p>
          )}
          <p>
            Read our <Link href="/editorial-standards">editorial standards</Link> and <Link href="/corrections-policy">corrections policy</Link> for details about sourcing, review, and updates.
          </p>
        </section>

        <section className="mt-12" aria-labelledby="recent-coverage">
          <h2 id="recent-coverage" className="text-2xl font-bold">Recent coverage</h2>
          <div className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200">
            {articles.map((article) => (
              <article key={article._id} className="py-5">
                <Link href={`/articles/${article.slug}`} className="text-xl font-bold hover:text-neutral-700">
                  {article.homepageTitle || article.title}
                </Link>
                {article.summary && <p className="mt-2 line-clamp-2 text-neutral-600">{article.summary}</p>}
                {article.date && <time dateTime={article.date} className="mt-2 block text-xs uppercase tracking-wide text-neutral-600">{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</time>}
              </article>
            ))}
            {articles.length === 0 && <p className="py-5 text-neutral-600">No recent articles are currently assigned to this profile.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
