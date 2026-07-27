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
- Updated the active daily automation to create at most two unpublished,
  noindexed, fact-gated drafts per UTC day.
- Added production hardening for admin authorization, the Search Console audit
  endpoint, canonical tag projections, archive pagination, filtered-page
  metadata, and consistent exclusion of noindexed content from internal lists.

## What the audit found

### Automation and corpus

- The importer created 78 Sanity articles from June 26 through the audit date.
- 22 are published and indexable; 56 remain drafts.
- Those 22 importer articles represent all new published `article` documents created during that period.
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

This is evidence of weak visibility, not proof of a manual penalty. A reliable causal diagnosis still needs a Search Console comparison covering the decline period.

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
2. Reconcile the divergent `main` and `master` branches before deploying. Production contains some SEO fixes absent from `master`, while `master` contains regressions that should not be deployed wholesale.
3. Fix production projections that read obsolete `tags` instead of canonical `tagRefs`.

### Next

1. Return 404 for invalid/out-of-range archive pages and redirect duplicate page-one routes.
2. Add crawlable, self-canonical pagination to articles, categories, and high-volume topic hubs.
3. Noindex search/filter result URLs and link navigation to canonical category or tag hubs.
4. Apply the noindex predicate consistently to detail, archive, related-content, alias, and sitemap queries.
5. Add named Person author pages for real reporting; retain the Organization byline only for true staff-desk work.
6. Consolidate the overlapping power-rankings destinations.
7. Add a Google News sitemap only after publishing timely original news consistently. It may improve discovery and reporting, but it is not a ranking lever.

## 90-day plan

### Days 1–7

- Keep the 56 automated drafts unpublished.
- Temporarily noindex/unpublish the inaccurate MVP and Janice McNair pages.
- Correct or noindex RB tiers, implied totals, and the incomplete Top 100 page.
- Export Search Console and analytics data for the exact decline window.
- Lock down the Search Console admin page.
- Stop using sampled internal view counts as total traffic.

### Days 8–30

- Review all 22 published importer articles: keep, refresh, consolidate, or noindex.
- Add real author/reviewer profiles, editorial standards, automation disclosure, sourcing standards, and corrections policy.
- Fix tagRefs, archive pagination, soft 404s, and the production branch workflow.
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
