# The Snap Article Writer Guide

This is the repo-local reference for how THE SNAP articles should be written, structured, and handed back for Sanity use.

Use this guide for:

- headlines
- features
- evergreen explainers
- betting articles
- fantasy articles
- analysis pieces
- rankings
- power rankings

This guide is intentionally more descriptive than the installed skill so it can double as an editorial playbook.

## Core Purpose

The goal is not just to write clean copy. The goal is to return content that is ready to move into THE SNAP's Sanity workflow with as little cleanup as possible.

That means every article should balance:

- readable, direct prose
- literal search intent
- clean homepage presentation
- useful tag and topic suggestions
- realistic internal linking
- Sanity-friendly formatting

## Output Order

When returning a full article package, use this order:

1. `Title:`
2. `Homepage Title:`
3. `Image Idea:`
4. `Summary:`
5. `Category:`
6. `Related Players:`
7. `Teams:`
8. `Topic Hubs:`
9. `Tag References:`
10. `Body Content:`
11. `Sources:`
12. `Extra Idea:`

Do not add `Slug:`. Slugs auto-generate from the title in Sanity.

If the article includes structured comparisons such as odds, rankings, standings, or schedules, add:

- `Paste-Ready Table:`

Place it immediately before `Body Content:`.

For power rankings only, insert these fields after `Tag References:` and before `Body Content:`:

- `Ranking Type:`
- `Season Year:`
- `Week Number:` or `Playoff Round:`
- `Top-Level Intro:`
- `Top-Level Conclusion:`

## Sanity Field Rules

### Title

- Make it literal and publish-ready.
- Favor clear search intent.
- Avoid cute phrasing, puns, or vague angles.
- The title should generate a clean slug automatically.

### Homepage Title

- Must be shorter and cleaner than the full title.
- Must stay `65` characters or fewer.
- Remove filler, dates, and extra clauses first.
- If possible, keep it at least 5 characters shorter than the title.
- Homepage titles should scan quickly in cards, sidebars, and homepage rails.

### Image Idea

- Give one practical visual direction.
- Keep it editorial and realistic.
- Prefer player/team/action concepts or a simple explainer graphic brief.

### Summary

- Keep it to 1 or 2 sentences.
- It should work as a Sanity summary and as preview copy.
- Avoid repeating the title word-for-word.

### Category

- Suggest the best-fit Sanity category.
- If unclear, say `Needs category mapping`.

### Related Players

- List only player names.
- Use `None` if the piece is not player-centric.

### Teams

- Teams should use the NFL team tag references.
- Use only clearly relevant teams.
- Use `None` if no team belongs there.

### Topic Hubs

- Choose broad reusable hubs that match the article's purpose.
- Do not overstuff hubs.

### Tag References

- Use canonical advanced tags.
- Target `3-6` tags whenever the article supports them.
- Prefer specific, reusable tags.
- If a needed tag does not exist yet, mark it with `(suggest new)`.

## Writing Style

### Overall Voice

- Direct
- clean
- informative
- not overly bloggy
- not dramatic unless the story truly calls for it

The voice should sound confident and editorial, not robotic and not overly formal.

### Paragraphs

- Keep paragraphs short.
- Most paragraphs should be 1 to 4 sentences.
- Break up dense ideas before they feel heavy on mobile.

### Sentences

- Prefer clean declarative sentences.
- Avoid repeating the same transition words too often.
- Avoid stacking too many clauses in one sentence.

### Tone

- Explain clearly without sounding like a textbook.
- Use confidence, not hype.
- If something is uncertain, say so directly.

## Body Formatting Rules

### Headings

Use headings to create clear scanning structure.

- Use `##` for major sections.
- Use `###` only when a major section clearly needs sub-sections.
- Do not over-fragment the piece.

Good evergreen heading examples:

- `## How the franchise tag works`
- `## The three types of NFL tags`
- `## What dead money means`
- `## FAQ`
- `## Key Terms`

Good betting heading examples:

- `## 2026 AFC East division winner odds`
- `## Best bet to win the division`
- `## Best longshot value`

### Bold Words

Use bold sparingly.

Good uses:

- a key phrase in the opening sentence
- a short label like `Best bet:`
- a critical stat or takeaway when it improves scan value

Do not:

- bold entire sentences
- bold every subheading lead-in
- use bold as a substitute for structure

### Lists

Use lists when the information is actually list-shaped.

Good uses:

- pros and cons
- quick takeaways
- glossary definitions
- betting bullet summaries

Avoid turning normal explanation into bullets just to make it look structured.

## Article-Type Guidance

### Headline

- Fast and tight.
- Lead with the actual news.
- Minimal scene-setting.
- Keep the copy efficient.

### Feature

- Adds context and framing.
- Still needs a strong opening.
- Should feel fuller than a headline, but not bloated.

### Evergreen Explainer

- Remove stale seasonal references unless they truly help.
- Focus on definitions, mechanics, and recurring search intent.
- FAQ and Key Terms often help.

### Betting

- Use literal betting language.
- If there are odds, provide a table whenever practical.
- State the market, best line, and value case clearly.

### Fantasy

- Keep it actionable.
- Avoid stale examples when the season has passed.
- Prefer player archetypes or evergreen strategy framing when possible.

### Analysis

- Make the thesis easy to identify.
- Support it with clear logic.
- Avoid wandering between too many angles.

### Ranking

- The ranking angle should be obvious from the title and intro.
- Make the scan path clear.
- Use comparison tables when helpful.

### Power Rankings

- Must include `Ranking Type`, `Season Year`, and either `Week Number` or `Playoff Round`.
- Must include both a top-level intro and a top-level conclusion.
- Preserve rank order and keep each team section readable.

## FAQ and Key Terms

These are useful for evergreen explainers, but they are not mandatory in every article.

### Use FAQ when:

- the article answers a recurring search question
- readers are likely to search exact phrasing
- the topic is rules-based, process-based, or terminology-based

### Use Key Terms when:

- the topic includes jargon
- readers may skim for definitions
- a glossary improves clarity

### Do not force FAQ or Key Terms into:

- short headlines
- basic news updates
- light feature stories
- articles where they feel bolted on

### Best placement

For evergreen explainers, a common structure is:

1. main explainer sections
2. bottom-line or wrap-up section
3. `## FAQ`
4. `## Key Terms`

## Internal Linking Rules

Internal linking should be proactive, but it needs to be realistic.

### What to do

- Look for natural points in the body where another THE SNAP article helps the reader.
- Prefer existing live articles first.
- Favor evergreen explainers, closely related features, team pages, and topic hubs.
- Keep the link close to the concept it supports.

### What not to do

- Do not invent a live article if it does not exist.
- Do not paste Markdown links into `Body Content`.
- Do not paste raw URLs into body paragraphs.
- Do not create a visible published section called `Internal Link Ideas`.

### Sanity-specific rule

Sanity rich text will not automatically convert Markdown syntax like:

```md
[franchise tag](https://thegamesnap.com/articles/what-is-the-nfl-franchise-tag-and-how-does-it-work)
```

That will render as plain text if pasted directly into the body.

Instead, the writer should return internal links under `Sources:` in editor-friendly form:

```text
Internal links to add in Sanity:
- Link text: franchise tag
- URL: https://thegamesnap.com/articles/what-is-the-nfl-franchise-tag-and-how-does-it-work
- Placement: sentence about cap tools or offseason leverage
```

Then, in Sanity:

1. highlight the link text
2. click the `URL` button
3. paste the URL
4. save or publish

### Anchor text rules

- The real URL should always use the article's real canonical slug.
- The visible link text should be short and natural.
- Prefer the linked article's `Homepage Title` if it fits naturally.
- If the homepage title is still too long, shorten it to a clean phrase such as:
  - `franchise tag`
  - `salary cap`
  - `dead money`
  - `free agency`

### Internal linking examples

Bad:

```text
That accounting pressure is one reason NFL teams are so careful with [franchise tag](https://...)
```

Good editorial guidance:

```text
Internal links to add in Sanity:
- Link text: franchise tag
- URL: https://thegamesnap.com/articles/what-is-the-nfl-franchise-tag-and-how-does-it-work
- Placement: sentence about cap tools or offseason leverage
```

## Table Rules

If the article includes:

- odds
- standings
- rankings
- player comparisons
- contract breakdowns
- stat snapshots

then a `Paste-Ready Table` should usually be included.

The table should be easy to paste into the Sanity `Data Table` block.

Preferred format:

```text
Team	DraftKings	FanDuel	BetMGM
Bills	-150	-145	-155
Patriots	+155	+145	+150
Jets	+1800	+2000	+2500
Dolphins	+2800	+3000	+2800
```

Guidelines:

- keep headers short
- preserve `+` signs on positive odds
- use one table per clear comparison
- do not turn normal narrative into unnecessary tables

## SEO Guidance

### Titles

- Prefer literal search wording.
- Match common user phrasing when it reads naturally.
- Avoid clever ambiguity.

Good examples:

- `What Is the NFL Franchise Tag and How Does It Work?`
- `How Does the NFL Salary Cap Work?`
- `What Zero RB Means in Fantasy Football`

### Homepage Titles

- Keep them tight and clean.
- They should look good in homepage cards and side rails.

### Summary

- The summary should support search and homepage presentation.
- It should quickly explain what the piece delivers.

### Slugs

- Slugs auto-generate from the title.
- Because of that, the title should be clean enough to produce a useful slug.

## Taxonomy Rules

### Teams

- Use team tag references, not plain text labels.
- Only attach teams that are clearly relevant.

### Tag References

- Use canonical advanced tags.
- Keep them focused.
- Standard target is `3-6`.

### Topic Hubs

- Use broader routing logic.
- Topic hubs should help with site structure and internal discovery.

## Quality Control Checklist

Before finalizing an article package, check for:

- repetitive wording
- stale references
- homepage title that is too long
- weak summary
- missing FAQ or Key Terms opportunity
- missing table opportunity
- weak or excessive tags
- missing team or player fields
- missing internal link opportunities
- internal links that are not verified as live
- body copy that is too dense for mobile

## Evergreen Workflow Pattern

A good evergreen explainer often follows this order:

1. clear search-intent title
2. short summary
3. simple explanation of the topic
4. process or mechanics sections
5. examples or implications
6. bottom-line takeaway
7. FAQ
8. Key Terms
9. source notes and internal-link guidance

## Betting Workflow Pattern

A good betting article often follows this order:

1. title with the exact market
2. opening paragraph with context
3. odds table
4. best bet section
5. best longshot or value section
6. market or historical context
7. quick best-bets summary
8. optional extra idea such as a trend chart or implied-probability table

## Final Rule

The best THE SNAP articles feel clean and easy to publish.

They should not read like raw notes, AI output, or copied source material. They should feel like finished editorial work with enough structure, taxonomy help, and internal-link awareness to move cleanly into Sanity.
