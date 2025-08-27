import { defineType, defineField } from "sanity";

const headlineType = defineType({
  name: "headline",
  title: "Headlines",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().min(5).max(120),
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
            .replace(/'|'|"|"/g, "'") // replace curly quotes
            .replace(/[^\w\s-]/g, "") // remove punctuation
            .replace(/\s+/g, "-") // replace spaces with dashes
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),

    // Consolidated SEO object (auto generation supported via seoType)
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      initialValue: { autoGenerate: true },
      options: { collapsible: true, collapsed: false }
    }),

    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
    }),
    defineField({
      name: "date",
      title: "Published Date",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: 'players',
      title: 'Related Players',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'player' }],
          options: { disableNew: false }
        }
      ],
      description: 'Associate one or more players mentioned in this headline for richer linking & filtering.',
      options: { layout: 'tags' }
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [ { type: "string" } ],
      options: { layout: 'tags' },
      description: "Enter relevant tags for this article (one per line)"
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "body",
      title: "Body Content",
      type: "blockContent",
    }),
    defineField({
      name: "youtubeVideoId",
      title: "YouTube Video ID",
      type: "string",
      description: "Enter the YouTube video ID (e.g., 'dQw4w9WgXcQ' from https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
      validation: (Rule) => Rule.regex(/^[a-zA-Z0-9_-]{11}$/, { name: "YouTube Video ID", invert: false }).error("Must be a valid 11-character YouTube video ID")
    }),
    defineField({
      name: "videoTitle",
      title: "Video Title",
      type: "string",
      description: "Optional: Custom title for the video embed",
      hidden: ({ document }) => !document?.youtubeVideoId,
    }),
    // Twitter/X Embed Fields
    defineField({
      name: "twitterUrl",
      title: "Twitter/X Post URL",
      type: "url",
      description: "Enter the full Twitter/X post URL (e.g., https://twitter.com/user/status/1234567890)",
      validation: (Rule) => Rule.uri({
        scheme: ['https'],
        allowRelative: false
      }).custom((url) => {
        if (!url) return true; // Allow empty
        const isValidTwitterUrl = /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(url);
        return isValidTwitterUrl || 'Must be a valid Twitter/X post URL';
      })
    }),
    defineField({
      name: "twitterTitle",
      title: "Twitter Embed Title",
      type: "string",
      description: "Optional: Custom title for the Twitter embed",
      hidden: ({ document }) => !document?.twitterUrl,
    }),
    // Instagram Embed Fields
    defineField({
      name: 'instagramUrl',
      title: 'Instagram Post URL',
      type: 'url',
      description: 'Public Instagram post / reel URL (e.g. https://www.instagram.com/p/XXXXXXXXXXX/ or /reel/)',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).custom(url => {
        if (!url) return true;
        const ok = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/.test(url);
        return ok || 'Must be a valid Instagram post, reel, or IGTV URL';
      })
    }),
    defineField({
      name: 'instagramTitle',
      title: 'Instagram Embed Title',
      type: 'string',
      hidden: ({ document }) => !document?.instagramUrl,
    }),
    // TikTok Embed Fields
    defineField({
      name: 'tiktokUrl',
      title: 'TikTok Video URL',
      type: 'url',
      description: 'TikTok video URL (e.g. https://www.tiktok.com/@user/video/1234567890123456789)',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).custom(url => {
        if (!url) return true;
        const ok = /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/[0-9]+\/?/.test(url);
        return ok || 'Must be a valid TikTok video URL';
      })
    }),
    defineField({
      name: 'tiktokTitle',
      title: 'TikTok Embed Title',
      type: 'string',
      hidden: ({ document }) => !document?.tiktokUrl,
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
  description: "(Legacy - optional) Lower numbers show first. NEW: Use 'Homepage Settings' > 'Pinned Headlines' to control homepage ordering without renumbering.",
  validation: (Rule) => Rule.min(1).max(100),
    }),
  ],
  groups: [
    {
      name: "seo",
      title: "SEO",
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "author.name",
      media: "coverImage",
    },
  },
});

export default headlineType;
