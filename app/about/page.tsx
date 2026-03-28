import Link from "next/link";
import { SimpleCard, SimplePageShell, SimpleSection } from "../components/SimpleInfoPage";

const offerings = [
  {
    title: "Power Rankings",
    body: "Weekly ranking drops with movement, tiers, and team-level analysis built for repeat readers.",
  },
  {
    title: "Breaking News",
    body: "Fast NFL updates rewritten in The Snap voice so the key takeaway is clear immediately.",
  },
  {
    title: "Offseason Coverage",
    body: "Team needs, contracts, trades, win totals, and roster shifts with a sharper focus than generic news blurbs.",
  },
  {
    title: "Fantasy + Tools",
    body: "Fantasy coverage and interactive products that give readers something useful to do, not just something to scroll past.",
  },
];

export default function AboutPage() {
  return (
    <SimplePageShell
      eyebrow="About"
      title="Built for people who want NFL coverage without the filler."
      intro="The Snap is a modern NFL site focused on rankings, offseason analysis, team outlooks, and useful tools. The goal is simple: make every page clearer, tighter, and more useful than generic sports content."
    >
      <SimpleSection title="What The Snap is trying to do">
        <p>
          The site is built around recurring franchises that can actually earn repeat readers: power rankings, betting
          angles, fantasy tools, and team-specific analysis. That keeps the coverage focused and makes it easier for
          readers to know what to come back for.
        </p>
        <p>
          Instead of publishing for volume alone, the goal is to build a sharper NFL brand with clear editorial lanes
          and pages that are worth revisiting during the season and the offseason.
        </p>
      </SimpleSection>

      <section className="grid gap-4 md:grid-cols-2">
        {offerings.map((item) => (
          <SimpleCard key={item.title} title={item.title} body={item.body} />
        ))}
      </section>

      <SimpleSection title="How the site approaches content">
        <p>
          The Snap prioritizes clean writing, direct analysis, and a stronger product feel. Rankings should be easy to
          scan. News should be easy to understand. Utility pages should help readers do something useful fast.
        </p>
        <p>
          That means fewer bloated layouts, less noise, and more attention on consistency across headlines, design, and
          navigation.
        </p>
      </SimpleSection>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.8rem]">Explore the site</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/headlines"
            className="rounded-full border border-white/12 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Read Headlines
          </Link>
          <Link
            href="/articles/power-rankings"
            className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View Power Rankings
          </Link>
        </div>
      </section>
    </SimplePageShell>
  );
}
