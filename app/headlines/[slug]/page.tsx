import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import type { Headline, HeadlineListItem, HeadlinePageProps } from "@/types";
import RelatedArticles from "@/app/components/RelatedArticles";

export const dynamic = "force-dynamic";

export default async function HeadlinePage(props: HeadlinePageProps) {
  const params = await props.params;
  if (!params?.slug) return notFound();

  const trimmedSlug = decodeURIComponent(params.slug).trim();

  const [headline, otherHeadlines] = await Promise.all([
    client.fetch<Headline>(
      `*[_type == "headline" && slug.current == $slug && published == true][0]{
        title,
        slug,
        summary,
        date,
        body,
        youtubeVideoId,
        videoTitle,
        author->{
          name,
          image {
            asset->{ url }
          }
        },
        coverImage {
          asset->{ url }
        }
      }`,
      { slug: trimmedSlug }
    ),
    client.fetch<HeadlineListItem[]>(
      `*[_type == "headline" && published == true] | order(_createdAt desc)[0...6]{
        _id,
        title,
        slug,
        coverImage {
          asset->{ url }
        }
      }`
    ),
  ]);

  if (!headline) notFound();

  return (
    <main className="bg-black text-white min-h-screen">
      {/* 📦 Content Container */}
      <div className="px-4 md:px-8 py-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ✅ Main Article Section */}
        <article className="lg:col-span-2 flex flex-col">
          {/* ✅ Cover Image FIRST */}
          {headline.coverImage?.asset?.url && (
            <div className="w-full flex justify-center mb-6">
              <div className="relative w-full max-w-2xl h-[400px] md:h-[500px] overflow-hidden rounded-md border border-slate-700 shadow-sm">
                <Image
                  src={headline.coverImage.asset.url}
                  alt={headline.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Title + Meta AFTER image */}
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4">
            {headline.title}
          </h1>

          <div className="text-sm text-gray-400 mb-6 flex items-center gap-3">
            {headline.author?.image?.asset?.url && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={headline.author.image.asset.url}
                  alt={headline.author.name || "Author"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span>
              By {headline.author?.name || "Unknown"} •{" "}
              {new Date(headline.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* ✅ Body Text */}
          <section className="w-full flex justify-center">
            <div className="prose prose-invert text-white text-lg leading-relaxed max-w-2xl">
              {headline.body && <PortableText value={headline.body} />}
            </div>
          </section>
        </article>

        {/* ✅ Enhanced Related Articles Sidebar */}
        <RelatedArticles 
          currentSlug={trimmedSlug} 
          articles={otherHeadlines}
          youtubeVideoId={headline.youtubeVideoId}
          videoTitle={headline.videoTitle}
        />
      </div>
    </main>
  );
}
