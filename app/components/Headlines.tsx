import { client } from "@/sanity/lib/client";
import { headlineQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface Headline {
  _id: string;
  title: string;
  slug?: {
    current: string;
  };
  summary?: string;
  coverImage?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  };
}

export default async function Headlines() {
  const headlines: Headline[] = await client.fetch(headlineQuery);
  if (!headlines?.length) return null;

  const main = headlines[0];
  const sidebar = headlines.slice(1);

  return (
    <section className="relative py-24 px-6 lg:px-8 bg-black">
      <div className="relative mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Breaking News
          </h2>
          <div className="w-24 h-1 bg-white mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Stay up to date with the latest NFL headlines and breaking stories
          </p>
        </div>        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feature Story */}
          <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-gray-900/60 transition-all duration-300 group">
            {main?.coverImage && main?.slug?.current && (
              <Link href={`/headlines/${main.slug.current.trim()}`}>
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={urlFor(main.coverImage).width(800).url()}
                    alt={main.title}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
              </Link>
            )}

            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Featured Story</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight text-white hover:text-gray-300 transition-colors duration-300">
                {main.title || "Untitled"}
              </h2>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {main.summary || "No summary available."}
              </p>
            </div>
          </div>

          {/* Sidebar Headlines */}
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-white rounded-full mr-3"></div>
              <h3 className="text-xl font-bold text-white">
                Latest Headlines
              </h3>
            </div>
            <ul className="space-y-6 text-sm">
              {sidebar.map((headline) => (
                <li key={headline._id} className="border-b border-gray-700/50 pb-4 last:border-b-0 last:pb-0">
                  {headline.slug?.current ? (
                    <Link href={`/headlines/${headline.slug.current.trim()}`}>
                      <div className="flex items-start gap-4 group cursor-pointer">
                        {headline.coverImage && (
                          <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                            <Image
                              src={urlFor(headline.coverImage)
                                .width(80)
                                .height(50)
                                .url()}
                              alt={headline.title}
                              width={80}
                              height={50}
                              className="w-20 h-[50px] object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <span className="hover:text-gray-400 transition-colors duration-300 font-medium leading-tight text-white">
                          {headline.title}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <span className="text-gray-500 flex items-center">
                      <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                      {headline.title || "Untitled"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
