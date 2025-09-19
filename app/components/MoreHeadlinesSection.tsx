import { client } from "@/sanity/lib/client";
// Custom query: fetch published headlines/rankings ordered by publishedAt desc (fallback _createdAt) up to 40 to have buffer
const moreHeadlinesQuery = `
  *[(_type == "headline" || _type == "rankings") && published == true]
    | order(publishedAt desc, _createdAt desc)[0...40] {
      _id,
      title,
      homepageTitle,
      summary,
      slug,
      coverImage { asset->{ url } },
      author->{ name },
      publishedAt
    }
`;
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface MoreHeadlinesSectionProps {
  textureSrc?: string;
  hideSummaries?: boolean;
}

interface HeadlineImageAssetRef { asset?: { _ref?: string; _id?: string }; [key: string]: unknown }
interface HeadlineItem {
  _id: string;
  title: string;
  homepageTitle?: string;
  summary?: string;
  slug?: { current?: string };
  coverImage?: HeadlineImageAssetRef;
  author?: { name?: string };
  publishedAt?: string;
}

export default async function MoreHeadlinesSection({ hideSummaries = false }: MoreHeadlinesSectionProps) {
  const headlines: HeadlineItem[] = await client.fetch(moreHeadlinesQuery);
  // First 9 assumed consumed by the top Headlines component. Show next newest items up to a cap (20 max total, so 11 here if 9 used above).
  const START_INDEX = 9; // skip ones already displayed
  const MAX_TOTAL = 20;
  const remainingSlots = Math.max(0, MAX_TOTAL - START_INDEX);
  const moreHeadlines = (headlines || []).slice(START_INDEX, START_INDEX + remainingSlots);

  return (
    <section className="relative py-16 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/65 to-black/90" />
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem] z-10">
        <div className="mb-6">
          <h2 className="text-xl sm:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-gray-300">More Headlines</h2>
        </div>
        <div className="space-y-4">
          {moreHeadlines.map((item: HeadlineItem) => {
            const author = item.author?.name;
            return (
              <Link
                key={item._id}
                href={item.slug?.current ? `/headlines/${item.slug.current}` : '#'}
                className="group flex gap-5 p-3 sm:p-4 rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] hover:bg-[#161616] hover:border-[#262626] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#444]"
              >
                <div className="relative w-32 sm:w-40 lg:w-44 h-28 sm:h-32 flex-shrink-0 overflow-hidden rounded-md bg-gray-800/40">
                  {item.coverImage?.asset ? (
                    <Image
                      src={urlFor(item.coverImage).width(400).height(300).fit('crop').url()}
                      alt={item.title}
                      fill
                      className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.06]"
                      sizes="(max-width:640px) 150px, (max-width:1024px) 180px, 190px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8z"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1 pt-2 sm:pt-3">
                  <h3 className="text-[17px] sm:text-[18px] font-semibold leading-snug text-gray-100 group-hover:text-white line-clamp-2 mb-1.5">{item.homepageTitle || item.title}</h3>
                  {item.summary && !hideSummaries && (
                    <p className="text-sm text-gray-400/90 line-clamp-2 hidden md:block mb-1.5 leading-snug">{item.summary}</p>
                  )}
                  {author && (
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 group-hover:text-gray-300">{author}</p>
                  )}
                </div>
              </Link>
            );
          })}
          {moreHeadlines.length === 0 && <div className="text-gray-400 text-sm">No additional headlines available.</div>}
        </div>
      </div>
    </section>
  );
}
