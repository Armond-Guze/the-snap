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
|-- app/                    # Next.js routes, API endpoints, UI components
|-- lib/                    # shared utilities, API/data clients, SEO helpers
|-- sanity/                 # Sanity config, schema, and Studio setup
|-- prisma/                 # Prisma schema and migrations
|-- scripts/                # content, audit, seeding, and sync scripts
|-- public/                 # static assets
`-- .github/workflows/      # CI and production deployment pipelines
```

## Local Development

### Prerequisites

- Node.js 22 (`.nvmrc` pins 22.16.0; `package.json` supports `>=22.16 <23`)
- npm
- Sanity project access
- Clerk project access (for auth-enabled flows)

### Setup

Start the local preview with `npm run dev`. This command includes Node's
`--use-system-ca` option so HTTPS requests to Sanity can use trusted certificates
from the operating system as well as Node's bundled certificates. Certificate
verification stays enabled. Running `next dev` directly skips this setting and
can cause `UNABLE_TO_VERIFY_LEAF_SIGNATURE` errors on this machine, preventing
the homepage and footer from rendering. Restart the server after changing the
startup command.

The launcher uses the Node executable that started npm. This prevents a `node`
package in an ancestor `node_modules/.bin` directory from silently selecting an
older runtime. It checks the supported Node version before starting Next.js.

```bash
git clone <private-repo-url>
cd the-snap
npm install
```

Copy `.env.example` to `.env.local`, then provide the values required for the
features you are running. Never put real credentials in `.env.example`.

### Start

```bash
npm run dev
```

App runs on [http://localhost:3000](http://localhost:3000).

## Environment Variables

Do not commit secrets. Keep sensitive values in `.env.local` (local) and provider secret stores (production).

The authoritative variable inventory and feature-specific requirements are in
`.env.example`. For a production rollout, verify at least these groups:

- public site, Sanity read, Clerk, and PostgreSQL settings;
- an admin policy (`ADMIN_USER_IDS`, or roles paired with allowed organization IDs);
- `SANITY_WEBHOOK_SECRET`, configured as the matching Sanity webhook signing secret;
- `CRON_SECRET` for both Vercel cron routes;
- newsletter signing and Resend delivery settings if signup is enabled;
- a dedicated `ANALYTICS_HMAC_SECRET` if first-party analytics is enabled.

Keep advertising disabled with `NEXT_PUBLIC_ADS_ENABLED=false`. The built-in
consent controls are not a Google-certified CMP; do not enable AdSense until an
approved CMP and the applicable legal/business review are complete.

## Scripts

### Core

- `npm run dev` - start local development server
- `npm run build` - production build (`prisma generate` + Next build)
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript without emitting files
- `npm test` - run unit and integration suites

### Prisma

- `npm run db:generate`
- `npm run db:migrate` - create/apply development migrations using `.env.local`
- `npm run db:deploy` - apply existing migrations locally using `.env.local`
- `npm run db:deploy:ci` - apply existing migrations from the process environment
- `npm run db:studio`

### Content / Sync utilities

- `npm run sync:games`
- `npm run backfill:tagRefs`
- `npm run backfill:tagRefs:dry`
- `npm run seed:primetime`
- `npm run seed:topic-hubs`

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

The workflow runs on pushes and pull requests targeting `main`, plus manual
dispatches. Its single `validate` job runs these steps in order:

1. validate required public GitHub repository variables;
2. `npm ci`;
3. lint and typecheck;
4. unit and integration tests;
5. the production build.

Configure these GitHub repository variables for CI:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- optionally `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, and
  `NEXT_PUBLIC_SITE_URL` to override their workflow defaults.

## Deployment Notes

- The primary deployment target is Vercel. The gated GitHub Actions release
  branch is `main`; `master` is not included in this workflow.
- `.github/workflows/deploy-production.yml` runs automatically only after a
  successful same-repository `push` CI run on `main`. It verifies that the
  validated SHA is still current, applies Prisma migrations, then deploys that
  revision. Manual dispatch is also limited to `main`.
- Required GitHub production secrets are `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
  `VERCEL_PROJECT_ID`, `DATABASE_URL`, and `DATABASE_URL_UNPOOLED`.
- Runtime/build variables from `.env.example` must also be configured in the
  Vercel project for the production environment. Sanity, Clerk, and cron/webhook
  secrets must match the corresponding provider configuration.
- The workflow does not disable Vercel's separate Git integration. Reconcile any
  `master`/`main` divergence before changing the Vercel project branch, then
  disable Vercel Git production auto-deploys (or otherwise gate them) so they do
  not bypass the validated GitHub Actions deployment path.
- `npm run deploy` is an alias of `npm run deploy:prod`; it deploys directly and
  does **not** apply database migrations first.

## Database Rollout

`prisma migrate deploy` applies migrations in directory-name order. The current
history is:

1. `20260220123000_init_user_accounts`
2. `20260220154605_auth_hardening`
3. `20260809090000_private_newsletter_subscribers`
4. `20260809103000_durable_first_party_analytics`

Apply both 2026-08-09 migrations before enabling the new newsletter or
first-party analytics paths. The newsletter migration intentionally does not
copy or delete legacy Sanity subscriber documents; that data move/removal is a
separate, explicitly authorized production operation.

## Scheduled Jobs

`vercel.json` intentionally uses two cron entries to stay within the Vercel
Hobby-plan limit:

- `/api/seo/gsc-audit` at `13:20 UTC` daily;
- `/api/maintenance/daily` at `04:00 UTC` daily, consolidating team-record sync,
  analytics retention, expired newsletter-confirmation cleanup, and webhook-log
  retention.

Both routes require Vercel's `Authorization: Bearer <CRON_SECRET>` request.
The Search Console job also needs the `GSC_*` service-account configuration.

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
