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

    // SEO Fields Group
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "object",
      group: "seo",
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
          description: "SEO title for search engines (50-60 characters recommended)",
          validation: (Rule) => Rule.max(60).warning("Keep under 60 characters for best SEO"),
        }),
        defineField({
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
          rows: 3,
          description: "SEO description for search engines (150-160 characters recommended)",
          validation: (Rule) => Rule.max(160).warning("Keep under 160 characters for best SEO"),
        }),
        defineField({
          name: "focusKeyword",
          title: "Focus Keyword",
          type: "string",
          description: "Primary keyword you want to rank for (auto-generated from tags/category, or customize)",
        }),
        defineField({
          name: "additionalKeywords",
          title: "Additional Keywords",
          type: "array",
          of: [{ type: "string" }],
          description: "Secondary keywords to target (auto-generated from tags/category, or customize)",
        }),
        defineField({
          name: "ogTitle",
          title: "Open Graph Title",
          type: "string",
          description: "Title for social media sharing (leave blank to use meta title)",
        }),
        defineField({
          name: "ogDescription",
          title: "Open Graph Description",
          type: "text",
          rows: 2,
          description: "Description for social media sharing (leave blank to use meta description)",
        }),
        defineField({
          name: "ogImage",
          title: "Open Graph Image",
          type: "image",
          description: "Image for social media sharing (1200x630px recommended)",
          options: { hotspot: true },
        }),
        defineField({
          name: "noIndex",
          title: "No Index",
          type: "boolean",
          description: "Prevent search engines from indexing this page",
          initialValue: false,
        }),
        defineField({
          name: "canonicalUrl",
          title: "Canonical URL",
          type: "url",
          description: "Override the canonical URL (leave blank for auto-generated)",
        }),
      ],
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
      name: "tags",
      title: "Tags",
      type: "array",
      of: [
        {
          type: "string"
        }
      ],
      options: {
        layout: 'tags'
      },
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
      validation: (Rule) => Rule.regex(/^[a-zA-Z0-9_-]{11}$/, {
        name: "YouTube Video ID",
        invert: false
      }).error("Must be a valid 11-character YouTube video ID")
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
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      description: "Lower numbers show first (e.g., 1 is the top story)",
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: "viewCount",
      title: "View Count",
      type: "number",
      description: "Number of times this article has been viewed (automatically tracked)",
      initialValue: 0,
      readOnly: true,
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
