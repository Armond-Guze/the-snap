import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";

// Both responsive layouts render the same lead image. Keeping one descriptor
// lets React deduplicate their preload while accurately accounting for the
// mobile page gutter.
const HOME_LEAD_IMAGE_SIZES =
  "(max-width: 1023px) calc(100vw - 2rem), (min-width: 1536px) 52vw, (min-width: 1280px) 57vw, 52vw";

interface HeadlineItem {
  _id: string;
  _type: string;
  format?: string;
  title: string;
  homepageTitle?: string;
  slug: { current: string };
  summary?: string;
  coverImage?: {
    asset: {
      url: string;
    };
  };
  author?: { name: string };
  priority?: number;
  date?: string;
  publishedAt?: string;
  tags?: string[];
}

interface HeadlinesProps {
  // textureSrc no longer used; keeping prop for compatibility but ignored
  textureSrc?: string;
  /** When true, summary text is suppressed (e.g., cleaner homepage). */
  hideSummaries?: boolean;
}

export default async function Headlines({ hideSummaries = false }: HeadlinesProps) {
 const headlines = await sanityFetch<HeadlineItem[]>(`*[
 ((_type == "article" && format == "headline") || _type == "headline" || _type == "rankings") && published == true && defined(slug.current)
 ] | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...20]{
 _id,_type,format,title,homepageTitle,slug,summary,
 "coverImage": {"asset":{"url":coalesce(coverImage.asset->url,featuredImage.asset->url,image.asset->url)}},
 author->{name},date,publishedAt
 }`, {}, {next:{revalidate:180}}, []);
 if(!headlines.length)return null;
 const featured=headlines.slice(0,9);
 const main=featured.find(item=>item.coverImage?.asset?.url)||featured[0];
 const others=featured.filter(item=>item._id!==main._id);
 const secondary=others.slice(0,2);
 const sidebar=others.slice(2,8);
 const href=(item:HeadlineItem)=>'/articles/'+item.slug.current.trim();
 const title=(item:HeadlineItem)=>item.homepageTitle||item.title;
 const date=(item:HeadlineItem)=>{const value=item.date||item.publishedAt;if(!value||Number.isNaN(Date.parse(value)))return null;return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(value));};
 return <section className="snap-home-lead" aria-label="Top NFL stories">
  <div className="snap-lead-layout">
   <Link href={href(main)} className="snap-lead-story group">
    {main.coverImage?.asset?.url&&<div className="snap-lead-photo"><Image src={main.coverImage.asset.url} alt={main.title} fill loading="eager" fetchPriority="high" sizes={HOME_LEAD_IMAGE_SIZES} className="object-cover"/></div>}
    <div className="snap-lead-copy"><div className="snap-story-meta"><span>Top story</span>{date(main)&&<time>{date(main)}</time>}</div><h1>{title(main)}</h1>{main.summary&&!hideSummaries&&<p>{main.summary}</p>}<span className="snap-story-read">Read the story <span aria-hidden="true">↗</span></span></div>
   </Link>
   <aside className="snap-lead-sidebar"><h2>Around the NFL</h2><ul>{sidebar.map(item=><li key={item._id}><Link href={href(item)}>{date(item)&&<time>{date(item)}</time>}<h3>{title(item)}</h3></Link></li>)}</ul><Link href="/headlines" className="snap-story-read">All headlines <span aria-hidden="true">↗</span></Link></aside>
   <div className="snap-lead-secondary">{secondary.map(item=><Link href={href(item)} key={item._id} className="snap-secondary-story">{item.coverImage?.asset?.url&&<div className="snap-secondary-photo"><Image src={item.coverImage.asset.url} alt={item.title} fill sizes="(max-width:700px) 100px, 160px" className="object-cover"/></div>}<div><div className="snap-story-meta">{date(item)||'Latest headline'}</div><h2>{title(item)}</h2></div></Link>)}</div>
  </div>
 </section>;
}
