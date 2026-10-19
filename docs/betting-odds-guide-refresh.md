# NFL betting odds guide: additive refresh

Target: `/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more`
(title in Sanity: "How to Read NFL Betting Odds: Spreads, Moneylines, Totals, and More").

**Update the existing document. Keep the slug, format, date, cover image and body. Only add what is listed here.**
This follows `codex/skills/the-snap-studio-workflow/references/auto-writer.md`.

## What the live guide already has (read from Sanity on 2026-10-19)
- About 1,670 words, 15 H2 sections and a FAQ. It already covers spreads, moneylines, totals, -110, implied probability,
  line movement, parlays, props, teasers, futures and a terms list.
- Tags: Betting Odds, Point Spread, Moneyline, Over/Under, NFL Betting. Topic hub: NFL Betting. Author: The Snap.
  Category: Features. Cover image: yes.

## What it is missing (so the next edit can be published)
Studio's publish rules apply to every edit of a published article, so one editing pass must fix all of these:
1. **No editorialBrief** (see the template below).
2. **No external source link** (0 found). It needs at least 1.
3. **Only 1 internal link** (`/nfl-betting`). It needs at least 2.
4. **No 21+ or responsible-gambling content**, and no vig math, implied-team-total example or bankroll basics.

## Sections to add (real H2 blocks; links via the Sanity URL mark)

**Intro: add one line at the end of the intro.**
"Betting is for adults 21+ where legal. Nothing here is a guarantee of any result."

**H2: How the vig works** (place after "What does -110 mean?")
If both sides of a spread are -110, each side implies 52.38%, and together they add up to 104.76%. The extra 4.76% is the
sportsbook's built-in margin, called the vig. You need to win about 52.4% of -110 bets just to break even.

**H2: Implied team totals: turning a spread and a total into expected scores** (place after "How NFL over/under totals work")
Add and subtract the spread from the total to estimate each team's expected points: favorite = (total + spread) / 2 and
underdog = (total - spread) / 2. Worked example (hypothetical): Team A -3.5 with a total of 47.5 gives Team A
(47.5 + 3.5) / 2 = 25.5 and Team B (47.5 - 3.5) / 2 = 22.0. Fantasy players use these numbers to judge a game's scoring
environment. **Link "implied team totals" to**
`/articles/how-to-use-vegas-implied-team-totals-a-2026-fantasy-and-betting-playbook`, and link "fantasy" to `/fantasy`.

**H2: Bankroll basics and responsible gambling** (place before "NFL betting odds FAQ")
- Only stake money you can afford to lose.
- Set a budget and a unit size, and stick to them.
- Never chase losses.
- Betting is for adults 21+ where legal. If gambling is a problem, call 1-800-GAMBLER (the NCPG helpline).
**Link "NCPG" to the National Council on Problem Gambling's helpline page** (`ncpgambling.org`). Confirm the exact URL
yourself. This is the external source link the publish rule needs.

Do not quote exact percentages for "key numbers" (3 and 7) unless you cite a source.

## Fields to set in the same pass
- **editorialBrief**
  - targetQuery: how to read nfl betting odds
  - searchIntent: Evergreen explainer
  - readerPromise: Read any NFL line, convert odds to probability, and understand the sportsbook's margin.
  - originalValue: Worked vig and implied-team-total math, plus responsible-gambling guidance, added to a full odds explainer.
  - sources: National Council on Problem Gambling (primary/authoritative), URL verified by you
  - internalLinkPlan: the implied-totals article, the NFL Betting topic hub, and one more related article
  - Tick the four review boxes yourself after you check the page.
- **dateModified** and **updateNote:** "Added vig math, an implied-team-total example, and responsible-gambling resources."
- **tagRefs:** keep the five existing tags. Optional additions after you import the tag file: Line Movement, Implied Probability.
- **author:** a named author profile if you create one. "The Snap" is the only author today.

## Before saving
- No duplicate paragraphs, stray Markdown markers, or heading lines stored as normal paragraphs.
- Re-check every number if you change an example.
- The Studio has no Data Table block today, so keep tables out of this edit.
