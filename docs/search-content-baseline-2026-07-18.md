# Search and Content Baseline — July 18, 2026

This snapshot records the evidence used to start The Snap's content-quality work. It is intentionally dated so future reviews can compare like-for-like windows instead of relying on memory.

## Google Search Console baseline

Period: April 17 through July 16, 2026.

| Metric | Result |
| --- | ---: |
| Clicks | 6 |
| Impressions | 11,966 |
| Click-through rate | 0.1% |
| Average position | About 62 |
| Indexed pages shown in Page Indexing | 44 |
| Not-indexed pages shown in Page Indexing | 302 |

The site is receiving enough impressions to reveal topics Google associates with it, but most results rank too low to earn meaningful clicks. Betting education is the clearest demonstrated query cluster.

### Page Indexing exclusion audit

Search Console's July 9 snapshot divided the 302 not-indexed URLs into these reasons:

| Reason | URLs | Audit interpretation |
| --- | ---: | --- |
| Crawled - currently not indexed | 129 | Mostly older or thin editorial URLs plus historical schedule, team, and game URLs. This is primarily a quality and crawl-priority problem, not an indexing directive problem. |
| Discovered - currently not indexed | 93 | All were submitted sitemap URLs. Many schedule and team pages were rebuilt after this snapshot; the report's validation status was Passed. |
| Excluded by `noindex` | 57 | Mostly automated game-center pages that intentionally remain out of search until they offer enough unique value. The other examples now return indexable, self-canonical pages. |
| Page with redirect | 16 | Expected protocol, hostname, headline, rankings, and other legacy permanent redirects. |
| Soft 404 | 4 | Two legacy matchup placeholders were genuine defects; the other two power-ranking examples were already corrected to a real 404 and a permanent redirect. |
| Not found (404) | 2 | One obsolete deployment asset and one stale report entry for the now-restored power-rankings hub. |
| Alternate page with proper canonical | 1 | An article-filter URL that correctly canonicalizes to the unfiltered article archive. |
| Google chose different canonical | 0 | No affected URLs in the snapshot. |

For the submitted-sitemap scope, the same July 9 snapshot showed 210 known URLs: 43 indexed, 63 crawled but not indexed, 93 discovered but not indexed, and 11 excluded by `noindex`. A live audit on July 18 found 219 current sitemap URLs, all returning 200 and none carrying `noindex`. It also uncovered six sitemap pages inheriting the homepage canonical: the mock-draft simulator, About, Contact, Newsletter, Privacy Policy, and Terms pages. Their self-canonicals were corrected in the indexing cleanup deployment.

Other technical cleanup from this audit:

- Legacy matchup URLs now permanently redirect when a real game exists and return an actual 404 when it does not, removing placeholder soft 404s.
- Five retired fantasy routes now permanently redirect to their published article replacements.
- Automated game-center pages are dynamically rendered and intentionally remain `noindex,follow`; they are not sitemap entries and will not consume static-build output.
- Category, topic-hub, team, and team-index sitemap entries now use meaningful source modification dates.
- No mass indexing requests were made. Requests remain limited to materially improved, priority canonical pages.

### Highest-impression queries observed

| Query | Impressions | Clicks |
| --- | ---: | ---: |
| nfl point spreads | 273 | 0 |
| nfl moneyline | 237 | 0 |
| nfl point spread | 210 | 0 |
| nfl standings | 194 | 0 |
| nfl spread betting | 187 | 0 |
| nfl moneyline odds | 181 | 0 |
| spread betting nfl | 178 | 0 |
| nfl moneyline betting | 172 | 0 |
| moneyline bet nfl | 156 | 0 |
| nfl odds explained | 154 | 0 |
| how to read nfl odds | 113 | 0 |
| how to read nfl betting lines | 103 | 0 |

These variations belong to one betting-education intent. They should be served by one comprehensive guide, not multiple near-duplicate URLs.

### Highest-impression pages observed

| Page | Clicks | Impressions | Initial action |
| --- | ---: | ---: | --- |
| `/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more` | 1 | 6,742 | Retain and improve |
| `/standings` | 0 | 861 | Evaluate template, intent, and seasonal usefulness |
| Salary-cap explainer | 0 | 672 | Improve evergreen depth and internal links |
| Franchise-tag explainer | 0 | 499 | Improve evergreen depth and internal links |
| `/schedule/week/17` | 0 | 443 | Review seasonal/canonical behavior |
| Competing betting guide | 0 | 392 | Consolidate and redirect |
| Post-draft Super Bowl odds | 0 | 353 | Refresh only when materially current |
| Fifth-year-option guide | 1 | 248 | Preserve; evaluate queries and CTR |
| AFC East win totals | 0 | 249 | Treat as seasonal betting support content |
| `/schedule` | 0 | 244 | Evaluate template, intent, and seasonal usefulness |
| MVP odds | 0 | 230 | Refresh only when materially current |
| Homepage | 1 | 212 | Preserve brand/canonical signals |

`/terms` received three clicks from 293 impressions, but it is a utility/legal page rather than an editorial growth target.

## Sanity content baseline

The repository audit initially found 185 published or legacy editorial documents:

| Type | Count before first consolidation |
| --- | ---: |
| `article` | 135 |
| legacy `headline` | 43 |
| legacy `fantasyFootball` | 7 |

Quality flags across those documents:

| Flag | Count |
| --- | ---: |
| Missing summary | 2 |
| Missing author | 1 |
| Missing cover image | 3 |
| Missing category | 0 |
| Under 1,500 body-text characters | 51 |

Thinness is a review signal, not an automatic reason to pad or delete a page. Short breaking news can satisfy its purpose; evergreen explainers and landing pages usually need more depth.

## Consolidation 1: NFL betting odds guide

Completed July 18, 2026.

- Retained document: `311b265b-02e8-4dc8-bb0c-1fb2091b9570`.
- Retained URL: `/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more`.
- Preserved redirect source: `/articles/how-to-read-nfl-betting-odds-spreads-moneylines-totals-and-more`.
- Retained page expanded from 81 to 140 body blocks and now covers spreads, moneylines, totals, -110 pricing, implied probability, line movement, parlays, props, teasers, futures, beginner steps, FAQs, and definitions.
- Search title: `How to Read NFL Betting Odds: Complete Guide | The Snap`.
- Search description length: 156 characters.
- Duplicate document remains recoverable in Sanity with `published=false`; it was not deleted.
- Production checks: retained URL 200, retired URL 308, self-canonical correct, robots index/follow, duplicate absent from the 219-URL sitemap.

## Measurement checkpoints

For the consolidated guide, compare the same page and query group after:

- 2 weeks: crawl/indexing state, canonical selection, and any early query changes.
- 4 weeks: impressions, average position, CTR, and the number of distinct queries.
- 8 weeks: whether the consolidated URL gained positions/clicks and whether the retired URL disappeared from performance reporting.

Do not reverse the consolidation based on day-to-day volatility. Search systems need time to crawl, process redirects, combine signals, and reevaluate the page.

## Improvement batch 2: standings, schedule, and NFL rules guides

Completed July 18, 2026.

Page-level Search Console evidence for April 17 through July 16:

| Page | Impressions | Average position | Highest-confidence query signal |
| --- | ---: | ---: | --- |
| `/standings` | 861 | 51.1 | `nfl standings` — 194 impressions |
| Salary-cap explainer | 672 | 42.7 | `nfl salary cap explained` and related cap-space queries |
| Franchise-tag explainer | 499 | 60.1 | `franchise tag`, `franchise tag nfl`, and definition queries |
| `/schedule/week/17` | 443 | 50.5 | `nfl 2026 week 17 schedule` averaged position 17.1 |
| `/schedule` | 244 | 57.2 | `nfl schedule` and related generic schedule queries |

Changes made:

- Loaded and validated all 272 games in the official 2026 regular-season slate; each of the 32 teams has 17 games and Week 17 has 16 matchups.
- Marked 24 league-held flexible games as date/time TBD so placeholder timestamps are never presented as official kickoffs.
- Rebuilt the schedule templates around the 2026 season, working timezone controls, weekly titles and descriptions, live status enrichment, and shared rendering.
- Corrected the active-standings-season query. The page now labels the final 2025 records as 2025 instead of falling back to the current calendar year, includes ties, and explains its sorting limits.
- Updated team hubs to show the 2026 schedule alongside clearly labeled 2025 standings context.
- Rewrote search metadata for the salary-cap and franchise-tag guides, added official NFL Football Operations references, removed the franchise guide's duplicated opening, and added a focused franchise-tag FAQ.
- Added schedule-source modification dates to the sitemap so data refreshes generate meaningful crawl signals.

Recheck these five URLs at the same 2-, 4-, and 8-week intervals. Week 17 is the best early ranking-movement indicator because Google had already tested the page near page two for a precise 2026 query before the page contained its schedule.

## Improvement batch 3: Hero RB fantasy strategy

Completed July 18, 2026.

Search Console showed 256 impressions, zero clicks, and an average position of 30.4 for `/articles/what-hero-rb-means-in-fantasy-football`. The most actionable query was `hero_rb fantasy football draft strategy round 3`: 25 impressions at an average position of 4.8, but no clicks.

Changes made:

- Preserved the canonical URL and changed the search title to `Hero RB Strategy: Round-by-Round Draft Plan | The Snap`.
- Reworked the summary and description around the demonstrated Hero RB strategy and Round 3 intent.
- Moved the comparison table out of the opening position so the page now answers the reader before presenting supporting detail.
- Added a round-by-round 12-team redraft framework, an explicit Round 3 answer, anchor-back selection criteria, and two focused FAQs.
- Added working internal links to the complete fantasy draft strategy guide and mock draft simulator.
- Expanded the body from 82 to 100 blocks and from roughly 6,600 to 8,600 text characters without changing the publication date; the substantive update date is July 18.
- Added a shared responsive renderer for Sanity `dataTable` blocks after production verification revealed that article tables were stored correctly but silently omitted by the frontend. The fix restores 17 valid tables across 13 published articles.

Measure clicks, CTR, average position, and the Round 3 query group after 2, 4, and 8 weeks. Do not interpret the unusual underscore-form query as a reason to stuff that exact syntax into the page.
