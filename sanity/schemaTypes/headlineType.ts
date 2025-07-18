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

    // SEO Settings - Simplified
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "simplifiedSeo",
      group: "seo",
      description: "SEO fields auto-generate from title and content. Only fill if you want custom values.",
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
