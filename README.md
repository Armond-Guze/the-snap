# The Snap

NFL-first publishing platform for headlines, team hubs, schedules, standings, and rankings.

## Private Repository Notice

This repository is intended to remain private. It contains proprietary product code, internal workflows, and paid data integration patterns.

- Allowed: authorized collaborators working on The Snap.
- Not allowed: sharing source code, screenshots of internal tooling, secrets, or paid API responses outside the team.

If you need to lock visibility on GitHub:
`Settings -> General -> Danger Zone -> Change repository visibility -> Private`

## Product Overview

The Snap is a modern sports media app focused on:

- fast headline publishing
- article and ranking pages with SEO metadata
- team hub pages and team-specific navigation
- schedule, standings, and related NFL data views
- mobile-first UI for daily news consumption

## Current Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Sanity CMS + next-sanity
- Clerk authentication
- Prisma
- Vercel Analytics + Speed Insights
- SportsDataIO (with ESPN fallback paths in data services)

## Repository Structure

```text
the-snap/
├── app/                    # Next.js routes, API endpoints, UI components
├── lib/                    # shared utilities, API/data clients, SEO helpers
├── sanity/                 # Sanity config and schema setup
├── prisma/                 # Prisma schema and generated client config
├── scripts/                # migration, seeding, and sync scripts
├── public/                 # static assets
└── .github/workflows/      # CI pipelines
```

## Local Development

### Prerequisites

- Node.js 20+
- npm
- Sanity project access
- Clerk project access (for auth-enabled flows)

### Setup

```bash
git clone <private-repo-url>
cd the-snap
npm install
```

Create `.env.local` with the required values for your environment.

### Start

```bash
npm run dev
```

App runs on [http://localhost:3000](http://localhost:3000).

## Environment Variables

Do not commit secrets. Keep sensitive values in `.env.local` (local) and provider secret stores (production).

Common variables used by this app:

```bash
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
NEXT_PUBLIC_SANITY_API_VERSION=
SANITY_API_TOKEN=
SANITY_WRITE_TOKEN=
SANITY_API_WRITE_TOKEN=

# Site / SEO
NEXT_PUBLIC_SITE_URL=https://thegamesnap.com
SITE_URL=https://thegamesnap.com

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=

# Revalidation / webhooks
SANITY_WEBHOOK_SECRET=
REVALIDATE_SECRET=
SYNC_CRON_SECRET=
SANITY_STANDINGS_REVALIDATE_SECRET=

# NFL data
SPORTSDATA_ENABLED=true
SPORTSDATA_API_KEY=
NFL_SEASON=2026
NFL_SYNC_MODE=in-season

# Optional analytics / ads
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_ADS_ENABLED=false
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=
NEXT_PUBLIC_ADSENSE_SLOT_ID=
NEXT_PUBLIC_ADSENSE_NAVBAR_SLOT_ID=
NEXT_PUBLIC_ADSENSE_FOOTER_SLOT_ID=
```

## Scripts

### Core

- `npm run dev` - start local development server
- `npm run build` - production build (`prisma generate` + Next build)
- `npm run start` - run production server
- `npm run lint` - run ESLint

### Prisma

- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:deploy`
- `npm run db:studio`

### Content / Sync utilities

- `npm run sync:games`
- `npm run backfill:tagRefs`
- `npm run backfill:tagRefs:dry`
- `npm run seed:primetime`
- `npm run seed:topic-hubs`

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

Pipeline stages:

1. `checks` (lint + typecheck)
2. `unit_tests` (auto-runs only if `test:unit` script exists)
3. `integration_tests` (auto-runs only if `test:integration` script exists)
4. `build`

## Deployment Notes

- Primary deployment target is Vercel.
- Ensure all production secrets are set in your deployment environment before build.
- Sanity webhook and revalidation secrets must match between Sanity and the deployed app.
- This repo is configured to deploy production automatically after CI passes on `main`/`master` via `.github/workflows/deploy-production.yml`.
- Local one-command production deploy:
  - `npm run deploy` (alias of `npm run deploy:prod`)
- Required GitHub secrets for auto production deploy:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

## Security and Legal

- Use licensed images and media only.
- Never copy copyrighted content verbatim without rights or permission.
- Rotate leaked or exposed credentials immediately.
- Review third-party terms before enabling monetization, scraping, or syndication.

## Team Guidelines

- Keep UI changes mobile-safe and test on small screens.
- Preserve canonical URLs and metadata behavior for SEO.
- Prefer typed server-side data access and parameterized queries.
- Keep commits focused and include validation commands in commit messages.

## Ownership

Proprietary software. All rights reserved by The Snap.
