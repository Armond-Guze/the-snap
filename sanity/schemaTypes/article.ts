import { defineField, defineType } from "sanity";
import TeamTagsInput from "../plugins/teamTagsInput";
import { apiVersion } from "../env";

const isPowerRankings = (document?: Record<string, unknown>) => document?.format === "powerRankings";
const isPowerRankingsSnapshot = (document?: Record<string, unknown>) =>
  isPowerRankings(document) && document?.rankingType === "snapshot";

// Articles schema mirrors Headlines fields for identical editing experience
export default defineType({
  name: "article",
  title: "Articles",
  type: "document",
  fields: [
    defineField({
      name: "format",
      title: "Article Format",
      type: "string",
      description: "Choose the subtype for this article (e.g., headline vs feature vs ranking).",
      options: {
        list: [
          { title: "Headline", value: "headline" },
          { title: "Feature", value: "feature" },
          { title: "Fantasy", value: "fantasy" },
          { title: "Analysis", value: "analysis" },
          { title: "Ranking", value: "ranking" },
          { title: "Power Rankings", value: "powerRankings" },
          { title: "Other", value: "other" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required().error("Pick an article format"),
      initialValue: "feature",
      group: "quick",
    }),

    defineField({
      name: "rankingType",
      title: "Power Rankings Type",
      type: "string",
      options: {
        list: [
          { title: "Live", value: "live" },
          { title: "Weekly Snapshot", value: "snapshot" },
        ],
        layout: "radio",
      },
      validation: (Rule) =>
        Rule.custom(async (val, ctx) => {
          if (!isPowerRankings(ctx.document)) return true;
          if (!val) return "Select live or weekly snapshot";
          if (val !== "live") return true;
          const seasonYear = ctx.document?.seasonYear;
          if (typeof seasonYear !== "number") return "Season year is required for live power rankings";
          const client = ctx.getClient({ apiVersion });
          const rawId = typeof ctx.document?._id === "string" ? ctx.document?._id : "";
          const cleanId = rawId.replace(/^drafts\./, "");
          const draftId = cleanId ? `drafts.${cleanId}` : "";
          const existing = await client.fetch<number>(
            `count(*[_type == "article" && format == "powerRankings" && rankingType == "live" && seasonYear == $season && !(_id in [$id, $draftId])])`,
            { season: seasonYear, id: cleanId, draftId }
          );
          if (existing > 0) return "Only one live Power Rankings doc is allowed per season";
          return true;
        }),
      hidden: ({ document }) => !isPowerRankings(document),
      group: "power",
    }),

    defineField({
      name: "seasonYear",
      title: "Season Year",
      type: "number",
      description: "Use the season year for this ranking (e.g., 2025).",
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          if (!isPowerRankings(ctx.document)) return true;
          if (typeof val !== "number") return "Season year is required for power rankings";
          if (val < 2000 || val > 2100) return "Season year must be between 2000 and 2100";
          return true;
        }),
      hidden: ({ document }) => !isPowerRankings(document),
      group: "power",
    }),

    defineField({
      name: "weekNumber",
      title: "Week Number",
      type: "number",
      description: "Regular season week number (1–18). Leave empty for playoff rounds.",
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          if (!isPowerRankingsSnapshot(ctx.document)) return true;
          const playoffRound = ctx.document?.playoffRound;
          if (typeof val !== "number" && !playoffRound) return "Week number is required for snapshots unless a playoff round is selected";
          if (typeof val === "number" && playoffRound) return "Use either a week number or a playoff round, not both";
          if (typeof val === "number" && (val < 1 || val > 18)) return "Week number must be between 1 and 18";
          return true;
        }),
      hidden: ({ document }) => !isPowerRankings(document) || document?.rankingType !== "snapshot",
      group: "power",
    }),

    defineField({
      name: "playoffRound",
      title: "Playoff Round",
      type: "string",
      options: {
        list: [
          { title: "Wild Card", value: "WC" },
          { title: "Divisional", value: "DIV" },
          { title: "Conference", value: "CONF" },
          { title: "Super Bowl", value: "SB" },
        ],
        layout: "radio",
      },
      description: "Only use for playoff snapshots. Leave empty for regular season weeks.",
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          if (!isPowerRankingsSnapshot(ctx.document)) return true;
          const weekNumber = ctx.document?.weekNumber;
          if (!val && typeof weekNumber !== "number") return "Select a playoff round or enter a week number";
          if (val && typeof weekNumber === "number") return "Use either a playoff round or a week number, not both";
          return true;
        }),
      hidden: ({ document }) => !isPowerRankings(document) || document?.rankingType !== "snapshot",
      group: "power",
    }),

    defineField({
      name: "rankings",
      title: "Ranked Teams (1–32)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "rank", title: "Rank", type: "number", validation: (Rule) => Rule.required().min(1).max(32) }),
            defineField({
              name: "team",
              title: "Team",
              type: "reference",
              to: [{ type: "tag" }],
              description: "Use the canonical team tag",
              validation: (Rule) => Rule.required().error("Team tag is required"),
            }),
            defineField({ name: "teamAbbr", title: "Team Abbreviation", type: "string", description: "Optional (e.g., KC, SF). Used for links/labels." }),
            defineField({ name: "teamName", title: "Team Name (override)", type: "string", description: "Optional display override" }),
            defineField({
              name: "teamLogo",
              title: "Team Logo",
              type: "image",
              options: { hotspot: true },
              fields: [
                defineField({ name: "alt", title: "Alt Text", type: "string", description: "Team logo alt text." }),
              ],
            }),
            defineField({ name: "note", title: "Blurb", type: "text", rows: 2, description: "Short punchy note" }),
            defineField({ name: "analysis", title: "Analysis (Full Write-Up)", type: "blockContent" }),
            defineField({ name: "prevRankOverride", title: "Prev Rank (override)", type: "number" }),
            defineField({ name: "movementOverride", title: "Movement (+/- override)", type: "number", description: "Leave empty to auto-compute" }),
          ],
        },
      ],
      validation: (Rule) =>
        Rule.custom((items: any, ctx) => {
          if (!isPowerRankings(ctx.document)) return true;
          if (!Array.isArray(items)) return "Add the ranked teams";
          if (items.length !== 32) return "Must include exactly 32 teams";
          const ranks = items.map((i) => i?.rank).filter((r) => typeof r === "number") as number[];
          if (new Set(ranks).size !== 32) return "Ranks must be unique";
          const missing = Array.from({ length: 32 }, (_, idx) => idx + 1).filter((n) => !ranks.includes(n));
          if (missing.length) return "Ranks must be contiguous 1–32";
          const teamRefs = items.map((i) => i?.team?._ref).filter(Boolean) as string[];
          if (teamRefs.length !== 32) return "Each ranking must reference a team tag";
          if (new Set(teamRefs).size !== 32) return "Teams must be unique";
          return true;
        }),
      hidden: ({ document }) => !isPowerRankings(document),
      group: "power",
    }),

    defineField({
      name: "methodology",
      title: "Methodology / Notes",
      type: "text",
      rows: 3,
      description: "Explain how rankings are decided. Keep on live doc and reuse for snapshots.",
      hidden: ({ document }) => !isPowerRankings(document) || document?.rankingType === "snapshot",
      group: "power",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().min(5).max(120),
      group: "quick",
    }),
    defineField({
      name: "homepageTitle",
      title: "Homepage Display Title",
      type: "string",
      description:
        "Optional shorter / cleaner title just for homepage modules. Leaves full Title for article page & SEO.",
      validation: (Rule) => Rule.max(70).error("Homepage Display Title must be 70 characters or fewer"),
      group: "quick",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/'|'|"|"/g, "'")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 96),
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, ctx) => {
          if (!value?.current) return true;
          const client = ctx.getClient({ apiVersion });
          const rawId = typeof ctx.document?._id === "string" ? ctx.document?._id : "";
          const cleanId = rawId.replace(/^drafts\./, "");
          const draftId = cleanId ? `drafts.${cleanId}` : "";
          const count = await client.fetch<number>(
            `count(*[_type in ["article","rankings","headline"] && slug.current == $slug && !(_id in [$id,$draftId])])`,
            { slug: value.current, id: cleanId, draftId }
          );
          return count > 0 ? "Slug already in use for an article/ranking" : true;
        }),
      group: "quick",
    }),

    defineField({
      name: "slugHistory",
      title: "Slug History (for redirects)",
      type: "array",
      of: [{ type: "string" }],
      description: "Keep previous slugs to power redirects if URL patterns change.",
      group: "advanced",
    }),

    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
      initialValue: { autoGenerate: true },
      options: { collapsible: true, collapsed: true },
    }),

    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt Text", type: "string", description: "Describe the image for SEO/accessibility." }),
        defineField({ name: "caption", title: "Caption", type: "string" }),
        defineField({ name: "credit", title: "Photo Credit", type: "string" }),
      ],
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          if (!ctx.document?.published) return true;
          return val ? true : "Cover image is required before publishing";
        }),
      group: "media",
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          if (!ctx.document?.published) return true;
          return val ? true : "Author is required before publishing";
        }),
      group: "quick",
    }),
    defineField({
      name: "date",
      title: "Published Date",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      group: "quick",
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      validation: (Rule) =>
        Rule.max(300).custom((val, ctx) => {
          if (!ctx.document?.published) return true;
          return val ? true : "Summary is required before publishing";
        }),
      group: "quick",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      group: "quick",
    }),
    defineField({
      name: "players",
      title: "Related Players",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "player" }],
          options: { disableNew: false },
        },
      ],
      description: "Associate one or more players mentioned in this article for richer linking & filtering.",
      options: { layout: "tags" },
      group: "quick",
    }),
    defineField({
      name: "teams",
      title: "Teams",
      type: "array",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
      options: { layout: "tags" },
      components: { input: TeamTagsInput },
      description: "Pick the team tags (32 NFL teams) for precise team pages/search. Uses your existing Tag docs.",
      validation: (Rule) => Rule.unique().error("Team tag already added"),
      group: "quick",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "LEGACY free-form tags. Use Tag References below for new content.",
      validation: (Rule) => Rule.unique().error("Tag already added"),
      readOnly: true,
      hidden: ({ document }) => !Array.isArray(document?.tags) || document.tags.length === 0,
      group: "quick",
    }),
    defineField({
      name: "tagRefs",
      title: "Tag References (Advanced)",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "advancedTag" }],
        },
      ],
      options: { layout: "tags" },
      group: "advanced",
      description: "Canonical tag references (preferred). Migration will copy legacy string tags here. Editing a tag document changes it everywhere; add a new Tag doc for one-off labels.",
      validation: (Rule) =>
        Rule.unique()
          .min(3)
          .max(6)
          .warning("Recommended: add 3–6 canonical tags for best internal linking"),
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: false,
      group: "quick",
    }),
    defineField({
      name: "body",
      title: "Body Content",
      type: "blockContent",
      group: "quick",
    }),
    defineField({
      name: "youtubeVideoId",
      title: "YouTube Video ID or URL",
      type: "string",
      description:
        "Paste either the 11-character ID or a full YouTube link (watch/shorts/youtu.be). We'll extract the ID automatically.",
      validation: (Rule) =>
        Rule.custom((val) => {
          if (!val) return true;
          const raw = String(val).trim();
          if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return true;
          try {
            const url = new URL(raw);
            const v = url.searchParams.get("v");
            if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return true;
            if (/\/(shorts|embed|live)\/[a-zA-Z0-9_-]{11}/.test(url.pathname)) return true;
            if (url.hostname.toLowerCase().endsWith("youtu.be")) {
              const id = url.pathname.split("/").filter(Boolean)[0];
              if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return true;
            }
          } catch {
            // ignore
          }
          return "Enter a valid YouTube ID or URL";
        }),
      group: "embeds",
    }),
    defineField({
      name: "videoTitle",
      title: "Video Title",
      type: "string",
      description: "Optional: Custom title for the video embed",
      hidden: ({ document }) => !document?.youtubeVideoId,
      group: "embeds",
    }),
    defineField({
      name: "twitterUrl",
      title: "Twitter/X Post URL",
      type: "url",
      description: "Enter the full Twitter/X post URL (e.g., https://twitter.com/user/status/1234567890)",
      validation: (Rule) =>
        Rule.uri({ scheme: ["https"], allowRelative: false }).custom((url) => {
          if (!url) return true;
          const isValidTwitterUrl = /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(url);
          return isValidTwitterUrl || "Must be a valid Twitter/X post URL";
        }),
      group: "embeds",
    }),
    defineField({
      name: "twitterTitle",
      title: "Twitter Embed Title",
      type: "string",
      description: "Optional: Custom title for the Twitter embed",
      hidden: ({ document }) => !document?.twitterUrl,
      group: "embeds",
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram Post URL",
      type: "url",
      description:
        "Public Instagram post / reel URL (e.g. https://www.instagram.com/p/XXXXXXXXXXX/ or /reel/)",
      validation: (Rule) =>
        Rule.uri({ scheme: ["https"] }).custom((url) => {
          if (!url) return true;
          const ok = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/.test(url);
          return ok || "Must be a valid Instagram post, reel, or IGTV URL";
        }),
      group: "embeds",
    }),
    defineField({
      name: "instagramTitle",
      title: "Instagram Embed Title",
      type: "string",
      hidden: ({ document }) => !document?.instagramUrl,
      group: "embeds",
    }),
    defineField({
      name: "tiktokUrl",
      title: "TikTok Video URL",
      type: "url",
      description: "TikTok video URL (e.g. https://www.tiktok.com/@user/video/1234567890123456789)",
      validation: (Rule) =>
        Rule.uri({ scheme: ["https"] }).custom((url) => {
          if (!url) return true;
          const ok = /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/[0-9]+\/?/.test(url);
          return ok || "Must be a valid TikTok video URL";
        }),
      group: "embeds",
    }),
    defineField({
      name: "tiktokTitle",
      title: "TikTok Embed Title",
      type: "string",
      hidden: ({ document }) => !document?.tiktokUrl,
      group: "embeds",
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      description:
        "(Legacy - optional) Lower numbers show first. NEW: Use 'Homepage Settings' > 'Pinned Headlines' to control homepage ordering without renumbering.",
      validation: (Rule) => Rule.min(1).max(100),
      group: "advanced",
    }),
  ],
  groups: [
    { name: "quick", title: "Quick Publish" },
    { name: "media", title: "Media" },
    { name: "embeds", title: "Embeds" },
    { name: "seo", title: "SEO" },
    { name: "power", title: "Power Rankings" },
    { name: "advanced", title: "Advanced" },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "author.name",
      media: "coverImage",
    },
  },
});
