import { notFound } from 'next/navigation';
import { PortableText } from '@portabletext/react';
import Image from 'next/image';
import { client } from '@/sanity/lib/client';
import RelatedArticles from '@/app/components/RelatedArticles';
import YouTubeEmbed from '@/app/components/YoutubeEmbed';
import TwitterEmbed from '@/app/components/TwitterEmbed';
import InstagramEmbed from '@/app/components/InstagramEmbed';
import TikTokEmbed from '@/app/components/TikTokEmbed';
import ReadingTime from '@/app/components/ReadingTime';
import SocialShare from '@/app/components/SocialShare';
import Breadcrumb from '@/app/components/Breadcrumb';
import ArticleViewTracker from '@/app/components/ArticleViewTracker';
import { calculateReadingTime, extractTextFromBlocks } from '@/lib/reading-time';
import { formatArticleDate } from '@/lib/date-utils';
import { portableTextComponents } from '@/lib/portabletext-components';
import type { HeadlineListItem, TypedObject } from '@/types';

interface FantasyDetail {
  _id: string;
  title: string;
  slug: { current: string };
  summary?: string;
  content?: unknown[]; // blockContent (fantasy schema uses 'content')
  body?: unknown[];    // if migrated to 'body'
  coverImage?: { asset?: { url?: string } };
  author?: { name?: string; image?: { asset?: { url?: string } } };
  publishedAt?: string;
  date?: string;
  category?: { title?: string; slug?: { current?: string } };
  youtubeVideoId?: string;
  videoTitle?: string;
  twitterUrl?: string;
  twitterTitle?: string;
  instagramUrl?: string;
  instagramTitle?: string;
  tiktokUrl?: string;
  tiktokTitle?: string;
}

interface PageProps { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  if (!params?.slug) return {};
  const slug = decodeURIComponent(params.slug).trim();
  const article = await client.fetch<FantasyDetail>(
    `*[_type == "fantasyFootball" && slug.current == $slug && published == true][0]{
      _id, title, summary, coverImage{asset->{url}}, youtubeVideoId, videoTitle, twitterUrl, twitterTitle, instagramUrl, instagramTitle, tiktokUrl, tiktokTitle
    }`,
    { slug }
  );
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    openGraph: { title: article.title, description: article.summary, images: article.coverImage?.asset?.url ? [article.coverImage.asset.url] : [] }
  };
}

export default async function FantasyArticlePage(props: PageProps) {
  const params = await props.params;
  const slug = decodeURIComponent(params.slug).trim();

  const [article, otherContent] = await Promise.all([
  client.fetch<FantasyDetail>(`*[_type == "fantasyFootball" && slug.current == $slug && published == true][0]{
      _id, title, slug, summary,
      // Expand both body & content arrays (support legacy / new)
      content[]{
        ...,
        // ensure inline images resolve their asset url + alt
        _type == 'image' => { ..., asset->{ url }, alt },
        _type == "playerHeading" => {
          ...,
          headshot{asset->{url}, alt}, // ensure manual headshot image has URL
          player->{ name, team, position, headshot{asset->{url}, alt} }
        }
      },
      body[]{
        ...,
        _type == 'image' => { ..., asset->{ url }, alt },
        _type == "playerHeading" => {
          ...,
          headshot{asset->{url}, alt},
          player->{ name, team, position, headshot{asset->{url}, alt} }
        }
      },
      coverImage{asset->{url}},
      author->{name, image{asset->{url}}},
      publishedAt, date,
      category->{title, slug},
  youtubeVideoId, videoTitle, twitterUrl, twitterTitle, instagramUrl, instagramTitle, tiktokUrl, tiktokTitle
    }`, { slug }),
    client.fetch<HeadlineListItem[]>(`*[_type in ["headline", "rankings"] && published == true] | order(_createdAt desc)[0...24]{
      _id, _type, title, slug, date, summary, author->{name}, coverImage{asset->{url}}, rankingType
    }`)
  ]);

  if (!article) notFound();

  const blocks = article.body || article.content || [];
  const textContent = extractTextFromBlocks(blocks);
  const readingTime = calculateReadingTime(textContent);

  const breadcrumbItems = [
    { label: 'Fantasy', href: '/fantasy' },
    ...(article.category?.title ? [{ label: article.category.title, href: `/categories/${article.category.slug?.current}` }] : []),
    { label: article.title }
  ];

  return (
    <main className="bg-black text-white min-h-screen">
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Article */}
        <article className="lg:col-span-2 flex flex-col">
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbItems} className="mb-4" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4 text-left">{article.title}</h1>
          <div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left">
            {article.author?.image?.asset?.url && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image src={article.author.image.asset.url} alt={article.author.name || 'Author'} fill className="object-cover" />
              </div>
            )}
            <span>By {article.author?.name || 'Unknown'} • {formatArticleDate(article.date || article.publishedAt)}</span>
            <span className="text-gray-500">•</span>
            <ReadingTime minutes={readingTime} />
          </div>
          {article.coverImage?.asset?.url && (
            <div className="w-full mb-6">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
                <Image src={article.coverImage.asset.url} alt={article.title} fill className="object-cover w-full h-full" priority />
              </div>
            </div>
          )}
          <section className="w-full mb-8">
            <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
              {blocks && <PortableText value={blocks as unknown as TypedObject[]} components={portableTextComponents} />}
            </div>
          </section>
          <SocialShare url={`https://thegamesnap.com/fantasy/${slug}`} title={article.title} description={article.summary || ''} variant="compact" className="mb-8" />
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1 lg:sticky lg:top-16 lg:self-start lg:h-fit mt-8">
          {article.youtubeVideoId && (
            <div className="mb-4"><YouTubeEmbed videoId={article.youtubeVideoId} title={article.videoTitle || `Video: ${article.title}`} variant="article" /></div>
          )}
          {!article.youtubeVideoId && article.twitterUrl && (
            <div className="mb-4 w-full"><TwitterEmbed twitterUrl={article.twitterUrl} className="w-full" /></div>
          )}
          {!article.youtubeVideoId && !article.twitterUrl && article.instagramUrl && (
            <div className="mb-4 w-full"><InstagramEmbed url={article.instagramUrl} title={article.instagramTitle} className="w-full" /></div>
          )}
          {!article.youtubeVideoId && !article.twitterUrl && !article.instagramUrl && article.tiktokUrl && (
            <div className="mb-4 w-full"><TikTokEmbed url={article.tiktokUrl} title={article.tiktokTitle} className="w-full" /></div>
          )}
          <RelatedArticles currentSlug={slug} articles={otherContent} />
        </aside>
      </div>
      <ArticleViewTracker slug={slug} headlineId={article._id} title={article.title} category={article.category?.title} author={article.author?.name} readingTime={readingTime} className="hidden" />
    </main>
  );
}
