import { PortableText } from '@portabletext/react';
import { notFound, redirect } from 'next/navigation';
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
import { generateSEOMetadata } from '@/lib/seo';
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
import ArticleHeroCover from '@/app/components/ArticleHeroCover';
import { SITE_URL } from '@/lib/site-config';
import { client } from '@/sanity/lib/client';

export const revalidate = 300;

type PortableTextChild = {
	text?: string;
};

type PortableTextBlock = {
	_key?: string;
	_type?: string;
	style?: string;
	children?: PortableTextChild[];
	[key: string]: unknown;
};

const DRAFT_GRADES_CARD_SLUGS = new Set([
	'2026-nfl-draft-grades-arvell-reese-headlines-a-loaded-first-round',
]);

const TEAM_NICKNAME_TO_FULL_NAME: Record<string, string> = {
	raiders: 'Las Vegas Raiders',
	jets: 'New York Jets',
	cardinals: 'Arizona Cardinals',
	titans: 'Tennessee Titans',
	giants: 'New York Giants',
	chiefs: 'Kansas City Chiefs',
	commanders: 'Washington Commanders',
	saints: 'New Orleans Saints',
	browns: 'Cleveland Browns',
	cowboys: 'Dallas Cowboys',
	dolphins: 'Miami Dolphins',
	rams: 'Los Angeles Rams',
	ravens: 'Baltimore Ravens',
	buccaneers: 'Tampa Bay Buccaneers',
	lions: 'Detroit Lions',
	vikings: 'Minnesota Vikings',
	panthers: 'Carolina Panthers',
	eagles: 'Philadelphia Eagles',
	steelers: 'Pittsburgh Steelers',
	chargers: 'Los Angeles Chargers',
	bears: 'Chicago Bears',
	texans: 'Houston Texans',
	patriots: 'New England Patriots',
	seahawks: 'Seattle Seahawks',
};

const extractPortableText = (block: PortableTextBlock): string => {
	if (!Array.isArray(block.children)) return '';
	return block.children
		.map((child) => (typeof child?.text === 'string' ? child.text : ''))
		.join('')
		.trim();
};

const sanitizeDraftLead = (text: string): string => {
	if (/^[a-z][A-Z][a-z]+:/.test(text)) {
		return text.slice(1);
	}
	return text;
};

const buildDraftRankingCard = (
	text: string,
	pickNumber: number,
): PortableTextBlock | null => {
	const sanitized = sanitizeDraftLead(text);
	const match = sanitized.match(
		/^([A-Za-z .()'/-]+):\s+([^,]+),\s+([^,]+),\s+(.+?)\s+[—-]\s+([A-F][+-]?)$/,
	);

	if (!match) return null;

	const [, teamNickname, playerName, position, school, grade] = match;
	const normalizedTeamNickname = teamNickname.trim().toLowerCase();
	const fullTeamName =
		TEAM_NICKNAME_TO_FULL_NAME[normalizedTeamNickname] || teamNickname.trim();

	return {
		_key: `draft-ranking-card-${pickNumber}`,
		_type: 'rankingCard',
		rank: pickNumber,
		name: playerName.trim(),
		position: position.trim(),
		descriptor: `${position.trim()} • ${school.trim()}`,
		grade: grade.trim(),
		teamContext: `Round 1 • No. ${pickNumber} overall`,
		team: {
			title: fullTeamName,
		},
	};
};

const injectDraftRankingCards = (
	body: PortableTextBlock[] | undefined,
	slug: string,
): PortableTextBlock[] | undefined => {
	if (!Array.isArray(body) || !DRAFT_GRADES_CARD_SLUGS.has(slug)) return body;

	const transformed: PortableTextBlock[] = [];
	let pickNumber = 1;

	for (const block of body) {
		const blockType = typeof block?._type === 'string' ? block._type : '';
		const previousBlockType =
			transformed.length > 0 && typeof transformed[transformed.length - 1]?._type === 'string'
				? transformed[transformed.length - 1]._type
				: '';

		if (blockType === 'block' && block.style === 'normal') {
			const text = extractPortableText(block);
			const rankingCard = buildDraftRankingCard(text, pickNumber);

			if (rankingCard) {
				if (previousBlockType !== 'rankingCard') {
					transformed.push(rankingCard);
				}
				pickNumber += 1;
			}
		}

		transformed.push(block);
	}

	return transformed;
};

export async function generateStaticParams() {
	const docs = await client.fetch<Array<{ slug?: string }>>(
		`*[
			published == true &&
			defined(slug.current) &&
			(
				_type == "headline" ||
				_type == "rankings" ||
				(_type == "article" && format != "powerRankings")
			)
		]{
			"slug": slug.current
		}`
	);

	return docs
		.map((doc) => doc.slug?.trim())
		.filter((slug): slug is string => Boolean(slug))
		.map((slug) => ({ slug }));
}

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
		return {
			...generateSEOMetadata(article, '/articles'),
			alternates: {
				canonical,
			},
		};
	}

	const metadata = generateSEOMetadata(article, '/articles');
	const canonicalBase = `${SITE_URL}/articles`;
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
				tags[]->{ title }
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
			redirect(`/articles/${targetSlug}`);
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
			redirect(`/articles/power-rankings/${season}/${weekPart}`);
		}
		redirect('/articles/power-rankings');
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
	const relatedArticlePool = otherArticles.filter(
		(item) =>
			item.slug.current !== trimmedSlug &&
			!(item._type === 'article' && item.format === 'powerRankings')
	);
	const prioritizedMoreArticles = categorySlug
		? [
				...relatedArticlePool.filter((item) => item.category?.slug?.current === categorySlug),
				...relatedArticlePool.filter((item) => item.category?.slug?.current !== categorySlug),
			]
		: relatedArticlePool;
	const moreArticles = prioritizedMoreArticles.slice(0, 3);
	const moreArticleIds = new Set(moreArticles.map((item) => item._id));
	const sidebarArticles = relatedArticlePool.filter((item) => !moreArticleIds.has(item._id));

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

	const shareUrl = `${SITE_URL}/articles/${trimmedSlug}`;
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
			dateModified:
				(article as unknown as { _updatedAt?: string })._updatedAt ||
				article.date ||
				article.publishedAt ||
				'',
			author: { name: article.author?.name || 'Staff Writer' },
			articleSection: article.category?.title || primaryTopicHub?.title,
			keywords: keywordList && keywordList.length ? keywordList : undefined,
			speakableSelectors: ['h1', 'meta[name="description"]'],
		});
	} catch (e) {
		console.error('Structured data generation failed', e);
	}

	const publishedDate = article.date || article.publishedAt;
	const articleBody = injectDraftRankingCards(article.body as PortableTextBlock[] | undefined, trimmedSlug);

	return (
		<>
			<main className="bg-[hsl(0_0%_3.9%)] text-white min-h-screen">
			{articleSD && <StructuredData id={`sd-article-${trimmedSlug}`} data={articleSD} />}
			<div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
				<article className="lg:col-span-2 flex flex-col">
					<div className="hidden sm:block">
						<Breadcrumb items={breadcrumbItems} className="mb-4" />
					</div>
					<section className="mb-6 -mx-6 rounded-none bg-zinc-900/85 px-6 py-4 sm:mx-0 sm:rounded-2xl sm:px-5 sm:py-5">
						<h1 className="text-2xl sm:text-3xl md:text-[2.2rem] font-extrabold leading-tight text-white mb-2 md:mb-3 text-left">{article.title}</h1>
						<div className="text-[12px] sm:text-[13px] text-gray-400 mb-4 flex items-center gap-2.5 text-left flex-wrap">
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
							{article.author?.name && <span className="font-medium text-white/90">{article.author.name}</span>}
							{publishedDate && (
								<>
									<span>• {formatArticleDate(publishedDate)}</span>
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
									className="hidden sm:inline-flex lg:hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:border-white/40 hover:bg-white/10 transition-colors"
								>
									{article.category.title}
								</Link>
							)}
							{topicHubLinks.map((hub) => (
								<Link
									key={hub.slug}
									href={`/${hub.slug}`}
									className="hidden sm:inline-flex lg:hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:border-white/40 hover:bg-white/10 transition-colors"
								>
									{hub.title}
								</Link>
							))}
							{(article as unknown as { _updatedAt?: string })._updatedAt && (article as unknown as { _updatedAt?: string })._updatedAt !== article.date && (
								<span className="text-xs text-gray-500">Updated {formatArticleDate((article as unknown as { _updatedAt?: string })._updatedAt! )}</span>
							)}
						</div>
						{article.coverImage?.asset?.url && (
							<ArticleHeroCover
								src={article.coverImage.asset.url}
								alt={(article.coverImage as { alt?: string })?.alt || article.title}
								sizes={ARTICLE_COVER_SIZES}
								priority
							/>
						)}
						{article.summary && (
							<p className="mt-3 text-base sm:text-lg text-gray-300 leading-relaxed max-w-3xl">{article.summary}</p>
						)}
						{tagList.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-2">
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
					</section>
					<section className="w-full mb-8">
						<div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
							{Array.isArray(articleBody) && <PortableText value={articleBody} components={portableTextComponents} />}
						</div>
					</section>
					{moreArticles.length > 0 && (
						<section className="mt-12 -mx-6 rounded-[2rem] bg-white/[0.03] px-6 py-8 sm:-mx-5 sm:px-5">
							<div className="mb-5">
								<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">
									More articles
								</p>
								<h2 className="mt-2 text-2xl font-semibold text-white">
									More Articles
								</h2>
							</div>
							<div className="grid gap-6 md:grid-cols-3">
								{moreArticles.map((item) => {
									const img =
										item.coverImage?.asset?.url ||
										item.featuredImage?.asset?.url ||
										item.image?.asset?.url ||
										null;
									return (
										<Link
											key={item._id}
											href={`/articles/${item.slug.current}`}
											className="group block"
										>
											{img && (
												<div className="relative mb-4 h-44 overflow-hidden rounded-[1.35rem] sm:h-48">
													<Image
														src={img}
														alt={item.title}
														fill
														sizes="(max-width: 768px) 100vw, 33vw"
														className="object-cover transition-transform duration-500 group-hover:scale-105"
													/>
												</div>
											)}
											<p className="mb-2 text-xs uppercase tracking-[0.24em] text-white/45">
												{formatArticleDate(item.date || item.publishedAt)}
											</p>
											<h3 className="text-xl font-semibold leading-snug text-white line-clamp-2 transition-colors group-hover:text-white/80">
												{item.homepageTitle || item.title}
											</h3>
										</Link>
									);
								})}
							</div>
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
					<RelatedArticles currentSlug={trimmedSlug} articles={sidebarArticles as unknown as HeadlineListItem[]} />
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
