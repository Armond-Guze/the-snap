# SEO Guide

This repo uses JSON-LD for most structured data and a small amount of microdata for on-page schedule rows.

Event markup fixes (2025-11-04):
- Search Console flagged missing `name` (critical) and `eventStatus` (non‑critical) for SportsEvent microdata on schedule rows.
- Fix implemented by adding hidden `<meta itemProp>` tags inside each `GameRow` on:
	- `app/schedule/page.tsx`
	- `app/schedule/week/[week]/page.tsx`
- Fields now emitted for each row:
	- `startDate` (UTC ISO)
	- `name` (e.g., `DAL @ KC`)
	- `eventStatus` (`https://schema.org/EventCompleted` when final, otherwise `https://schema.org/EventScheduled`).

Notes:
- JSON-LD for Events is also rendered at the page level and already contained the required fields; the warnings were from microdata only. Keeping both is fine, but ensure microdata includes required properties.
- If you add another schedule/matchup UI that uses `itemScope itemType="https://schema.org/SportsEvent"`, include at least `name` and `startDate`; optionally include `eventStatus`.

