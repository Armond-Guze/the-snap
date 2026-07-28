# The Snap article growth and automation audit

Date: July 27, 2026

## Executive conclusion

The rewrite automation is a plausible contributor to weak organic growth once its drafts are published, but the available evidence does not prove that it alone caused a sitewide traffic decline.

The strongest problem is not article length. It is a combination of:

1. Source-based pages that add little or no value beyond the original.
2. Factual and entity-mapping errors.
3. Pages whose titles promise a table, tool, tier list, or complete ranking that the body does not deliver.
4. Generic organizational authorship with little public editorial transparency.
5. Weak contextual internal linking and incomplete image metadata.
6. Archive, tag, pagination, and production-branch issues that dilute discovery and internal authority.
7. Traffic measurement that mixes Search Console, consent-gated analytics, and sampled internal views.

The right long-term model is not “publish more rewrites.” The automation should prepare evidence-bounded, noindexed drafts. A human should then add reporting, data, comparison, analysis, or another concrete reason to choose The Snap over the source before publication.

## Remediation completed July 27, 2026

- Backed up the five urgent live Sanity documents before changing them.
- Temporarily noindexed all five while their facts and search intent were rebuilt.
- Replaced the inaccurate MVP and Janice McNair articles, completed the Top 100
  Nos. 80–77 page, built a genuine PPR running-back tier board, and repositioned
  implied team totals as an evergreen formula guide with worked examples.
- Added native Portable Text headings, contextual links, source notes, correction
  notices, Data Tables, cover-image alt text, canonical taxonomy, source
  provenance, and completed human-review fields.
- Preserved every existing slug, publication date, author, and image asset.
- Restored indexing only after an atomic, revision-guarded Sanity update and a
  read-back verification of all five documents.
- Set `seo.noIndex = true` on all 54 currently unpublished automated drafts.
- Completed a source-by-source audit of the other 17 published importer
  articles: two keep, eight refresh, four consolidate, and three noindex.
- Applied immediate legal-risk containment to the Stefon Diggs, Terrion
  Arnold, and Charles Snowden pages after finding contradictory, unsupported,
  or materially incomplete legal/disciplinary framing. All three now carry
  `seo.noIndex = true`; the Diggs document is also unpublished. Production
  read-back and public-route verification passed.
- Updated the active daily automation to create at most two unpublished,
  noindexed, fact-gated drafts per UTC day.
- Added production hardening for admin authorization, the Search Console audit
  endpoint, canonical tag projections, archive pagination, filtered-page
  metadata, and consistent exclusion of noindexed content from internal lists.

## Search Console comparison completed July 27, 2026

The authenticated Search Console comparison changes the causal diagnosis.

### Last three months versus the previous three months

Search type: Web. Current period: April 26 through July 25, 2026. Comparison
period: January 25 through April 25, 2026.

| Metric | Current | Previous | Change |
| --- | ---: | ---: | ---: |
| Clicks | 6 | 13 | -7 (-53.8%) |
| Impressions | 13,623 | 6,558 | +7,065 (+107.7%) |
| CTR | about 0.04% | about 0.20% | down about 78% |
| Average position | 61.3 | 47.8 | 13.5 positions worse |

The click decline was not an article-traffic decline:

- Article URLs increased from 0 to 3 clicks and from 293 to 10,607
  impressions.
- The terms, privacy, about, and contact pages fell from 11 to 2 clicks. Those
  non-editorial pages account for more than the entire sitewide click decline.
- Utility pages fell from 1 click to 0, while hub pages remained at 1 click.
- The 22 published importer articles produced only 84 visible impressions and
  one click in the page report. Eleven of the 22 did not produce a report row.
  They therefore did not numerically cause the recent sitewide click decline.

The longer-period average-position decline is partly a change in query mix.
Google began showing the site much more often for broad betting terms at
positions 60–90, while several old team aliases and brand/domain queries
disappeared. That increased impressions while lowering the aggregate average
position and CTR.

### Last 28 days versus the previous 28 days

The window beginning around the automated publishing batch also does not show
a search decline:

| Metric | Last 28 days | Previous 28 days |
| --- | ---: | ---: |
| Clicks | 1 | 0 |
| Impressions | about 4.28K | about 4.33K |
| Average position | 61.5 | 68.1 |

Impressions were essentially flat, clicks increased by one, and average
position improved by 6.6 places. If another analytics system shows falling
article views, that decline is in direct, referral, social, returning-user, or
on-site behavior—not in the recent Search Console totals.

### Pages and clusters with the strongest search signals

| Page or cluster | Impressions | Clicks | Average position | Interpretation |
| --- | ---: | ---: | ---: | --- |
| NFL betting-odds explainer | 7,010 | 1 | 71.3 | Large demand signal, but far too low to earn traffic |
| Standings | 1,822 | 0 | 52.8 | Durable utility opportunity |
| Salary-cap guide | 750 | 0 | 43.8 | Strong evergreen candidate for refresh and links |
| Franchise-tag guide | 569 | 0 | 59.9 | Impressions growing, authority and intent coverage weak |
| Fifth-year option guide | 277 | 1 | 34.2 | Existing traction; refresh before creating adjacent URLs |
| Hero RB guide | 268 | 0 | 30.3 | Nearer-term fantasy opportunity |
| MVP odds | 241 | 0 | 16.7 | Closest meaningful page to page one |

The betting consolidation and the Hero RB and MVP refreshes were completed
July 18–19. Search Console data ends July 25, so it includes only about one
week of those changes. Keep their URLs stable and compare them again after at
least three additional weeks rather than rewriting them immediately.

Two betting articles target almost the same intent:

- `/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more`
  received 7,010 impressions.
- `/articles/how-to-read-nfl-betting-odds-spreads-moneylines-totals-and-more`
  received 392 impressions.

Their Sanity content has now been consolidated around the stronger URL. The
current production frontend sends the retired alias through a temporary `307`
redirect; the prepared hardening release converts that alias into an explicit
permanent redirect. Do not create another broad betting-odds guide.

### Device, indexing, and authority signals

- Mobile impressions rose from 2,539 to 5,168, but mobile clicks fell from 9
  to 3 and average position shifted from 33.1 to 69.4. Much of this is the new
  low-ranking query mix. In the more recent 28-day comparison, mobile average
  position improved from 75.8 to 70.6, closely matching the desktop
  improvement, so Search Console does not currently indicate a distinct
  mobile-ranking failure.
- Desktop impressions rose from 3,865 to 8,329 and average position improved
  from 59.0 to 56.2. In the recent 28-day comparison, desktop impressions rose
  from 2,555 to 2,912 and position improved from 62.7 to 57.3.
- The sitemap was successful, last read July 19, and reported 219 discovered
  pages.
- The Page indexing report, last updated July 9, showed 44 indexed and 302 not
  indexed: 129 crawled-currently-not-indexed, 93 discovered-currently-not-
  indexed, 57 excluded by noindex, 16 redirects, four soft 404s, two 404s, and
  one canonical alternate.
- Samples in both the crawled and discovered exclusions included automated
  articles. This supports the quality concern even though the articles did not
  cause the measured click decline.
- Search Console reported no manual action and no security issue.
- The Links report currently shows zero external links. Its 884 internal links
  are dominated by sitewide boilerplate: privacy and terms have 83 each,
  headlines 80, about 79, home and contact 78, and fantasy 73. Important
  evergreen articles receive far fewer contextual links.

### Independent live crawl

A crawl of every URL in the production sitemap found 218 self-canonical,
indexable `200` responses and no blanket robots or sitemap failure. Several of
those `200` responses nevertheless hide important quality defects:

- The schedule landing page and all 18 week pages say “No games found” while
  promising complete 2026 schedules. Sanity contains 272 published 2026 games,
  so production is effectively serving 19 soft-404 pages with stale 2025
  sitemap dates. The prepared release passes the detected season explicitly;
  this must be verified before deployment.
- 127 of 218 sitemapped pages link to at least one of the three contained
  legal/disciplinary articles that now return `404`. Live list and related-item
  queries do not yet apply the same noindex predicate as the detail route. The
  prepared query hardening removes these broken sitewide links.
- Thirty pages expose a two-hop power-ranking redirect chain. The detail query
  must project `rankingType`, `seasonYear`, `weekNumber`, and `playoffRound` so
  cards can link directly to the canonical snapshot.
- The reported 2025 Week 7 power-ranking snapshot still returns a `200` page
  saying “No snapshot found.” Missing snapshots should return a genuine `404`.
- Sitemapped pages expose 192 query-string URLs. Category pagination can emit
  `?page=0`, clamp out-of-range pages to a `200`, and canonicalize every page
  to the base archive. Search/filter variants need consistent `noindex,follow`;
  invalid pages need `404`; disabled controls must not be links.
- The category archives substantially duplicate their primary hubs:
  `/categories/headlines` overlaps `/headlines` by 98%, while fantasy and power
  rankings have similar competing destinations. Choose one indexable URL for
  each intent and redirect or noindex the redundant version.

The crawl also reinforces that word count alone is not the pruning rule. Across
130 indexable content documents, median body length is 368 words, 117 have no
contextual internal links, and 98 have no body links at all. Some substantial
pages of 600–1,300 words are also excluded by Google. Improve useful pages
through intent completion, clear sourcing, contextual links, and stronger hub
placement; consolidate only derivative pages that add no durable value.

The immediate growth problem is therefore weak ranking and authority, not a
sitewide penalty or lack of impressions. The site is being tested in results,
especially for betting education, but most rankings are too low to produce
clicks.

## What the audit found

### Automation and corpus

- The importer created 78 Sanity articles from June 26 through the audit date.
- At the start of the audit, 22 were published and indexable and 56 were
  drafts. After legal-risk containment, 21 remain published, 57 are
  unpublished, and 19 remain indexable.
- The original 22 published importer articles represent all new published
  `article` documents created during that period.
- The published importer articles have a median body length of about 297 words.
- All 22 contain one outbound source link and no contextual editorial internal links.
- All use the generic “The Snap” byline.
- Seventeen of the 22 cover images lack alt text, captions, and credits.
- The old importer normally sent only a title, excerpt, date, author, and keywords to the writer, then required 1,800–2,600 characters and 7–10 paragraphs.
- The old post-generation quality check measured only character count.
- The article-generating model silently fell back to `gpt-5-mini`; the stronger model configured on the Codex automation only launched the script.

This design made generic padding and unsupported implications likely.

### Live article failures

| Page | Finding | Recommended action |
| --- | --- | --- |
| [Seven teams waiting on an MVP](https://thegamesnap.com/articles/seven-teams-still-waiting-on-a-super-bowl-era-mvp-who-has-the-best-shot-in-2026) | Arizona, New Orleans, and Tampa Bay are paired with the wrong candidates. | Temporarily unpublish or noindex, correct every mapping, and re-review the entire page. |
| [Janice McNair](https://thegamesnap.com/articles/janice-mcnair-co-founder-and-senior-chair-of-houston-texans-dies-at-89) | The rewrite foregrounds ownership uncertainty even though the cited source says Cal McNair has led day-to-day operations since 2018 and became principal owner in 2024. | Temporarily unpublish or noindex; rewrite from the primary Texans statement with no succession speculation. |
| [Implied team totals](https://thegamesnap.com/articles/how-to-use-vegas-implied-team-totals-a-2026-fantasy-and-betting-playbook) | The title promises a tool/playbook, but the page has no totals, team table, playoff-week values, or worked formula. | Add an owned, maintained table/tool and examples or reposition as a short explainer. Otherwise noindex. |
| [2026 RB tiers](https://thegamesnap.com/articles/2026-rb-tiers-a-practical-draft-guide-for-fantasy-managers) | The page promises practical tiers but contains no player tiers or player names. | Add actual tier tables, players, ADP/context, and format-specific decisions. Otherwise noindex. |
| [NFL Top 100 Nos. 80–77](https://thegamesnap.com/articles/nfl-top-100-2026-nos-80-77-josh-sweat-surges-as-baker-mayfield-slips) | The source covers Nos. 80–71; The Snap page discusses only 78 and 77 while omitting 80 and 79. | Correct every promised entry or noindex. |

Other urgent review targets include any article with a non-public source URL, the fifth-year option guide, draft grades with stray formatting, and generic team summaries that lack players, stats, schedule context, or a real conclusion.

### Remaining 17 published importer articles

The follow-up source review produced this disposition:

| Page | Search signal | Decision | Required treatment |
| --- | --- | --- | --- |
| C.J. Gardner-Johnson and the “cancer” label | No GSC row | Consolidate | Remove the unsupported off-field characterization and fold verified Bills context into one transition page |
| Seahawks versus Rams roster comparison | 1 impression, position 11.0 | Refresh | Preserve URL; add the full sourced top five, continuity percentages, grades, and a comparison table |
| NFL Top 100 Nos. 100–91 | 3 impressions, position 9.7 | Refresh | Preserve URL; add all ten rank mappings, teams, and verified statistics in a Data Table |
| Josh Allen and Buffalo’s changes | 4 impressions, position 8.8 | Keep | Remove duplicate source line; add verified personnel/stadium context later |
| Nick Caley on C.J. Stroud | 6 impressions, position 10.0 | Keep | Core report is supported; replace generic development prose with verified roster context during the next update |
| 2026 fantasy strength of schedule | 17 impressions, 1 click, position 21.4 | Refresh | Highest-value importer opportunity; add passing, rushing, playoff, and methodology tables plus player decisions |
| Rams as Seattle’s biggest threat | No GSC row | Consolidate | Merge supported facts into the Seahawks/Rams roster comparison and redirect |
| Terrion Arnold release | No GSC row | Noindex | Containment completed; rebuild from team, law-enforcement/court, and defense sources before reconsidering |
| NFL Top 100 Nos. 90–81 | 10 impressions, position 12.8 | Refresh | Preserve URL; complete all ten numbered entries and statistics |
| Jaydon Blue Year 2 | 12 impressions, position 51.7 | Refresh | Correct the University of Texas/Houston Texans mix-up, Dallas taxonomy, stats, and unsupported role projections |
| Aaron Rodgers and Mike McCarthy | No GSC row | Refresh | Remove invented schematic expectations; add verified partnership, scoring, and personnel history |
| 49ers “mirage” thesis | No GSC row | Refresh | Attribute the thesis and add the actual win total, injuries, ages, schedule, and divisional evidence |
| Gracen Halton/Commanders roundup | 6 impressions, position 23.2 | Consolidate | Split or fold verified items into a maintained transactions tracker; do not combine unrelated minor stories |
| 2026–27 NFL important dates | 19 impressions, position 68.1 | Refresh | Preserve URL; add the complete searchable calendar promised by the title |
| Charles Snowden suspension | No GSC row | Noindex | Containment completed; correct the stated reason and preseason eligibility from the Cowboys’ primary announcement |
| James Cook/Bills Super Bowl quote | No GSC row | Consolidate | Fold the useful production, coaching, and stadium facts into one Bills transition page |
| Stefon Diggs legal/market story | No GSC row | Noindex/unpublish | Containment completed; cited source contradicts the page’s ongoing-legal-risk framing |

Do not refresh all eight pages at once. First complete the two Top 100 pages,
fantasy strength of schedule, NFL important dates, and Jaydon Blue because they
already have search signals or clear factual/title-promise failures. Consolidate
the four overlapping pages only after mapping redirects and preserving the
stronger URLs.

### Useful pages to use as templates

- [2026 NFL strength of schedule](https://thegamesnap.com/articles/2026-nfl-strength-of-schedule-easiest-hardest-win-totals): complete table, methodology, source, and contextual links.
- [NFL salary-cap guide](https://thegamesnap.com/articles/how-does-the-nfl-salary-cap-work): comprehensive explanation, examples, table, and FAQ.
- [NFL betting-odds guide](https://thegamesnap.com/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more): strong search-intent coverage; add authoritative citations.
- [Schedule-release power rankings](https://thegamesnap.com/articles/2026-nfl-power-rankings-schedule-release-record-projections): original forecasts, methodology, complete table, and all 32 teams.

These pages succeed because they deliver the object promised by the title, not because they hit an arbitrary word count.

## Search and indexing signals

The public site does not appear to have a blanket crawling or indexing block:

- The standard sitemap is registered and healthy.
- Its sampled URLs returned 200 responses, self-canonicals, and indexable directives.
- The five July 15 automated articles inspected in the deployed GSC audit showed neutral inspection status and zero impressions in the 14-day window.
- The older RB tiers page passed inspection but had one impression and no clicks in that window.
- Current positions are generally too low to earn clicks. For example, the standings page had substantial impressions but an average position around the mid-50s in the sampled report.

The authenticated comparison above confirms weak ranking and authority rather
than a manual penalty. It also shows that the recent automation window did not
produce a measurable Search Console traffic decline. Analytics and internal
view data are still needed to diagnose any fall in non-search article usage.

## Do the articles need to be longer?

Not automatically. Google explicitly says it has no preferred word count. Length should follow the search task:

- Breaking news or a transaction: often 200–500 accurate words.
- A news analysis: only as long as the verified evidence supports.
- Evergreen explainers and fantasy guides: commonly 900–1,800 useful words, but only when the page includes the needed examples, data, definitions, decisions, and sources.
- Rankings, tiers, odds, or comparisons: complete the promised set and use a real Data Table. Word count is secondary.

Adding more generic paragraphs can make a page worse. A short accurate update is better than a long speculative rewrite.

## Should the writing be more personalized?

It should be more identifiable and original, not padded with first-person language.

Useful personalization includes:

- A named author or reviewer with a public bio and relevant expertise.
- A clear methodology: how rankings, projections, or tiers were produced.
- A defensible opinion tied to stats, film, roster construction, schedule, contracts, or market data.
- Original tables, calculations, charts, interviews, quotes, or observations.
- A corrections policy and disclosure of how automation assists the workflow.

Avoid artificial phrases such as “I think” or “in my opinion” when no original reasoning follows.

## The revised automation workflow

The local importer and scheduled automation now follow this path:

1. Select no more than two candidates per UTC day.
2. Extract the source body; reject weak extraction.
3. Reject stale, youth/FLAG, sensitive, ranking/table, promo, and low-value sources that need another workflow.
4. Require at least four explicit source-grounded facts.
5. Generate an evidence-bounded draft with a stronger explicit model.
6. Apply deterministic checks for format, team aliases, numbers, sentence completion, repetition, copied passages, speculation, age, and similar events.
7. Run an independent entity, fact, and headline-intent verification pass.
8. Create only an unpublished, noindexed Sanity draft.
9. Store the source, model/version, fact pack, claimed reader value, verification result, image idea, and relevant internal-link candidates.
10. Require a human to fact-check, add/confirm original value, review taxonomy, add a credited image with alt text, set the true publication date, and turn off noindex.

The automation is now a research-and-draft assistant. It is not a publisher.

## Human publication checklist

Before publishing any automated draft:

- Does every name, team, number, date, quote, and relationship match the source?
- Does the page fully deliver every noun in the title: “tiers,” “rankings,” “tool,” “table,” “guide,” or “all 32 teams”?
- What does The Snap add that the cited source does not?
- Is the format correct?
- Are the category, players, teams, topic hubs, and 3–6 canonical tags correct?
- Are there two or more relevant contextual internal links where they genuinely help?
- Are primary sources used for official transactions, injuries, rules, contracts, schedules, and statements?
- Is the summary complete and specific rather than a repeated first paragraph?
- Is the cover image licensed/owned, credited, and supplied with descriptive alt text?
- Is the byline accurate, and can readers learn who wrote or reviewed the page?
- Is the publication date the real first-publication time?
- For a meaningful refresh, is the explicit editorial modification date updated?
- Has noindex been removed only after every check passes?

## Content strategy for durable growth

Recommended publishing mix:

- 60% evergreen utility: rules, contracts, cap, draft process, schedules, standings, injuries, depth charts, fantasy decisions, and betting education.
- 25% recurring original franchises: weekly power rankings, matchup models, roster tiers, schedule difficulty, injury-impact tables, and “what changed” analysis.
- 15% selective news: only stories where The Snap can be faster, clearer, more local/specific, or add meaningful verified context.

Good growth projects are maintainable assets, not one-off rewrites:

- A canonical NFL standings guide connected to the live standings page.
- Team and position depth-chart hubs with meaningful update dates.
- A maintained fantasy implied-totals table with methodology and worked examples.
- Weekly injury impact and usage-change reports.
- Draft-order, fifth-year-option, franchise-tag, salary-cap, and compensatory-pick explainers connected as one rules cluster.
- One canonical, current power-rankings hub instead of several overlapping destinations.

For each cluster, choose one primary page, link supporting articles to it, refresh it visibly when the content changes, and avoid publishing several pages aimed at the same query.

## Distribution outside search

Search growth is slow for a young site. Build a direct audience at the same time:

- Publish a weekly email with one useful chart/table and links back to the full analysis.
- Turn original tables and rankings into shareable social graphics.
- Ask fantasy, team, and betting communities for questions before producing explainers.
- Build relationships with beat reporters, cap analysts, data providers, podcasts, and newsletters that may cite original work.
- Repurpose one strong research asset across the newsletter, social posts, and several supporting pages without duplicating the article.

The goal is repeat visitors, subscribers, citations, and branded searches—not only more indexed URLs.

## Technical priorities

### Immediate

1. Protect `/admin/search-console` with verified admin authorization in production. It currently exposes read-only GSC performance and indexing data to anonymous visitors. Authentication alone is not sufficient if any signed-in user can enter.
2. Release only from `codex/growth-hardening-master`, which reconciles the
   hardening work onto current `master`. Do not deploy the older divergent
   hardening worktree wholesale.
3. Restore the 2026 schedule data on all 19 schedule routes and replace their
   stale sitemap modification dates.
4. Deploy the consistent published/noindex query predicates so 127 sitemapped
   pages stop linking to contained articles that return `404`.
5. Fix production projections that read obsolete `tags` instead of canonical
   `tagRefs`.

### Next

1. Return 404 for invalid/out-of-range archive pages and redirect duplicate page-one routes.
2. Add crawlable, self-canonical pagination to articles, categories, and high-volume topic hubs.
3. Noindex search/filter result URLs and link navigation to canonical category or tag hubs.
4. Apply the noindex predicate consistently to detail, archive, related-content, alias, and sitemap queries.
5. Return genuine `404` responses for missing power-ranking snapshots and link
   cards directly to the canonical snapshot rather than through a two-hop
   redirect.
6. Add `/calendar` and `/tankathon` to the sitemap; suppress or noindex empty
   utility pages until they provide real content.
7. Add named Person author pages for real reporting; retain the Organization byline only for true staff-desk work.
8. Consolidate the overlapping headline, fantasy, and power-rankings destinations.
9. Add a Google News sitemap only after publishing timely original news consistently. It may improve discovery and reporting, but it is not a ranking lever.

## 90-day plan

### Days 1–7

- Keep the 57 automated drafts unpublished and noindexed.
- Keep the three legal/disciplinary-risk articles out of the index until
  primary-source rebuilds pass human review.
- The MVP, Janice McNair, RB tiers, implied totals, and incomplete Top 100 page
  remediations are complete; hold their URLs stable while new search data
  accumulates.
- The Search Console comparison is complete. Export analytics by channel and
  landing page for the same date windows to diagnose any non-search decline.
- Lock down the Search Console admin page.
- Stop using sampled internal view counts as total traffic.

### Days 8–30

- Execute the completed 22-page disposition: start with the fifth-year option
  guide, fantasy strength of schedule, the two incomplete Top 100 pages, NFL
  important dates, and Jaydon Blue.
- Add real author/reviewer profiles, editorial standards, automation disclosure, sourcing standards, and corrections policy.
- Release the prepared tagRefs, archive-pagination, noindex-query, and admin
  authorization fixes from a branch based on current `master`; then resolve
  the four soft 404s and the production branch workflow.
- Refresh the strongest existing evergreen pages and add contextual internal links.
- Choose three priority topic clusters and map one canonical page plus supporting content for each.

### Days 31–90

- Publish about two genuinely useful pieces per week rather than several rewrites per day.
- Maintain one recurring original data or analysis franchise.
- Update and redistribute existing winners instead of constantly creating new URLs.
- Build an email cadence and outreach list for citations/links.
- Review Search Console monthly by page, query, content type, and cluster.

### Months 4–12

- Double down only on clusters earning impressions, links, subscribers, or returning users.
- Build tools/tables readers revisit during the season.
- Earn links through original data, not link swaps or bulk guest posts.
- Consolidate pages that compete for the same intent.
- Keep a stable update calendar for seasonal evergreen pages.

## Measurement needed to prove the cause

Export the following:

1. Search Console Search results:
   - Last 3 months versus previous 3 months.
   - Last 3 months versus the same period last year, if available.
   - Pages, Queries, Countries, Devices, Search appearance, and Dates.
   - Separate Web, Discover, Google News, image, and video where available.
2. GA or another analytics tool:
   - Organic landing pages by sessions/users.
   - New versus returning users.
   - Engagement and conversions/subscriptions.
   - Referral, direct, email, and social traffic.
3. A list of publish and major update dates for the automated batch.

Use Search Console clicks/impressions as the primary search measure. The site’s internal view count is sampled and analytics is consent-gated, so neither is a complete traffic total.

## Questions that determine the next strategy

1. On what date did the decline begin, and which metric declined: Search Console clicks, impressions, GA users, internal views, or all of them?
2. Which three outcomes matter most: ad traffic, newsletter subscribers, affiliate/betting conversions, brand authority, or something else?
3. Who can be publicly named as writer, editor, or reviewer?
4. How many hours per week can go into original research, tables, updates, and distribution?
5. Which area can The Snap credibly own first: fantasy, betting education, NFL rules/cap, schedules/standings, power rankings, or team news?
6. What licensed data sources are available for standings, odds, ADP, injuries, usage, contracts, and schedules?

## Reference guidance

- [Google: creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: generative AI content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- [Google spam policies and scaled content abuse](https://developers.google.com/search/docs/essentials/spam-policies)
- [Google: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google: crawlable and contextual links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google: publication dates](https://developers.google.com/search/docs/appearance/publication-dates)
- [Google: Discover guidance](https://developers.google.com/search/docs/appearance/google-discover)
- [Google News transparency policies](https://support.google.com/news/publisher-center/answer/6204050)
- [Google News sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap)
- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
