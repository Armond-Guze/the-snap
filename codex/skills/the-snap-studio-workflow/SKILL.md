---
name: the-snap-studio-workflow
description: Use this skill for The Snap project when working on Sanity Studio schemas, article publishing workflows, topic hubs, tags, power rankings, or when creating article-ready content and rewrites for the site.
---

# The Snap Studio Workflow

Use this skill when the request is about:

- Sanity Studio structure or schema changes
- article creation or article field mapping
- rewriting or rewording article copy for The Snap
- power rankings workflows
- topic hubs, tags, team refs, or canonical tag refs
- editorial content shaped specifically for The Snap

## Quick start

1. Read `AGENTS.md` in the repo root
2. For schema or workflow changes, inspect:
   - `sanity/schemaTypes/article.ts`
   - `sanity/structure.ts`
   - relevant files in `sanity/plugins/`
3. For article tasks, use the checklist in `references/editorial.md`
4. For article-writing structure, formatting, internal-linking, and output order, use `references/article-writer-guide.md`
5. For power rankings tasks, use the checklist in `references/power-rankings.md`
6. For rewrite tasks, use:
   - `references/headlines-rewrite.md`
   - `references/power-rankings-rewrite.md`
   - `references/topic-list.md`

## Important project rules

- Main content type is `article`
- Team refs use `_type == "tag"`
- Canonical tag refs use `_type == "advancedTag"` in `tagRefs`
- Power rankings are `article` docs with `format == "powerRankings"`
- Published power rankings require `rankingIntro` and `rankingConclusion`

## When writing article-ready content

- Prefer direct, publishable prose
- Keep `homepageTitle` shorter than the full title
- Provide a usable slug idea
- Think in terms of article schema fields, not just raw copy

## Rewrite behavior

- For standard NFL news/article rewrites, follow `references/headlines-rewrite.md`
- For power rankings rewrites, follow `references/power-rankings-rewrite.md`
- When tags are needed, use `references/topic-list.md` as a starting point and keep output specific
- Power rankings rewrites must always include top-level intro and top-level conclusion fields

## References

- Read `references/editorial.md` for standard article workflow
- Read `references/article-writer-guide.md` for full article-writing rules, formatting, internal-linking, and Sanity-ready output structure
- Read `references/power-rankings.md` for rankings-specific workflow
- Read `references/headlines-rewrite.md` for headline/news rewrite format
- Read `references/power-rankings-rewrite.md` for rankings rewrite format
- Read `references/topic-list.md` for common tag / topic choices
