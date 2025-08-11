import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import Link from "next/link";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { portableTextComponents } from "@/lib/portabletext-components";
import { notFound } from "next/navigation";

interface FantasyArticle {
  _id: string;
  title: string;
  slug: { current: string };
  summary?: string;
  content?: PortableTextBlock[];
  coverImage?: {
    asset?: { url: string };
  };
  fantasyType?: string;
  author?: { name: string };
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article: FantasyArticle = await sanityFetch(
    `*[_type == "fantasyFootball" && slug.current == $slug && published == true][0]{
      title,
      seoTitle,
      seoDescription,
      summary,
      coverImage {
        asset->{
          url
        }
      }
    }`,
    { slug },
    { next: { revalidate: 300 } }
  );

  if (!article) return {};

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.summary,
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.summary,
      images: article.coverImage?.asset?.url ? [article.coverImage.asset.url] : [],
    },
  };
}

export default async function FantasyArticlePage({ params }: Props) {
  const { slug } = await params;
  const article: FantasyArticle = await sanityFetch(
    `*[_type == "fantasyFootball" && slug.current == $slug && published == true][0]{
      _id,
      title,
      slug,
      summary,
      content,
      coverImage {
        asset->{
          url
        }
      },
      fantasyType,
      author->{
        name
      },
      publishedAt
    }`,
    { slug },
    { next: { revalidate: 300 } }
  );

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/fantasy" className="text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to Fantasy Football
          </Link>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          {article.fantasyType && (
            <span className="inline-block px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-full mb-4">
              {article.fantasyType.replace('-', ' ').toUpperCase()}
            </span>
          )}
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {article.title}
          </h1>
          
          {article.summary && (
            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
              {article.summary}
            </p>
          )}
          
          <div className="flex items-center text-gray-400 text-sm">
            <span>By {article.author?.name || "Staff Writer"}</span>
            {article.publishedAt && (
              <>
                <span className="mx-2">•</span>
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {article.coverImage?.asset?.url && (
          <div className="relative h-64 md:h-96 mb-8 rounded-xl overflow-hidden">
            <Image
              src={urlFor(article.coverImage).width(800).height(400).url()}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-invert prose-lg max-w-none">
          {article.content ? (
            <PortableText 
              value={article.content} 
              components={portableTextComponents}
            />
          ) : (
            <div className="text-center py-16 bg-gray-900 rounded-xl">
              <p className="text-gray-400 text-lg">
                Article content coming soon...
              </p>
            </div>
          )}
        </article>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link 
            href="/fantasy" 
            className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Fantasy Football
          </Link>
        </div>
      </div>
    </div>
  );
}
