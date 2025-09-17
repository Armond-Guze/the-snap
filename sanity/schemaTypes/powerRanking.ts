import { defineType, defineField } from "sanity";

export default defineType({
  name: "powerRanking",
  title: "Power Rankings",
  type: "document",
  fields: [
    defineField({
      name: "teamName",
      title: "Team Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "teamName",
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rank",
      title: "Rank",
      type: "number",
      validation: (Rule) => Rule.min(1).max(32),
    }),
    defineField({
      name: "teamLogo",
      title: "Team Logo",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description:
        "1–2 sentence punchy blurb used on cards and as the default SEO description (aim 120–155 chars). Include a team hook and this week's angle.",
      validation: (Rule) => Rule.max(180).warning("Keep under ~160 characters for best SEO snippets."),
    }),
    defineField({
      name: "body",
      title: "Analysis (Full Write-Up)",
      type: "blockContent",
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "teamColor",
      title: "Team Color",
      type: "string",
    }),
    defineField({
      name: "conference",
      title: "Conference",
      type: "string",
      options: {
        list: ["AFC", "NFC"], // dropdown options
      },
    }),

    defineField({
      name: "date",
      title: "Date Published",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "previousRank",
      title: "Previous Rank",
      type: "number",
      validation: (Rule) => Rule.min(1).max(32),
    }),
    // Optional: per-entry SEO overrides (rarely needed for individual team rows)
    defineField({
      name: 'seo',
      title: 'SEO (Optional)',
      type: 'seo',
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "teamName",
      subtitle: "rank",
      media: "teamLogo",
    },

    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: `Rank #${subtitle}`,
        media,
      };
    },
  },
});
