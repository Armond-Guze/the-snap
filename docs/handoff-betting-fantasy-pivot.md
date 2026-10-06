# Handoff: betting + fantasy pivot (written Oct 6, 2026)

Read this first in a new session. Owner: Armond. Goal: grow The Snap (thegamesnap.com) to ad revenue and
sportsbook/fantasy affiliate income. Strategy: stop rewriting general NFL news; focus on betting education and
fantasy football tools; build a newsletter. Context: Search Console showed ~6 clicks per 3 months, so traffic and
content quality come before monetization. See `docs/article-growth-audit-2026-07.md`.

## Already done and merged to master
- PR 3: sitemap fixes (no redirecting URLs, 30-min revalidate, real lastmod, `/calendar` and `/tankathon` added),
  `/admin` restricted to `ADMIN_USER_IDS` (Clerk user IDs), proxy matcher fix.
- PR 4: newsletter signup on article pages with source tracking and optional Beehiiv sync; old odds guide 301s to
  `/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more`; nav is Fantasy, Betting, News,
  Standings, Schedule; new `/betting` hub; homepage refocused; importer (`scripts/import-latest-nfl-headline.mjs`)
  only drafts betting/fantasy-relevant stories (`NFL_IMPORT_ALLOW_GENERAL=1` disables the gate).

## On branch `claude/dreamy-babbage-ltddj5` (check whether it has been merged)
- New article fields `contentDisclosure` and `lastReviewedAt`, rendered on article pages.
- `betting` added to reserved topic-hub slugs.
- `scripts/seed-advanced-tags-betting-fantasy.ndjson` (19 tags).
- `docs/betting-odds-guide-refresh.md`: full body outline and fields for refreshing the canonical odds guide.
- AGENTS.md: "Betting and fantasy content standards".

## Not done (needs the user's Sanity access or browser)
Cloud sessions have no Sanity token and cannot reach thegamesnap.com, so no live Sanity content was edited.
In Sanity Studio (thegamesnap.com/studio):
1. Import tags: `npx sanity dataset import scripts/seed-advanced-tags-betting-fantasy.ndjson production --missing`
   (or create them by hand under Canonical Tags).
2. Create a `betting` Topic Hub.
3. Refresh the canonical odds guide from `docs/betting-odds-guide-refresh.md`. Keep the existing slug, set a named
   author, Disclosure = Betting, Last Reviewed, tags, internal links. Do not publish without the user's OK.
4. Create named Author profiles; set `author` on key pages.
5. Later: improve other priority pages (fantasy strength of schedule, RB tiers, salary cap, franchise tag, MVP odds).

## User to-do
- Set `ADMIN_USER_IDS` in Vercel (Clerk user ID, starts with `user_`); without it `/admin` 404s in production.
- Beehiiv: create an account, set `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID`; make sure `SANITY_WRITE_TOKEN` is set;
  write the welcome email.
- After deploy: resubmit `sitemap.xml` in Search Console.
- Apply to AdSense/managed ad networks only after ~10k monthly pageviews (managed networks ~25-50k).

## Notes
- Browser control failed in the first session (no browser tools; `ccd_session` MCP failed to connect). Start a new
  session from the Claude desktop app Code tab on this repo, or use Claude in Chrome.
- Builds/typecheck: only Prisma-client errors appear without `prisma generate`; lint passed on changed files.
- Follow AGENTS.md: no `slug` field in article packages, real H2/H3 blocks, Data Table blocks, URL mark links.
