import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AVATAR_SIZES, ARTICLE_COVER_SIZES } from '@/lib/image-sizes';
import { client } from '@/sanity/lib/client';
import type { Headline, HeadlineListItem, HeadlinePageProps } from '@/types';
import RelatedArticles from '@/app/components/RelatedArticles';
import SocialShare from '@/app/components/SocialShare';
import ReadingTime from '@/app/components/ReadingTime';
import Breadcrumb from '@/app/components/Breadcrumb';
import ArticleViewTracker from '@/app/components/ArticleViewTracker';
import { generateSEOMetadata } from '@/lib/seo';
import { articleDetailQuery } from '@/sanity/lib/queries';
import { calculateReadingTime, extractTextFromBlocks } from '@/lib/reading-time';
import { formatArticleDate } from '@/lib/date-utils';
import { portableTextComponents } from '@/lib/portabletext-components';
import { Metadata } from 'next';
import StructuredData, { createEnhancedArticleStructuredData } from '@/app/components/StructuredData';
import MostRead from '@/app/components/MostRead';

export const dynamic = "force-dynamic";

export async function generateMetadata(props: HeadlinePageProps): Promise<Metadata> {
	const params = await props.params;
	if (!params?.slug) return {};

	const trimmedSlug = decodeURIComponent(params.slug).trim();

	// Prefer full article query, fall back to headline-only for legacy docs
	const article = await client.fetch<Headline>(articleDetailQuery, { slug: trimmedSlug })
		.catch(() => null);

	if (!article) return {};

	const metadata = generateSEOMetadata(article, '/articles');
	const canonicalBase = 'https://thegamesnap.com/articles';
	const cleanSlug = article.slug?.current?.replace(/^\/+|\/+$/g, '') || params.slug;
	return {
		...metadata,
		alternates: {
			...metadata.alternates,
			canonical: `${canonicalBase}/${cleanSlug}`,
		},
	};
}

export default async function ArticlePage(props: HeadlinePageProps) {
	const params = await props.params;
	if (!params?.slug) return notFound();

	const trimmedSlug = decodeURIComponent(params.slug).trim();

	// Fetch article (any format) and a small feed for sidebar/related
	const [article, otherArticles] = await Promise.all([
		client.fetch<Headline>(articleDetailQuery, { slug: trimmedSlug }),
		client.fetch<HeadlineListItem[]>(
			`*[_type == "article" && published == true] | order(coalesce(date, publishedAt, _createdAt) desc)[0...24]{
				_id,
				_type,
				title,
				homepageTitle,
				slug,
				date,
				publishedAt,
				summary,
				author-> { name },
				coverImage { asset->{ url } },
				featuredImage { asset->{ url } },
				image { asset->{ url } },
				category->{ title, slug, color },
				format,
				tags[]->{ title }
			}`
		),
	]);

	if (!article) notFound();

	const tagList = Array.isArray(article.tags)
		? article.tags
				.map((tag) => {
					const title = typeof tag?.title === 'string' ? tag.title.trim() : '';
					if (!title) return null;
					const slug = tag?.slug?.current;
					return typeof slug === 'string' && slug.length > 0 ? { title, slug } : { title };
				})
				.filter((tag): tag is { title: string; slug?: string } => tag !== null)
		: [];

	const categorySlug = article.category?.slug?.current;
	const categoryMatches = categorySlug
		? otherArticles
				.filter(
					(a) =>
						a.slug.current !== trimmedSlug &&
						a.category?.slug?.current === categorySlug
				)
				.slice(0, 3)
		: [];

	const trendingArticles = otherArticles
		.filter((a) => a.slug.current !== trimmedSlug)
		.slice(0, 5);

	const textContent = extractTextFromBlocks(article.body || []);
	const readingTime = calculateReadingTime(textContent);

	const breadcrumbItems = [
		{ label: 'Articles', href: '/articles' },
		...(article.category?.title
			? [{ label: article.category.title, href: `/categories/${article.category.slug?.current}` }]
			: []),
		{ label: article.title }
	];

	const shareUrl = `https://thegamesnap.com/articles/${trimmedSlug}`;

	let articleSD;
	try {
		const keywordList = Array.isArray(article.tags)
			? article.tags
					.map((t) => (t && typeof t.title === 'string' ? t.title.trim() : null))
					.filter((t): t is string => !!t && t.length > 0)
			: undefined;
		articleSD = createEnhancedArticleStructuredData({
			headline: article.title,
			description: article.summary || '',
			canonicalUrl: shareUrl,
			images: [
				...(article.coverImage?.asset?.url ? [{ url: article.coverImage.asset.url }] : []),
			],
			datePublished: article.date || article.publishedAt || '',
			dateModified:
				(article as unknown as { _updatedAt?: string })._updatedAt ||
				article.date ||
				article.publishedAt ||
				'',
			author: { name: article.author?.name || 'Staff Writer' },
			articleSection: article.category?.title,
			keywords: keywordList && keywordList.length ? keywordList : undefined,
			speakableSelectors: ['h1', 'meta[name="description"]'],
		});
	} catch (e) {
		console.error('Structured data generation failed', e);
	}

	const publishedDate = article.date || article.publishedAt;

	return (
		<>
			<main className="bg-black text-white min-h-screen">
			{articleSD && <StructuredData id={`sd-article-${trimmedSlug}`} data={articleSD} />}
			<div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
				<article className="lg:col-span-2 flex flex-col">
					<div className="hidden sm:block">
						<Breadcrumb items={breadcrumbItems} className="mb-4" />
					</div>
					<h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4 text-left">{article.title}</h1>
					<div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left flex-wrap">
						{article.author?.image?.asset?.url && (
							<div className="relative w-8 h-8 rounded-full overflow-hidden">
								<Image src={article.author.image.asset.url} alt={article.author.name || 'Author'} fill sizes={AVATAR_SIZES} className="object-cover" />
							</div>
						)}
						{article.author?.name && <span className="font-medium text-white/90">By {article.author.name}</span>}
						{publishedDate && (
							<>
								<span>• {formatArticleDate(publishedDate)}</span>
								<span className="text-gray-500">•</span>
							</>
						)}
						<ReadingTime minutes={readingTime} />
						{article.category?.slug?.current && article.category?.title && (
							<Link
								href={`/categories/${article.category.slug.current}`}
								className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:border-white/40 hover:bg-white/10 transition-colors"
							>
								{article.category.title}
							</Link>
						)}
						{(article as unknown as { _updatedAt?: string })._updatedAt && (article as unknown as { _updatedAt?: string })._updatedAt !== article.date && (
							<span className="text-xs text-gray-500">Updated {formatArticleDate((article as unknown as { _updatedAt?: string })._updatedAt! )}</span>
						)}
					</div>
					{article.coverImage?.asset?.url && (
						<div className="w-full mb-6">
							<div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
								<Image src={article.coverImage.asset.url} alt={article.title} fill sizes={ARTICLE_COVER_SIZES} className="object-cover w-full h-full" priority />
							</div>
							{article.summary && (
								<p className="mt-4 text-lg text-gray-300 leading-relaxed max-w-3xl">{article.summary}</p>
							)}
							{tagList.length > 0 && (
								<div className="mt-4 flex flex-wrap gap-2">
									{tagList.map((tag) => (
										<Link
											key={tag.slug || tag.title}
											href={`/articles?tag=${encodeURIComponent(tag.title)}`}
											className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 hover:border-white/30 hover:bg-white/15"
										>
											#{tag.title}
										</Link>
									))}
								</div>
							)}
						</div>
					)}
					<section className="w-full mb-8">
						<div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
							{Array.isArray(article.body) && <PortableText value={article.body} components={portableTextComponents} />}
						</div>
					</section>
					{categoryMatches.length > 1 && (
						<section className="mt-10">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-2xl font-semibold text-white">
									More from {article.category?.title}
								</h2>
								<Link
									href={`/categories/${article.category?.slug?.current}`}
									className="text-sm font-semibold text-emerald-300 hover:text-emerald-200"
								>
									View category →
								</Link>
							</div>
							<div className="grid gap-5 md:grid-cols-3">
								{categoryMatches.map((item) => {
									const img =
										item.coverImage?.asset?.url ||
										item.featuredImage?.asset?.url ||
										item.image?.asset?.url ||
										null;
									return (
										<Link
											key={item._id}
											href={`/articles/${item.slug.current}`}
											className="group rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm hover:border-white/30 hover:bg-white/10 transition-colors"
										>
											{img && (
												<div className="relative mb-4 h-36 overflow-hidden rounded-xl">
													<Image
														src={img}
														alt={item.title}
														fill
														sizes="(max-width: 768px) 100vw, 33vw"
														className="object-cover transition-transform duration-500 group-hover:scale-105"
													/>
												</div>
											)}
											<p className="text-xs uppercase tracking-wide text-white/50 mb-2">
												{formatArticleDate(item.date || item.publishedAt)}
											</p>
											<h3 className="text-lg font-semibold text-white leading-snug line-clamp-2">
												{item.homepageTitle || item.title}
											</h3>
										</Link>
									);
								})}
							</div>
						</section>
					)}
					{trendingArticles.length > 0 && (
						<section className="mt-12">
							<div className="flex items-center gap-3 mb-4">
								<div className="h-10 w-10 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center text-white">
									🔥
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.3em] text-white/40">Trending now</p>
									<h2 className="text-2xl font-semibold text-white">What readers are clicking</h2>
								</div>
							</div>
							<ol className="space-y-3">
								{trendingArticles.map((item, index) => (
									<li key={item._id} className="flex items-start gap-4">
										<span className="text-3xl font-black text-white/10 leading-none">
											{(index + 1).toString().padStart(2, '0')}
										</span>
										<div className="flex-1 border-b border-white/5 pb-3">
											<Link
												href={item._type === 'article' || item._type === 'rankings' ? `/articles/${item.slug.current}` : `/headlines/${item.slug.current}`}
												className="text-base font-semibold text-white hover:text-emerald-300 transition-colors"
											>
												{item.homepageTitle || item.title}
											</Link>
											<div className="mt-1 text-xs uppercase tracking-wide text-white/40">
												{item.category?.title || (item._type === 'rankings' ? `${item.rankingType?.replace('-', ' ')} rankings` : 'Article')}
											</div>
										</div>
									</li>
								))}
							</ol>
						</section>
					)}
					<div className="mt-10 flex flex-col gap-4">
						<ArticleViewTracker slug={trimmedSlug} />
					</div>
				</article>

				<aside className="space-y-8">
					<MostRead />
					<RelatedArticles currentSlug={trimmedSlug} articles={otherArticles as unknown as HeadlineListItem[]} />
				</aside>
			</div>
		</main>
		<div className="px-6 md:px-12 pb-12 max-w-7xl mx-auto">
			<SocialShare url={shareUrl} title={article.title} description={article.summary || ''} variant="compact" />
		</div>
		<ArticleViewTracker slug={trimmedSlug} headlineId={article._id} title={article.title} category={article.category?.title} author={article.author?.name} readingTime={readingTime} className="hidden" />
		</>
	);
}
