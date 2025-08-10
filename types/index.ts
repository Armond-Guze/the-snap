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
export interface PowerRankingTeam {
  _id: string;
  rank: number;
  previousRank?: number;
  teamColor?: string;
  teamName: string;
  teamLogo?: SanityImage;
  summary?: string;
  body?: PortableTextContent;
}

export interface MovementIndicator {
  symbol: string;
  color: string;
}

// Headlines types
export interface Headline {
  _id: string;
  title: string;
  slug: SanitySlug;
  summary?: string;
  date: string;
  body?: PortableTextContent;
  author?: Author;
  coverImage?: SanityImageWithUrl;
  category?: Category;
  tags?: Pick<Tag, 'title' | 'slug'>[];
  published?: boolean;
  youtubeVideoId?: string;
  videoTitle?: string;
  twitterUrl?: string;
  twitterTitle?: string;
  seo?: SEOData;
  _createdAt: string;
  _updatedAt: string;
}

export interface HeadlineListItem {
  _id: string;
  _type: 'headline' | 'rankings';
  title: string;
  slug: SanitySlug;
  coverImage?: SanityImageWithUrl;
  summary?: string;
  date?: string;
  publishedAt?: string;
  rankingType?: string;
  author?: Pick<Author, 'name'>;
  category?: Pick<Category, 'title' | 'slug' | 'color'>;
  tags?: Pick<Tag, 'title'>[];
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
  _id: string;
  title: string;
  slug: SanitySlug;
  rankingType: 'offense' | 'defense' | 'rookie' | 'fantasy-qb' | 'fantasy-rb' | 'fantasy-wr' | 'fantasy-te' | 'draft' | 'position' | 'team';
  summary?: string;
  coverImage?: SanityImageWithUrl;
  author?: Author;
  publishedAt: string;
  showAsArticle?: boolean;
  articleContent?: PortableTextContent;
  viewCount?: number;
  youtubeVideoId?: string;
  videoTitle?: string;
  twitterUrl?: string;
  teams: RankingTeam[];
  methodology?: PortableTextContent;
  seo?: SEOData;
  published: boolean;
}
