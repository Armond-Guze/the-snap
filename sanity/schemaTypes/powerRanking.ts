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
      title: "Team Name Color",
      type: "string",
      description: "Hex color used only for the team name text (e.g., #FFB612).",
      options: {
        list: [
          { title: "Arizona Cardinals — #97233F", value: "#97233F" },
          { title: "Atlanta Falcons — #A71930", value: "#A71930" },
          { title: "Baltimore Ravens — #241773", value: "#241773" },
          { title: "Buffalo Bills — #00338D", value: "#00338D" },
          { title: "Carolina Panthers — #0085CA", value: "#0085CA" },
          { title: "Chicago Bears — #0B162A", value: "#0B162A" },
          { title: "Cincinnati Bengals — #FB4F14", value: "#FB4F14" },
          { title: "Cleveland Browns — #311D00", value: "#311D00" },
          { title: "Dallas Cowboys — #041E42", value: "#041E42" },
          { title: "Denver Broncos — #FB4F14", value: "#FB4F14" },
          { title: "Detroit Lions — #0076B6", value: "#0076B6" },
          { title: "Green Bay Packers — #203731", value: "#203731" },
          { title: "Houston Texans — #03202F", value: "#03202F" },
          { title: "Indianapolis Colts — #002C5F", value: "#002C5F" },
          { title: "Jacksonville Jaguars — #006778", value: "#006778" },
          { title: "Kansas City Chiefs — #E31837", value: "#E31837" },
          { title: "Las Vegas Raiders — #000000", value: "#000000" },
          { title: "Los Angeles Chargers — #0080C6", value: "#0080C6" },
          { title: "Los Angeles Rams — #003594", value: "#003594" },
          { title: "Miami Dolphins — #008E97", value: "#008E97" },
          { title: "Minnesota Vikings — #4F2683", value: "#4F2683" },
          { title: "New England Patriots — #002244", value: "#002244" },
          { title: "New Orleans Saints — #D3BC8D", value: "#D3BC8D" },
          { title: "New York Giants — #0B2265", value: "#0B2265" },
          { title: "New York Jets — #125740", value: "#125740" },
          { title: "Philadelphia Eagles — #004C54", value: "#004C54" },
          { title: "Pittsburgh Steelers — #FFB612", value: "#FFB612" },
          { title: "San Francisco 49ers — #AA0000", value: "#AA0000" },
          { title: "Seattle Seahawks — #002244", value: "#002244" },
          { title: "Tampa Bay Buccaneers — #D50A0A", value: "#D50A0A" },
          { title: "Tennessee Titans — #0C2340", value: "#0C2340" },
          { title: "Washington Commanders — #5A1414", value: "#5A1414" },
        ],
      },
      validation: (Rule) =>
        Rule.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, { name: "hex color" })
          .warning("Use a hex color like #FFB612."),
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
