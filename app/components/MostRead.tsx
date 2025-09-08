import { client } from '@/sanity/lib/client';
// Simple heuristic: most recent 10 for now; could be replaced with analytics-based popularity.
export const revalidate = 300;

interface Item { _id: string; title: string; homepageTitle?: string; slug: { current: string }; _type: string; }

export default async function MostRead({ limit = 6 }: { limit?: number }) {
  const items: Item[] = await client.fetch(`*[_type == "headline" && published == true] | order(_createdAt desc)[0...${limit}] { _id,title,homepageTitle,slug,_type }`);
  if (!items.length) return null;
  return (
    <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">Most Recent</h3>
      <ul className="space-y-3 text-sm">
        {items.map(i => (
          <li key={i._id}>
            <a href={`/headlines/${i.slug.current}`} className="text-gray-300 hover:text-white transition-colors line-clamp-2">
              {i.homepageTitle || i.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
