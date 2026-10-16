# NFL betting odds guide: refresh package

Target: the canonical guide at
`/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more`

**Update the existing document in Sanity. Keep the slug, format, date, author and cover image.**
This package follows `codex/skills/the-snap-studio-workflow/references/auto-writer.md`. Compare it with the
live body first: keep anything already accurate, and only add what is missing. Do not paste over good content.
The teams and games in the examples are hypothetical. The math in every example was checked by hand.

Everything in `Needs verification` below must be confirmed by a person before publishing.
Leave the overlap-check, human-review, fact-check and image-rights confirmations for a person to set in Studio.

## editorialBrief

- `targetQuery`: how do NFL betting odds work (spreads, moneylines, totals)
- `searchIntent`: explainer
- `readerPromise`: after reading, you can read any NFL line, convert odds to implied probability, spot the sportsbook's margin, and estimate each team's expected score from the spread and total
- `originalValue`: worked examples with checked math, an odds-to-probability table, the vig calculation, an implied-team-total formula connected to fantasy, and a parlay example. All of it is original calculation, not rewritten text.
- `sources` (each needs a person to confirm the URL and claim before publishing):
  - NCPG, National Council on Problem Gambling (`ncpgambling.org`): the 1-800-GAMBLER helpline. Supports the responsible-gambling section. Needs verification.
  - The state gaming regulator for your main audience states: legal-age and licensing statement. Needs verification.
  - A sportsbook's own published rules page for how a push or a tie is settled. Needs verification.
- `internalLinkPlan` (confirm each slug is live and indexable before linking):
  - `/betting`
  - `/fantasy`
  - `/articles/how-to-use-vegas-implied-team-totals-a-2026-fantasy-and-betting-playbook`
  - `/articles/2026-nfl-strength-of-schedule-easiest-hardest-win-totals`

## Fields

- `homepageTitle`: NFL Betting Odds Explained
- `summary`: How to read NFL spreads, moneylines and totals, convert odds to implied probability, and understand the sportsbook's built-in margin, with worked examples.
- `category`: use the existing betting/fantasy category; do not create a new top-level category.
- `topicHubs`: Betting (create it if missing; "betting" is a reserved root route, so it must stay a topic hub only).
- `tagRefs` (3–6): Betting Education, NFL Odds, Point Spreads, Moneylines, Over/Under Totals, Implied Probability.
  Import `scripts/seed-advanced-tags-betting-fantasy.ndjson` first.
- `author`: a named author profile, not the generic desk byline.
- `dateModified` + `updateNote`: set both once the refresh is live. Suggested note:
  "Added an odds-to-probability table, worked vig and parlay examples, implied team totals, and responsible-gambling resources."
- `seo` focus keyword: nfl betting odds explained

## Body (real H2/H3 blocks; links via the Sanity URL mark; tables as Data Table blocks)

**Intro (normal paragraphs).** Two or three sentences: this guide explains how NFL odds work, what each number
means, and how to turn a price into a probability. It's education, not picks. Add a plain note that betting is for adults 21+
where legal, and link to `/affiliate-disclosure` if any affiliate links appear on the page.

### H2: The three main NFL bets

**H3: Point spread.** The spread handicaps the favorite. If Team A is -3.5, it must win by 4 or more to "cover." Team B
at +3.5 covers by winning outright or losing by 3 or fewer. The half-point prevents a tie, called a push. With a whole-number
spread, such as -3, a 3-point win is a push and the stake is returned.

**H3: Moneyline.** A bet on who wins, with no margin. Favorites show a minus sign and underdogs a plus sign.

**H3: Over/under (total).** A bet on whether combined points land above or below a number. With a total of 47.5, 48 or more
combined points is the over.

### H2: How to read American odds

- **Minus odds** show how much you must stake to win $100. At -150, a $150 stake wins $100 (total return $250).
- **Plus odds** show what $100 wins. At +150, a $100 stake wins $150 (total return $250).
- **-110 is the standard price on spreads and totals.** A $110 stake wins $100.

### H2: Implied probability and the vig

- Negative odds: implied probability = odds / (odds + 100), using the absolute value of the odds.
- Positive odds: implied probability = 100 / (odds + 100).

**Data Table: odds to implied probability**

| American odds | What it means | Implied probability |
| --- | --- | --- |
| -300 | stake $300 to win $100 | 75.0% |
| -200 | stake $200 to win $100 | 66.7% |
| -150 | stake $150 to win $100 | 60.0% |
| -110 | stake $110 to win $100 | 52.4% |
| +100 | stake $100 to win $100 | 50.0% |
| +150 | stake $100 to win $150 | 40.0% |
| +200 | stake $100 to win $200 | 33.3% |
| +300 | stake $100 to win $300 | 25.0% |

**The vig (juice).** If both sides of a spread are -110, each implies 52.38%, and together they add up to 104.76%.
The extra 4.76% is the sportsbook's built-in margin. You need to win about 52.4% of -110 bets just to break even.

### H2: Spreads and totals together: implied team totals

Add and subtract the spread from the total to estimate each team's expected points:
- Favorite = (total + spread) / 2
- Underdog = (total - spread) / 2

Worked example: Team A -3.5, total 47.5. Team A = (47.5 + 3.5) / 2 = **25.5**. Team B = (47.5 - 3.5) / 2 = **22.0**.
These are the market's scoring expectations, which is why fantasy players watch them. Link "implied team totals" to the
implied-totals article, and link `/fantasy`.

### H2: Key numbers in the NFL

Games land on margins of 3 and 7 more often than any other, so a spread moving from -2.5 to -3.5 matters more than one
moving from -4.5 to -5.5. This is why bettors shop lines and sometimes buy half-points. Do not quote exact percentages
unless a source is cited. Needs verification if you add any.

### H2: Parlays

A parlay combines bets, and every leg must win. Worked example with two -110 legs: each leg has decimal odds of about 1.909,
so the parlay pays 1.909 x 1.909 = 3.645 total, or about **+264** on a $100 stake. At break-even, each leg wins about 52.4% of the
time, so both win about 27.4% of the time. Parlays raise the payout, and the sportsbook's margin rises with it.

### H2: Bankroll basics and responsible gambling

- Only stake money you can afford to lose.
- Set a budget and a unit size (many people use 1–2% of their bankroll per bet) and stick to it.
- Never chase losses.
- Betting is for adults 21+ where legal. If gambling is a problem, call **1-800-GAMBLER** (NCPG helpline). Link to the
  NCPG page once the URL is verified.

### H2: Frequently asked questions (each question is an H3)

- **What does -110 mean?** You stake $110 to win $100.
- **What does it mean to cover the spread?** Win by more than the spread as the favorite, or lose by less than the spread (or win) as the underdog.
- **What is a push?** The result lands exactly on the number and the stake is returned.
- **Is the favorite always the better bet?** No. The price, not just the team, determines value.
- **Can I make money betting on the NFL?** Most bettors lose over time because of the vig. Treat it as entertainment.

## Handoff package (per the auto-writer standard)

1. `format`: keep the existing format.
2. `title`: keep the existing title.
3. `homepageTitle`, `summary`, `category`, `teams` (none), `topicHubs`, `tagRefs`, `players` (none): as above.
4. `seo focus keyword`: nfl betting odds explained.
5. `source links used in Body`: NCPG (after verifying), state gaming regulator (after verifying).
6. `contextual internal links used in Body`: implied-totals article, strength-of-schedule article, `/betting`, `/fantasy`.
7. `verification notes`: every source URL, any new statistic, and the sportsbook-rules claim need a person to confirm them.

## Final checks before publishing

- No duplicate paragraphs, stray Markdown markers, or heading lines stored as normal paragraphs.
- The odds table is a real Data Table block, with H2 and H3 blocks for the headings.
- Re-verify the math if you change any example.
- Set `dateModified` and `updateNote`.
- Leave `published` as it is until a person has done the review and fact-check confirmations in Studio.
