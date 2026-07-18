# The Snap Search Growth Roadmap

Last updated: July 18, 2026

## Goal

Build The Snap into a durable NFL publication that earns search traffic through technically clean pages, differentiated editorial coverage, strong internal discovery, and recognizable expertise. The objective is compounding growth over years, not short-term traffic tricks.

## Working baseline

These figures are the starting point captured from Google Search Console and the site audit. They should be updated after each monthly review.

| Metric | Baseline |
| --- | ---: |
| Search clicks, last 28 days | 0 |
| Search clicks, last 3 months | 6 |
| Search impressions, last 3 months | 11,966 |
| Average position, last 3 months | About 62 |
| Indexed pages | 44 |
| Not-indexed pages | 302 |
| Published article documents found in the audit | 134 |
| External links reported by Search Console | 0 |

The large excluded-page count is not automatically a 302-page emergency. Many exclusions can be intentional redirects, duplicates, parameter URLs, or alternate canonical pages. The durable target is for every valuable canonical URL to be indexable and for low-value URL variants to remain out of the index.

## Iteration 1: technical indexing foundation

Status: deployed and production-verified on July 18, 2026.

- Replaced the redirecting power-rankings root with a stable, indexable 200-status hub.
- Converted legacy aliases to permanent redirects and kept canonical destination URLs stable.
- Removed redirect-only power-ranking article documents from the sitemap.
- Limited the sitemap to canonical 200-status pages and meaningful editorial modification dates.
- Changed missing ranking snapshots from soft-404 pages to real 404 responses.
- Added server-rendered `WebSite`, `Organization`, `NewsArticle`, and rankings `ItemList` structured data.
- Removed the nonexistent site-search action from structured data.
- Corrected publisher logo, organization identity, social profiles, and organization bylines.
- Added an editor-controlled substantive-update date rather than treating routine CMS writes as article updates.
- Prevented new article-body H1 headings and safely renders legacy body H1 blocks as H2.
- Removed the production-build dependency on Google Fonts and switched to a stable system font stack.
- Verified all 220 sitemap URLs return 200 in the production build.

### Post-deploy validation

Completed on July 18:

- Submitted `https://thegamesnap.com/sitemap.xml` in Search Console.
- Inspected the homepage, power-rankings hub, a ranking snapshot, the fifth-year-option guide, and the primary betting guide.
- Verified all 220 sitemap URLs returned 200 immediately after deployment.
- Requested indexing selectively for the changed priority hub instead of mass-submitting URLs.

Still required: recheck indexed pages, discovered/crawled-not-indexed counts, impressions, and queries after 2, 4, and 8 weeks.

## Iteration 2: content quality and consolidation

Status: in progress. The first high-confidence consolidation was completed and production-verified on July 18, 2026.

The next priority is improving what Google and readers find after the technical crawl path is clean.

- Inventory every published article by target query, format, traffic, impressions, freshness, and overlap.
- Consolidate competing betting-explainer pages into one definitive guide per search intent.
- Select the strongest 15–20 evergreen opportunities and substantially improve them first.
- Add original analysis, examples, tables, definitions, expert context, and named sources where useful.
- Redirect clearly redundant pages to the strongest canonical page instead of leaving near-duplicates live.
- Refresh outdated claims and use the substantive-update date only when the reader-facing content materially changes.
- Create an editorial brief and quality gate so new posts have a clear query, angle, evidence plan, and internal-link plan before publication.

### First consolidation completed

- Retained `/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more`, which had 6,742 impressions and one click in the three-month Search Console window.
- Merged the strongest sections from the competing 392-impression guide into the retained URL.
- Expanded the retained guide from 81 to 140 Portable Text blocks and from about 6,100 to about 9,500 text characters.
- Reworked its title, summary, headings, search metadata, internal hub link, and substantive-update date.
- Unpublished the redundant document without deleting it and added its slug to the retained article's redirect history.
- Verified the retired URL returns a permanent 308 redirect, the retained URL is index/follow with a self-canonical, and only the retained URL appears in the sitemap.

### Second improvement batch completed

- Repaired the empty schedule experience and published a validated 272-game 2026 regular-season dataset.
- Rebuilt the root and Week 1–18 schedule templates with season-specific metadata, accurate flexible-game handling, working timezone changes, and shared UI.
- Fixed the standings-season lookup that was silently falling back to the calendar year. The final 2025 records are now labeled 2025 rather than 2026.
- Added ties, last-updated context, an accuracy note about official tiebreakers, structured data, and useful schedule/team links to the standings page.
- Improved the two highest-impression NFL rules explainers: salary cap (672 impressions) and franchise tag (499 impressions).
- Added manual intent-aligned metadata and primary NFL Football Operations references to both guides; removed duplicated franchise-tag copy and added an FAQ plus a related salary-cap link.
- Added guarded, repeatable scripts for future schedule syncs and evergreen-guide maintenance.
- Full lint, TypeScript, and 150-page production build completed successfully.

## Iteration 3: topic architecture and internal links

- Define a small set of priority franchises such as NFL rules, betting education, fantasy, draft, schedule, standings, and power rankings.
- Turn topic hubs into curated guides with original introductions, subtopic sections, and deliberate article ordering.
- Add contextual links inside article bodies, not only cards at the bottom of pages.
- Ensure every important article receives links from a hub and from at least two closely related articles.
- Audit team, category, tag, and topic-hub taxonomies so each concept has one canonical destination.
- Keep filter, pagination, and parameter combinations from creating crawlable duplicate spaces.

## Iteration 4: trust, authorship, and editorial transparency

- Publish complete author pages with real biographies, areas of expertise, credentials or experience, and social/profile links.
- Add editorial standards, sourcing, corrections, ownership, and contact information that matches actual practice.
- Use named human authors when a person wrote the story; reserve the organization byline for true staff/editorial work.
- Add citations and primary-source links for rules, transactions, statistics, injuries, and other factual claims.
- Make update notes visible when a material correction or major refresh changes an article.

## Iteration 5: metadata and publishing guardrails

- Rewrite titles and descriptions for priority pages using one clear intent and a specific reader benefit.
- Keep homepage titles short while preserving descriptive SEO titles.
- Add Sanity validations for missing summaries, authors, cover images, categories, canonical tags, and incomplete SEO fields.
- Add a pre-publish checklist for uniqueness, sourcing, internal links, image rights, headings, and schema-critical fields.
- Prevent unnecessary slug changes and record all legitimate old slugs for permanent redirects.

## Iteration 6: authority and distribution

- Publish link-worthy original assets: historical datasets, schedules, calculators, rankings methodology, and visual explainers.
- Build relationships with NFL writers, podcasts, newsletters, team communities, and relevant resource pages.
- Distribute each strong article through the channels where its actual audience participates.
- Build an email audience so repeat readership does not depend entirely on search.
- Track earned mentions and links by destination page and referring domain quality.

## Measurement cadence

### Weekly

- Pages with new impressions but no clicks.
- Queries ranking from positions 8–30 that merit page improvements or internal links.
- Sitemap errors, server errors, accidental redirects, and newly excluded priority pages.
- New articles published versus articles substantially upgraded.

### Monthly

- Clicks, impressions, click-through rate, and average position by page and query group.
- Indexed canonical pages versus priority pages still excluded.
- Non-branded clicks and the number of pages earning search clicks.
- Referring domains and links to editorial pages.
- Performance of each topic cluster, not only the whole domain.

### Quarterly

- Re-score the content inventory: keep, improve, consolidate, redirect, or retire.
- Review topic priorities against the NFL calendar and demonstrated audience demand.
- Confirm that editorial output is building depth in chosen franchises instead of creating disconnected posts.
- Review technical crawl health, templates, structured data, Core Web Vitals, and development quality gates.

## Operating principles

- Publish fewer interchangeable articles and more pages worth returning to, citing, and linking to.
- Keep one canonical URL for each intent and preserve it long term.
- Measure improvement over months and seasons; avoid reacting to daily ranking noise.
- Treat indexation as eligibility, not a guarantee of rankings.
- Do not buy links, mass-produce near-duplicate pages, fake freshness, or chase every keyword outside the site's expertise.
