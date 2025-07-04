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
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Article Section */}
        <article className="lg:col-span-2 flex flex-col">
          {/* Title + Meta */}
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4 text-left">
            {headline.title}
          </h1>
          <div className="text-sm text-gray-400 mb-6 flex items-center gap-3 text-left">
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
          {/* Cover Image */}
          {headline.coverImage?.asset?.url && (
            <div className="w-full mb-6">
              <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[240px] sm:h-[350px] md:h-[500px] overflow-hidden rounded-none md:rounded-md border border-slate-700 shadow-sm md:w-full md:left-0 md:right-0 md:ml-0 md:mr-0">
  <Image
    src={headline.coverImage.asset.url}
    alt={headline.title}
    fill
    className="object-cover w-full h-full"
    priority
  />
</div>
            </div>
          )}
          {/* Body Text */}
          <section className="w-full">
            <div className="prose prose-invert text-white text-lg leading-relaxed max-w-4xl text-left">
              {headline.body && <PortableText value={headline.body} />}
            </div>
          </section>
        </article>
        {/* Related Articles Sidebar */}
        <RelatedArticles currentSlug={trimmedSlug} articles={otherHeadlines} />
      </div>
    </main>
  );
}
