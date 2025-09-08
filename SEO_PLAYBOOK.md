# SEO Playbook (Authority & Monitoring)

## 1. Fast Authority / Backlink Strategy (First 90 Days)

### Core Pillars
1. Linkable Assets
   - Weekly Power Rankings (evergreen + updates) – add historical table & change deltas (reinforces freshness).
   - Schedule Hub + Week Pages – include quick-reference TV matrix (unique utility).
   - Data Reference Pages (mini glossary): NFL Bye Weeks 2025, Prime Time Games List, Playoff Clinching Scenarios (later season).
   - Fantasy Cheat Sheets (PPR / Standard / Waiver Targets) – periodically refreshed.
2. Digital PR / Outreach Targets
   - Niche newsletters (fantasy, betting, general NFL) – pitch a concise stat nugget + link to full table.
   - Team‑focused blogs: offer customized blurb ("Movement this week in league-wide rankings").
   - Podcast show notes: supply a pre-written summary + link.
3. Social / Platform Signals
   - Create/complete profiles: Twitter/X, Instagram, YouTube, TikTok, LinkedIn Page, Threads, Bluesky.
   - Use consistent bio ("Independent NFL analysis • Power Rankings • Schedule Tracker • thegamesnap.com").
4. Partnerships / Guest Content
   - Write 2–3 guest posts (medium DA football blogs): topic ideas: "How Early Season Variance Skews Power Rankings" or "Travel Scheduling Edges in 2025".
   - Offer embeddable widget: small script that renders Top 10 weekly rankings (with canonical link back).
5. Lightweight HARO / Qwoted Style Pitch System
   - Maintain 1-page explainer of credibility + quick stats resource.

### Weekly Cadence (10–15 min blocks)
| Day | Task |
|-----|------|
| Mon | Publish latest Power Rankings + tweet thread + outreach email batch (5) |
| Tue | Update schedule hub (injury / flex notes) + add 1 internal cross-link set |
| Wed | Produce 1 micro data reference (e.g., bye weeks) |
| Thu | Guest pitch or podcast outreach (2) |
| Fri | Refresh fantasy/rankings snippet for social reuse |
| Sat | Technical sweep (sitemap, errors) |
| Sun | Pre-load next week (draft ranking deltas) |

### Anchor Text Guidance
- 50–60% branded / URL ("The Snap", "thegamesnap.com").
- 20–30% topical partial match ("NFL power rankings analysis").
- <10% exact match ("NFL power rankings").
- Use naked URLs sparingly (5–10%).

### Internal Linking Metrics
Maintain target: every new headline links to ≥2 hubs (Schedule, Power Rankings, Standings) when contextually relevant.
Add a short related links block (\"Also see: Week X Schedule\").

---
## 2. Monitoring Workflow

### Core KPIs (Weekly Snapshot)
| Metric | Source | Target Trend |
|--------|--------|--------------|
| Impressions (site total) | GSC | +10–20% MoM |
| Clicks / CTR per hub page | GSC | Upward / stable CTR > 2% |
| Indexed / Discovered ratio | GSC Pages | Increase indexed share |
| Avg Position for branded term "The Snap" | GSC Queries | Crack top 3 |
| New Referring Domains | Search Console / Ahrefs-lite alt | +2–5 / month |
| Crawl Stats (Average fetches) | GSC Crawl Stats | Gradual rise |

### URL Inspection Routine (2–3 new articles/week)
1. Publish -> confirm live 200 + canonical.
2. Fetch `https://thegamesnap.com/headlines/<slug>` in GSC URL Inspection.
3. If not indexed: "Request Indexing" (limit to fresh / cornerstone).
4. Log date & status in simple sheet (columns: URL | Published | Requested | Indexed Date | Notes).
5. Re-check after 72h; if still unindexed and no obvious reason (blocked param, 404), ensure internal links exist from:
   - Homepage hero or More Headlines.
   - At least one related article sidebar.
   - Category page (auto if category assigned).

### Freshness & Change Signals
- Rankings page updated weekly: keep minor textual tweak (timestamp line) so Last-Modified changes.
- Schedule hub: reflect IN_PROGRESS / FINAL statuses quickly; triggers recrawl.
- RSS feed now live: optionally submit to Feedly / other aggregators.

### Technical Checks (Monthly)
Checklist:
- [ ] Sitemap returns 200 & includes new category pages.
- [ ] No spike in 404s (GSC Coverage / Pages report).
- [ ] Core vital CLS < 0.1 (Page Experience – once data accrues).
- [ ] Largest Contentful Paint < 3.0s on mobile key pages (home, power rankings, an article, schedule).
- [ ] Robots.txt unchanged & no accidental disallow.

### Logging Structure Suggestion
Create `data/seo-log.json` (array). Append entries for major events:
```json
{
  "date": "2025-09-08",
  "type": "publish",
  "url": "/headlines/example-slug",
  "notes": "Requested indexing; linked from homepage."}
```
Potential simple script later to summarize average index latency.

---
## 3. Rapid Backlink Outreach Email Template
Subject: Quick stat for your next NFL piece

Hi <Name>,

I compiled updated 2025 NFL Power Rankings with movement deltas (+/-) and a strength-of-schedule note: <URL>. If you need a concise Top 10 table or want an embeddable widget, I can send it over.

Happy to quote on <specific angle they cover>. Credit or link to the full table appreciated.

Cheers,
<Your Name> – The Snap (thegamesnap.com)

---
## 4. Future Upgrades
- Build /api/rankings/widget returning JSON for embeddable script tag.
- Add historical rankings archive (Week 1 → current) for long-tail queries.
- Add /glossary internal hub summarizing recurring terms (injury designations, etc.).
- Implement popularity-based Most Read (using ArticleViewTracker data) once persistence layer added.

---
## 5. Quick Win Priority Order
1. Add internal links block at bottom of each article (3 related hub links).
2. Launch widget API (backlink magnet).
3. Publish one reference asset/week (bye weeks, flex schedule tracker, playoff odds later season).
4. Track indexing latency – adjust if >5 days median.

---
Questions later: we can script log automation or widget implementation.
