# NFL betting odds guide: refresh package

Target document: the canonical guide at
`/articles/nfl-betting-odds-explained-spreads-moneylines-totals-and-more`.
**Keep the existing slug.** Update the document in Sanity; do not create a new one.

This package follows the `article` schema and the AGENTS.md checklist (no `slug` field here).
Compare it against the live body first and keep any accurate material already there. Do not paste over
good content. Every figure below was checked by hand; the games and teams are hypothetical.

## Fields

- `title`: keep the current title.
- `homepageTitle`: NFL Betting Odds Explained
- `summary`: How to read NFL spreads, moneylines and totals, convert odds to implied probability, and understand the sportsbook's built-in margin, with worked examples.
- `contentDisclosure`: **Betting (21+ / responsible gambling)**. Change to "Betting + affiliate links" once affiliate links are added.
- `lastReviewedAt`: today's date.
- `topicHubs`: Betting (create it if missing; it is reserved, so it can't be a root-level hub page).
- `tagRefs` (3–6): Betting Education, NFL Odds, Point Spreads, Moneylines, Over/Under Totals, Implied Probability
  (run the seed file `scripts/seed-advanced-tags-betting-fantasy.ndjson` first).
- `category`: use the existing betting/fantasy category if there is one; do not create a new top-level category.
- `author`: a named author, not the generic desk byline.

## Body (real H2/H3 blocks, not Markdown)

**Intro (normal paragraphs).** Two or three sentences: this guide explains how NFL odds work, what each number means,
and how to turn a price into a probability. It is education, not picks.

### H2: The three main NFL bets

**H3: Point spread.** The spread handicaps the favorite. If Team A is -3.5, it must win by 4 or more to "cover."
Team B at +3.5 covers by winning outright or losing by 3 or fewer. The half-point prevents a tie (a "push"). Whole-number
spreads can push: at -3, a 3-point win returns your stake.

**H3: Moneyline.** A bet on who wins, with no margin. Favorites show a minus sign, underdogs a plus sign.

**H3: Over/under (total).** A bet on whether combined points are above or below a number. With a total of 47.5, 48 or more
combined points is the over.

### H2: How to read American odds

- **Minus odds** show how much you must stake to win $100. At -150, a $150 stake wins $100 (total return $250).
- **Plus odds** show what $100 wins. At +150, a $100 stake wins $150 (total return $250).
- **-110 is the standard price on spreads and totals.** A $110 stake wins $100.

### H2: Implied probability and the vig

Formulas:
- Negative odds: implied probability = odds / (odds + 100), using the absolute value of the odds.
- Positive odds: implied probability = 100 / (odds + 100).

**Data Table: odds to implied probability**

| American odds | Stake to win $100 / win on $100 | Implied probability |
| --- | --- | --- |
| -300 | stake $300 | 75.0% |
| -200 | stake $200 | 66.7% |
| -150 | stake $150 | 60.0% |
| -110 | stake $110 | 52.4% |
| +100 | win $100 | 50.0% |
| +150 | win $150 | 40.0% |
| +200 | win $200 | 33.3% |
| +300 | win $300 | 25.0% |

**The vig (juice).** If both sides of a spread are -110, each implies 52.38%. Together they add up to 104.76%.
The extra 4.76% is the sportsbook's built-in margin. You must win about 52.4% of -110 bets just to break even.

### H2: Spreads and totals together: implied team totals

Add and subtract the spread from the total to estimate each team's expected points:
- Favorite = (total + spread) / 2
- Underdog = (total - spread) / 2

Worked example: Team A -3.5, total 47.5.
Team A = (47.5 + 3.5) / 2 = **25.5**. Team B = (47.5 - 3.5) / 2 = **22.0**.
These are the market's scoring expectations, which is why fantasy players watch them. Link to the fantasy tools page here.

### H2: Key numbers in the NFL

Games land on 3 and 7 more often than any other margin, so a spread moving from -2.5 to -3.5 matters more than from -4.5 to -5.5.
Line shopping and buying half-points are built around this. (Avoid quoting exact percentages unless you cite a source.)

### H2: Parlays

A parlay combines bets, and every leg must win. Worked example: two -110 legs.
Decimal odds per leg are 1.909, so the parlay pays 1.909 x 1.909 = 3.645 total, or about **+264** on a $100 stake.
Each leg wins about 52.4% of the time at breakeven, so both win about 27.4% of the time. Parlays raise the payout and
the sportsbook's margin along with it.

### H2: Bankroll basics and responsible gambling

- Only stake money you can afford to lose.
- Set a budget and unit size (many people use 1-2% of their bankroll per bet) and stick to it.
- Never chase losses.
- Betting is for adults 21+ where legal. If gambling is a problem, call **1-800-GAMBLER** (NCPG helpline).

### H2: Frequently asked questions (each question is an H3)

- **What does -110 mean?** You stake $110 to win $100.
- **What does it mean to cover the spread?** Win by more than the spread as the favorite, or lose by less than the spread (or win) as the underdog.
- **What is a push?** The result lands exactly on the number and stakes are returned.
- **Is the favorite always the better bet?** No. The price, not just the team, determines value.
- **Can I make money betting NFL?** Most bettors lose over time because of the vig. Treat it as entertainment.

## Links to add (use the Sanity URL mark)

- Link "implied team totals" to the fantasy implied-totals article.
- Link "strength of schedule" to the 2026 NFL strength-of-schedule article.
- Link to `/betting` and `/fantasy` from the intro or conclusion.
- Add one or two authoritative outbound citations (for example your state gaming regulator and the NCPG
  helpline page) only after verifying the URLs yourself.

## Final checks before publishing

- No duplicate paragraphs, stray Markdown markers, or heading lines stored as normal paragraphs.
- The data table is a real Data Table block.
- Re-verify the math if you change any examples.
- Set `lastReviewedAt`.
