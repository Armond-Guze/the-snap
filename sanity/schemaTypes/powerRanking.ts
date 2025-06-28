import { defineType, defineField } from "sanity";

export default defineType({
  name: "powerRanking",
  title: "Power Ranking",
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
