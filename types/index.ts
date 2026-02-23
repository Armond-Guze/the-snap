// Shared TypeScript types for the Football News app

// PortableText types
export interface TypedObject {
  _type: string;
  _key?: string;
  [key: string]: unknown;
}

export type PortableTextContent = TypedObject[];

// SEO types
export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  additionalKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: SanityImageWithUrl;
  noIndex?: boolean;
  canonicalUrl?: string;
  // Automation extensions
  autoGenerate?: boolean;
  lastGenerated?: string; // ISO timestamp
}

// Sanity base types
export interface SanityAsset {
  _ref: string;
  _type: string;
}

export interface SanityImage {
  asset?: SanityAsset;
  alt?: string;
}

export interface SanityImageWithUrl {
  asset?: {
    url: string;
  };
}

export interface SanitySlug {
  current: string;
  _type: 'slug';
}

// Author types
export interface Author {
  _id: string;
  name: string;
  image?: SanityImageWithUrl;
  bio?: PortableTextContent;
}

// Power Rankings types
export interface PowerRankingEntry {
  rank: number;
  team?: { _id: string; title?: string; slug?: SanitySlug; teamLogo?: SanityImageWithUrl };
  teamAbbr?: string;
  teamName?: string;
  teamColor?: string;
  teamLogo?: SanityImageWithUrl;
  previousRank?: number;
  movement?: number;
  tier?: 'elite' | 'contender' | 'middle' | 'slipping' | 'rebuilding' | string;
  summary?: string;
  note?: string;
  analysis?: PortableTextContent;
  prevRankOverride?: number;
  movementOverride?: number;
}

export interface PowerRankingsDoc {
  _id: string;
  title?: string;
  summary?: string;
  slug?: SanitySlug;
  seasonYear: number;
  rankingType: 'live' | 'snapshot';
  weekNumber?: number;
  playoffRound?: 'WC' | 'DIV' | 'CONF' | 'SB' | 'OFF';
  methodology?: string;
  rankingIntro?: PortableTextContent;
  rankingConclusion?: PortableTextContent;
  biggestRiser?: string;
  biggestFaller?: string;
  editorialStatus?: 'draft' | 'review' | 'published' | string;
  rankings: PowerRankingEntry[];
  date?: string;
  publishedAt?: string;
  author?: Author;
  coverImage?: SanityImageWithUrl;
}

export interface MovementIndicator {
  symbol: string;
  color: string;
}

// Headlines types
export interface Headline {
  _id: string;
  _type?: 'headline' | 'rankings' | 'article' | string;
  format?: string;
  rankingType?: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: 'WC' | 'DIV' | 'CONF' | 'SB' | string;
  title: string;
  homepageTitle?: string;
  slug: SanitySlug;
  summary?: string;
  date: string;
  publishedAt?: string;
  body?: PortableTextContent;
  author?: Author;
  coverImage?: SanityImageWithUrl;
  category?: Category;
  topicHubs?: TopicHubRef[];
  tags?: Pick<Tag, 'title' | 'slug'>[];
  // Reference-based canonical tags (advanced)
  tagRefs?: Array<{ _ref: string }>;
  published?: boolean;
  youtubeVideoId?: string;
  videoTitle?: string;
  twitterUrl?: string;
  twitterTitle?: string;
  instagramUrl?: string;
  instagramTitle?: string;
  tiktokUrl?: string;
  tiktokTitle?: string;
  seo?: SEOData;
  _createdAt: string;
  _updatedAt: string;
}

export interface HeadlineListItem {
  _id: string;
  _type: 'headline' | 'rankings' | 'article';
  title: string;
  homepageTitle?: string;
  slug: SanitySlug;
  format?: string;
  coverImage?: SanityImageWithUrl;
  featuredImage?: SanityImageWithUrl; // added for unified content support
  image?: SanityImageWithUrl; // generic fallback image field
  summary?: string;
  date?: string;
  publishedAt?: string;
  rankingType?: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
  author?: Pick<Author, 'name'>;
  category?: Pick<Category, 'title' | 'slug' | 'color'>;
  topicHubs?: TopicHubRef[];
  tags?: Pick<Tag, 'title'>[];
}

export interface PlayOfWeek {
  _id: string;
  title: string;
  slug: SanitySlug;
  playType?: string;
  summary?: string;
  callout?: string;
  coverImage?: { asset?: { url?: string }; alt?: string };
  clipUrl?: string;
  date?: string;
  quarter?: string;
  clock?: string;
  downDistance?: string;
  yardLine?: string;
  yardsGained?: number;
  scoreBefore?: string;
  scoreAfter?: string;
  epaDelta?: number;
  winProbDelta?: number;
  skillBadges?: string[];
  difficulty?: number;
  difficultyNote?: string;
  momentumDirection?: string;
  momentumMagnitude?: number;
  impactTags?: string[];
  priority?: number;
  teams?: Array<{ _id: string; title?: string; slug?: SanitySlug }>;
  player?: {
    _id?: string;
    name?: string;
    position?: string;
    team?: string;
    headshot?: { asset?: { url?: string }; alt?: string };
  };
  body?: PortableTextContent;
}

// Category types
export interface Category {
  _id: string;
  title: string;
  slug: SanitySlug;
  description?: string;
  color?: string;
  priority?: number;
  seo?: SEOData;
}

export interface TopicHubRef {
  title?: string;
  slug?: SanitySlug;
}

// Tag types
export interface Tag {
  _id: string;
  title: string;
  slug: SanitySlug;
  description?: string;
  trending?: boolean;
}

// Next.js Page Props
export interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export interface HeadlinePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Component Props
export interface LayoutProps {
  children: React.ReactNode;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// Form types
export interface ContactForm {
  name: string;
  email: string;
  message: string;
}

// Rankings types
export interface RankingTeam {
  _id?: string;
  rank: number;
  previousRank?: number;
  teamName: string;
  teamLogo?: SanityImageWithUrl;
  teamColor?: string;
  summary?: string;
  analysis?: PortableTextContent;
  stats?: Array<{
    label: string;
    value: string;
  }>;
}

export interface Rankings {
  _type?: 'article' | 'rankings';
  _id: string;
  title: string;
  homepageTitle?: string;
  slug: SanitySlug;
  rankingType: 'offense' | 'defense' | 'rookie' | 'fantasy-qb' | 'fantasy-rb' | 'fantasy-wr' | 'fantasy-te' | 'draft' | 'position' | 'team';
  summary?: string;
  coverImage?: SanityImageWithUrl;
  articleImage?: SanityImageWithUrl;
  author?: Author;
  publishedAt: string;
  body?: PortableTextContent;
  showAsArticle?: boolean;
  articleContent?: PortableTextContent;
  viewCount?: number;
  youtubeVideoId?: string;
  videoTitle?: string;
  twitterUrl?: string;
  twitterTitle?: string;
  instagramUrl?: string;
  instagramTitle?: string;
  tiktokUrl?: string;
  tiktokTitle?: string;
  teams: RankingTeam[];
  methodology?: PortableTextContent;
  category?: Category;
  topicHubs?: TopicHubRef[];
  tags?: Pick<Tag, 'title' | 'slug'>[];
  // Reference-based canonical tags (advanced)
  tagRefs?: Array<{ _ref: string }>;
  priority?: number;
  seo?: SEOData;
  published: boolean;
}

export * from './calendar';
