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
