# The Snap Codex Context

This repository is a Next.js app with an embedded Sanity Studio and editorial workflows for NFL coverage.

## Core project facts

- Frontend: `Next.js` app in `app/`
- CMS: `Sanity Studio` in `sanity/`
- Sanity config: `sanity.config.ts`
- Sanity structure: `sanity/structure.ts`
- Primary schema for site content: `sanity/schemaTypes/article.ts`
- Shared frontend utilities: `lib/`
- One-off data/content scripts: `scripts/`

## Sanity content model

- Main editorial content lives in `_type == "article"`
- Use `format` to determine the subtype
- Common article formats:
  - `headline`
  - `feature`
  - `fantasy`
  - `analysis`
  - `ranking`
  - `powerRankings`

## Standard article checklist

When creating or updating an article in Sanity, prefer this field set:

- `title`
- `homepageTitle` for shorter homepage display text
- `slug`
- `seo`
- `coverImage`
- `author`
- `date`
- `summary`
- `category`
- `players`
- `teams` for NFL team tag references
- `topicHubs`
- `tagRefs` for canonical advanced tags
- `published`
- `body`

Important rules:

- Team references use `_type == "tag"` docs
- Canonical topic tags use `_type == "advancedTag"` in `tagRefs`
- `tagRefs` should usually contain `3–6` tags
- Do not stuff extra text into reference objects
- `homepageTitle` should stay concise
- When returning article packages for editorial use, do not output a `slug` field; Sanity auto-generates it from `title`
- Betting or fantasy evergreen pieces do not need a new top-level category just because of the angle; use the existing category structure plus `topicHubs` and `tagRefs`

## Current Sanity article behavior

- Sanity body paste does **not** auto-convert Markdown heading syntax like `##` or Markdown links like `[text](url)`
- Major article sections should be real `H2` blocks in Sanity
- FAQ questions and Key Terms entries should usually be real `H3` blocks in Sanity
- Comparison content such as odds, rankings, or glossary-style matrices should use the `Data Table` block instead of stacked plain text
- Internal links should be added through the Sanity `URL` mark UI using link text plus URL, not by pasting raw URLs into the body
- Before considering an article finished, verify there are no duplicate paragraphs, stray markdown markers, or heading lines still stored as normal paragraphs

## Current article image behavior

- Shared article hero images on article, headline, fantasy, and ranking pages now use a contained presentation so infographic-style images do not get cropped
- Inline Portable Text images also favor contained presentation
- Image ideas should still be landscape-friendly, but they no longer need to assume aggressive cover-style cropping

## Power rankings workflow

Power rankings are also `article` documents, using:

- `format = "powerRankings"`
- `rankingType = "live"` or `rankingType = "snapshot"`

Important fields:

- `seasonYear`
- `weekNumber` or `playoffRound`
- `rankings`
- `rankingIntro`
- `rankingConclusion`
- `biggestRiser` and `biggestFaller` are helper fields
- `editorialStatus`

Important rules:

- Snapshot docs can use `playoffRound = "OFF"` for offseason
- Published power rankings require both top-level intro and conclusion
- Use the Studio actions/plugins for:
  - duplicate last week
  - snapshot from live
  - SEO regeneration

## Key article / page expectations

- Keep writing direct and clean
- Favor short, specific homepage titles
- For SEO work, preserve canonical URLs and avoid unnecessary slug churn
- For power rankings requests, include intro and conclusion, not just team entries

## Useful commands

- Install deps: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Deploy prod: `npm run deploy:prod`

## Useful data/content scripts

- `npm run seed:topic-hubs`
- `npm run seed:primetime`
- `npm run backfill:tagRefs`

## What Codex should do by default in this repo

- Read schema/structure before changing Sanity workflows
- Prefer updating shared components instead of page-by-page duplication
- Treat editorial and Sanity tasks as first-class work in this project
- When asked to create or rewrite articles, align output to the `article` schema and the site’s current publishing flow

## Betting and fantasy content standards

The site focuses on betting education and fantasy football tools. For this content:

- Set `contentDisclosure` (Betting / Affiliate / both) on every betting or sportsbook page; it renders the required 21+ and affiliate notices.
- Set `lastReviewedAt` whenever a page is meaningfully refreshed.
- Tag with `tagRefs` from the betting and fantasy seed files (`scripts/seed-advanced-tags-*.ndjson`) and with the `betting` or fantasy topic hubs. `/betting` is a reserved root route, so it must not be a `topicHub` page.
- One canonical page per intent; consolidate and 301 duplicates instead of publishing near-copies.
- Use Data Table blocks for odds, tiers and comparisons, with worked examples and a stated methodology.
- Use a named author; keep content educational, avoid guaranteed-outcome language, and never publish a pick without reasoning.
- Importer drafts are limited to betting/fantasy-relevant stories and stay unpublished and noindexed until a human adds original value.

