import { client } from "@/sanity/lib/client";
import { headlineQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface BentoGridProps {
  textureSrc?: string;
}

interface HeadlineImageAssetRef { asset?: { _ref?: string; _id?: string }; [key: string]: unknown }
interface HeadlineItem {
  _id: string;
  title: string;
  summary?: string;
  slug?: { current?: string };
  coverImage?: HeadlineImageAssetRef;
}

export default async function BentoGrid({ textureSrc }: BentoGridProps) {
  // Fetch data from Sanity - showing more headlines for the expanded layout
  const headlines: HeadlineItem[] = await client.fetch(headlineQuery);

  // Avoid duplicating headlines already shown in the main hero + side lists (indexes 0-9)
  const moreHeadlines = (headlines || []).slice(10, 22); // grab up to 12 additional items

  return (
  <section className="relative py-16 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      {textureSrc && (
        <>
          <div className="absolute inset-0 -z-20">
            <Image
              src={textureSrc}
              alt="NFL background"
              fill
              priority
              quality={100}
              className="object-cover opacity-30 md:opacity-35"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-black/90 -z-10" />
        </>
      )}
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem] z-10">
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-extrabold tracking-tight text-white relative">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">More Headlines</span>
              <span className="block h-[2px] mt-2 w-24 bg-gradient-to-r from-indigo-400 via-cyan-400 to-transparent rounded-full" />
            </h2>
          </div>
          <p className="mt-3 text-sm text-gray-400 max-w-xl">Curated updates you might have missed — a quick scan friendly grid.</p>
        </div>

        {/* Distinct Mosaic Grid */}
        <div className="grid gap-5 2xl:gap-7 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          {moreHeadlines.map((item: HeadlineItem, idx: number) => (
            <Link
              key={item._id}
              href={item.slug?.current ? `/headlines/${item.slug.current}` : '#'}
              className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/10 hover:border-white/25 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {/* Number badge */}
              <div className="absolute top-2 left-2 z-10 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-gray-200 tracking-wide">
                {idx + 1}
              </div>
              {/* Image */}
              <div className="relative w-full h-28 2xl:h-32 bg-gray-800/40">
                {item.coverImage?.asset ? (
                  <Image
                    src={urlFor(item.coverImage).width(400).height(220).fit('crop').url()}
                    alt={item.title}
                    fill
                    className="object-cover object-center transition-all duration-500 group-hover:scale-[1.06] group-hover:opacity-90"
                    sizes="(max-width:768px) 50vw, (max-width:1280px) 25vw, 200px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8z"/></svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              </div>
              {/* Content */}
              <div className="p-3 2xl:p-4 flex flex-col h-[calc(100%-theme(space.28))]">
                <h3 className="text-[13px] 2xl:text-sm font-semibold leading-snug text-gray-100 line-clamp-3 group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="mt-2 text-[11px] 2xl:text-xs text-gray-400 line-clamp-3 hidden md:block">
                    {item.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
          {moreHeadlines.length === 0 && (
            <div className="col-span-full text-gray-400 text-sm">No additional headlines available.</div>
          )}
        </div>
      </div>
    </section>
  );
}
