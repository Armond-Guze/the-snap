import { PortableText } from '@portabletext/react';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AVATAR_SIZES, ARTICLE_COVER_SIZES } from '@/lib/image-sizes';
import { sanityFetchDynamic } from '@/sanity/lib/fetch';
import type { Headline, HeadlineListItem, HeadlinePageProps } from '@/types';
import RelatedArticles from '@/app/components/RelatedArticles';
import SocialShare from '@/app/components/SocialShare';
import ReadingTime from '@/app/components/ReadingTime';
import Breadcrumb from '@/app/components/Breadcrumb';
import ArticleViewTracker from '@/app/components/ArticleViewTracker';
import ArticleViewCount from '@/app/components/ArticleViewCount';
import { generateSEOMetadata, resolveCanonicalUrl } from '@/lib/seo';
import { articleDetailQuery } from '@/sanity/lib/queries';
import { calculateReadingTime, extractTextFromBlocks } from '@/lib/reading-time';
import { formatArticleDate } from '@/lib/date-utils';
import { portableTextComponents } from '@/lib/portabletext-components';
import { Metadata } from 'next';
import StructuredData, { createEnhancedArticleStructuredData } from '@/app/components/StructuredData';
import YouTubeEmbed from '@/app/components/YoutubeEmbed';
import TwitterEmbed from '@/app/components/TwitterEmbed';
import InstagramEmbed from '@/app/components/InstagramEmbed';
import TikTokEmbed from '@/app/components/TikTokEmbed';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 300;

export async function generateMetadata(props: HeadlinePageProps): Promise<Metadata> {
	const params = await props.params;
	if (!params?.slug) return {};

	const trimmedSlug = decodeURIComponent(params.slug).trim();

	// Prefer full article query, fall back to headline-only for legacy docs
	const article = await sanityFetchDynamic<Headline>(articleDetailQuery, { slug: trimmedSlug }, 300, null as unknown as Headline)
		.catch(() => null);

	if (!article) return {};

	if (article._type === 'article' && article.format === 'powerRankings') {
		const season = (article as unknown as { seasonYear?: number }).seasonYear;
		const weekNumber = (article as unknown as { weekNumber?: number }).weekNumber;
		const playoffRound = (article as unknown as { playoffRound?: string }).playoffRound;
		const weekPart = playoffRound
			? playoffRound.toLowerCase()
			: typeof weekNumber === 'number'
				? `week-${weekNumber}`
				: null;
		const canonical = weekPart && season
			? `${SITE_URL}/articles/power-rankings/${season}/${weekPart}`
			: `${SITE_URL}/articles/power-rankings`;
		const metadata = generateSEOMetadata(article, '/articles');
		return {
			...metadata,
			alternates: {
				canonical,
			},
			openGraph: {
				...metadata.openGraph,
				url: canonical,
			},
		};
	}

	return generateSEOMetadata(article, '/articles');
}

export default async function ArticlePage(props: HeadlinePageProps) {
	const params = await props.params;
	if (!params?.slug) return notFound();

	const trimmedSlug = decodeURIComponent(params.slug).trim();

	// Fetch article (any format) and a small feed for sidebar/related
	const [article, otherArticles] = await Promise.all([
		sanityFetchDynamic<Headline>(articleDetailQuery, { slug: trimmedSlug }, 300, null as unknown as Headline),
		sanityFetchDynamic<HeadlineListItem[]>(
			`*[_type == "article" && published == true] | order(coalesce(date, publishedAt, _createdAt) desc)[0...24]{
				_id,
				_type,
				title,
				homepageTitle,
				slug,
				date,
				publishedAt,
				format,
				rankingType,
				seasonYear,
				weekNumber,
				playoffRound,
				summary,
				author-> { name },
				coverImage { asset->{ url } },
				featuredImage { asset->{ url } },
				image { asset->{ url } },
				category->{ title, slug, color },
				format,
				"tags": tagRefs[]->{ _id, title, slug }
			}`,
			{},
			300,
			[]
		),
	]);

	if (!article) {
		const aliasDoc = await sanityFetchDynamic<{ slug?: { current?: string } } | null>(
			`*[_type == "article" && published == true && $slug in slugHistory][0]{ slug }`,
			{ slug: trimmedSlug },
			300,
			null
		);
		const targetSlug = aliasDoc?.slug?.current?.trim();
		if (targetSlug) {
			permanentRedirect(`/articles/${targetSlug}`);
		}
		notFound();
	}

	if (article._type === 'article' && article.format === 'powerRankings') {
		const season = (article as unknown as { seasonYear?: number }).seasonYear;
		const weekNumber = (article as unknown as { weekNumber?: number }).weekNumber;
		const playoffRound = (article as unknown as { playoffRound?: string }).playoffRound;
		const weekPart = playoffRound
			? playoffRound.toLowerCase()
			: typeof weekNumber === 'number'
				? `week-${weekNumber}`
				: null;
		if (weekPart && season) {
			permanentRedirect(`/articles/power-rankings/${season}/${weekPart}`);
		}
		permanentRedirect('/articles/power-rankings');
	}

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

	const topicHubLinks = Array.isArray(article.topicHubs)
		? article.topicHubs
				.map((hub) => {
					const title = typeof hub?.title === 'string' ? hub.title.trim() : '';
					const slug = hub?.slug?.current?.trim();
					if (!title || !slug) return null;
					return { title, slug };
				})
				.filter((hub): hub is { title: string; slug: string } => hub !== null)
		: [];
	const primaryTopicHub = topicHubLinks[0];

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
		...(primaryTopicHub ? [{ label: primaryTopicHub.title, href: `/${primaryTopicHub.slug}` }] : []),
		{ label: article.title }
	];

	const canonicalSlug = article.slug?.current?.trim() || trimmedSlug;
	const shareUrl = resolveCanonicalUrl(article, '/articles');
	const ogFallback = `${SITE_URL}/api/og?${new URLSearchParams({
		title: article.title,
		subtitle: article.summary || article.title,
		category: article.category?.title || '',
		author: article.author?.name || '',
		date: article.date || article.publishedAt || '',
	}).toString()}`;

	let articleSD;
	try {
		const keywordList = Array.isArray(article.tags)
			? article.tags
					.map((t) => (t && typeof t.title === 'string' ? t.title.trim() : null))
					.filter((t): t is string => !!t && t.length > 0)
			: undefined;
		articleSD = createEnhancedArticleStructuredData({
			headline: article.title,
			description: article.summary || article.title,
			canonicalUrl: shareUrl,
			images: [
				...(article.coverImage?.asset?.url ? [{ url: article.coverImage.asset.url }] : [{ url: ogFallback }]),
			],
			datePublished: article.date || article.publishedAt || '',
			dateModified: article.dateModified || article.date || article.publishedAt || '',
			author: {
				name: article.author?.name || 'Staff Writer',
				...(article.author?.slug?.current
					? { url: `${SITE_URL}/authors/${article.author.slug.current}` }
					: {}),
			},
			articleSection: article.category?.title || primaryTopicHub?.title,
			keywords: keywordList && keywordList.length ? keywordList : undefined,
			speakableSelectors: ['h1', 'meta[name="description"]'],
		});
	} catch (e) {
		console.error('Structured data generation failed', e);
	}

	const publishedDate = article.date || article.publishedAt;

	return (
		<>
			<main className="bg-white text-neutral-900 min-h-screen">
			{articleSD && <StructuredData id={`sd-article-${canonicalSlug}`} data={articleSD} />}
			<div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
				<article className="lg:col-span-2 flex flex-col">
					<div className="hidden sm:block">
						<Breadcrumb items={breadcrumbItems} className="mb-4" />
					</div>
					<section className="mb-6 -mx-6 rounded-none bg-neutral-100 px-6 py-4 sm:mx-0 sm:rounded-2xl sm:px-5 sm:py-5">
						<h1 className="text-2xl sm:text-3xl md:text-[2.2rem] font-extrabold leading-tight text-neutral-900 mb-2 md:mb-3 text-left">{article.title}</h1>
						<div className="text-[12px] sm:text-[13px] text-neutral-500 mb-4 flex items-center gap-2.5 text-left flex-wrap">
							{article.author?.image?.asset?.url && (
								<div className="relative w-8 h-8 rounded-full overflow-hidden">
									<Image
										src={article.author.image.asset.url}
										alt={(article.author.image as { alt?: string })?.alt || article.author.name || 'Author'}
										fill
										sizes={AVATAR_SIZES}
										className="object-cover"
									/>
								</div>
							)}
							{article.author?.name && (
								article.author.slug?.current ? (
									<Link href={`/authors/${article.author.slug.current}`} className="font-medium text-neutral-800 hover:text-emerald-800">
										{article.author.name}
									</Link>
								) : (
									<span className="font-medium text-neutral-800">{article.author.name}</span>
								)
							)}
							{publishedDate && (
								<>
									<span aria-hidden="true">•</span>
									<time dateTime={publishedDate}>{formatArticleDate(publishedDate)}</time>
									<span className="text-gray-500 hidden sm:inline">•</span>
								</>
							)}
							<ReadingTime minutes={readingTime} className="hidden sm:flex" />
							<span className="text-gray-500 hidden sm:inline lg:hidden">•</span>
							<span className="hidden sm:inline-flex lg:hidden items-center gap-1">
								<ArticleViewCount slug={trimmedSlug} />
							</span>
							{article.category?.slug?.current && article.category?.title && (
								<Link
									href={`/categories/${article.category.slug.current}`}
									className="hidden sm:inline-flex lg:hidden items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
								>
									{article.category.title}
								</Link>
							)}
							{topicHubLinks.map((hub) => (
								<Link
									key={hub.slug}
									href={`/${hub.slug}`}
									className="hidden sm:inline-flex lg:hidden items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
								>
									{hub.title}
								</Link>
							))}
							{article.dateModified && article.dateModified !== publishedDate && (
								<span className="text-xs text-gray-500">Updated <time dateTime={article.dateModified}>{formatArticleDate(article.dateModified)}</time></span>
							)}
						</div>
						{article.coverImage?.asset?.url && (
							<div className="relative -mx-6 sm:-mx-5 h-[220px] sm:h-[310px] md:h-[430px] overflow-hidden">
								<Image
									src={article.coverImage.asset.url}
									alt={(article.coverImage as { alt?: string })?.alt || article.title}
									fill
									sizes={ARTICLE_COVER_SIZES}
									className="object-cover w-full h-full"
									priority
								/>
							</div>
						)}
						{article.summary && (
							<p className="mt-3 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-3xl">{article.summary}</p>
						)}
						{article.dateModified && article.updateNote && (
							<p className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm leading-relaxed text-emerald-800">
								<span className="font-semibold">Updated <time dateTime={article.dateModified}>{formatArticleDate(article.dateModified)}</time>:</span>{' '}
								{article.updateNote}
							</p>
						)}
						{tagList.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-2">
								{tagList.map((tag) => (
									<Link
										key={tag.slug || tag.title}
										href={tag.slug ? `/tags/${encodeURIComponent(tag.slug)}` : '/tags'}
										className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-800 hover:border-neutral-200 hover:bg-neutral-50"
									>
										#{tag.title}
									</Link>
								))}
							</div>
						)}
					</section>
					<section className="w-full mb-8">
						<div className="prose prose-neutral text-neutral-900 text-lg leading-relaxed max-w-4xl text-left">
							{Array.isArray(article.body) && <PortableText value={article.body} components={portableTextComponents} />}
						</div>
					</section>
					{categoryMatches.length > 1 && (
						<section className="mt-10">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-2xl font-semibold text-neutral-900">
									More from {article.category?.title}
								</h2>
								<Link
									href={`/categories/${article.category?.slug?.current}`}
									className="text-sm font-semibold text-emerald-800 hover:text-emerald-800"
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
											className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-4 backdrop-blur-sm hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
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
											<p className="text-xs uppercase tracking-wide text-neutral-600 mb-2">
												{formatArticleDate(item.date || item.publishedAt)}
											</p>
											<h3 className="text-lg font-semibold text-neutral-900 leading-snug line-clamp-2">
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
								<div className="h-10 w-10 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-900">
									🔥
								</div>
								<div>
									<p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Latest coverage</p>
									<h2 className="text-2xl font-semibold text-neutral-900">More from The Snap</h2>
								</div>
							</div>
							<ol className="space-y-3">
								{trendingArticles.map((item, index) => (
									<li key={item._id} className="flex items-start gap-4">
										<span className="text-3xl font-black text-neutral-300 leading-none">
											{(index + 1).toString().padStart(2, '0')}
										</span>
										<div className="flex-1 border-b border-neutral-200 pb-3">
											<Link
												href={`/articles/${item.slug.current}`}
												className="text-base font-semibold text-neutral-900 hover:text-emerald-800 transition-colors"
											>
												{item.homepageTitle || item.title}
											</Link>
											<div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
												{item.category?.title || (item._type === 'rankings' ? `${item.rankingType?.replace('-', ' ')} rankings` : 'Article')}
											</div>
										</div>
									</li>
								))}
							</ol>
						</section>
					)}
				</article>

				<aside className="space-y-8 lg:sticky lg:top-24 self-start">
					{/* Media embeds */}
					{article.youtubeVideoId && (
						<div className="w-full">
							<YouTubeEmbed
								videoId={article.youtubeVideoId}
								title={article.videoTitle || `Video: ${article.title}`}
								variant="article"
							/>
						</div>
					)}
					{!article.youtubeVideoId && article.twitterUrl && (
						<div className="w-full">
							<TwitterEmbed twitterUrl={article.twitterUrl} />
						</div>
					)}
					{!article.youtubeVideoId && !article.twitterUrl && article.instagramUrl && (
						<div className="w-full">
							<InstagramEmbed url={article.instagramUrl} title={article.instagramTitle} />
						</div>
					)}
					{!article.youtubeVideoId && !article.twitterUrl && !article.instagramUrl && article.tiktokUrl && (
						<div className="w-full">
							<TikTokEmbed url={article.tiktokUrl} title={article.tiktokTitle} />
						</div>
					)}
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
