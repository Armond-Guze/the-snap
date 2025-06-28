// Shared TypeScript types for the Football News app

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
  bio?: any[]; // PortableText
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
  body?: any[]; // PortableText
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
  body?: any[]; // PortableText
  author?: Author;
  coverImage?: SanityImageWithUrl;
  category?: Category;
  tags?: Pick<Tag, 'title' | 'slug'>[];
  published?: boolean;
  youtubeVideoId?: string;
  videoTitle?: string;
  _createdAt: string;
  _updatedAt: string;
}

export interface HeadlineListItem {
  _id: string;
  title: string;
  slug: SanitySlug;
  coverImage?: SanityImageWithUrl;
  summary?: string;
  date: string;
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
