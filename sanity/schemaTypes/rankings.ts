import { defineField, defineType } from "sanity";
import { apiVersion } from "../env";

// Articles schema mirrors Headlines fields for identical editing experience
export default defineType({
  name: "rankings",
  title: "Articles",
  type: "document",
  fields: [
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
      validation: (Rule) => Rule.max(300),
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
      description: "Associate one or more players mentioned in this feature for richer linking & filtering.",
      options: { layout: "tags" },
      group: "quick",
    }),
    defineField({
      name: "teams",
      title: "Teams",
      type: "array",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
      options: { layout: "tags" },
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
      readOnly: true,
      hidden: ({ document }) => !document?.tags?.length,
      group: "quick",
    }),
    defineField({
      name: "tagRefs",
      title: "Tag References (Advanced)",
      type: "array",
      of: [{ type: "reference", to: [{ type: "advancedTag" }] }],
      options: { layout: "tags" },
      group: "advanced",
      description: "Canonical tag references (preferred). Migration will copy legacy string tags here.",
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
