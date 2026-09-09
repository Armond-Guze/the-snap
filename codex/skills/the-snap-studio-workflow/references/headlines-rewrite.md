# Headlines Rewrite Format

Use this for standard NFL news/article rewrites, not power rankings.

## Output order

Return results in this exact order:

1. `Title:`
2. `Homepage Display Title:`
3. `Slug:`
4. `Meta Description:`
5. `Editorial Brief:`
6. `Topic Hubs:`
7. `Tag References:`
8. `Teams:`
9. `Related Players:`
10. `Source Links:`
11. `Internal Links:`
12. `Body:`
13. `Verification Notes:`

## Default choices

- Default `Topic Hubs` to `Headlines` unless the user clearly wants another hub
- Pick `3–6` strong canonical `Tag References`, not a stuffed list

## Rewrite rules

- Follow `auto-writer.md`; fresh wording alone is not enough to justify a page
- Do not mirror the original sentence structure
- Add a distinct Snap contribution such as analysis, a comparison, a calculation, a useful example, or a data point
- Cite the primary or authoritative source in the Body
- Add contextual links to at least one closely related article and the strongest relevant hub
- Keep body paragraphs tight and publishable
- Use H2/H3 headings when they materially improve scanning; never add a Body H1
- If a fact is unclear, write `Needs verification`
- Leave the article unpublished until a human completes the Studio quality gate

## Slug rules

- lowercase only
- hyphen-separated
- usually `6–10` words
- avoid dates unless they are needed for clarity

## Field guidance

- `Title` should be publish-ready
- `Homepage Display Title` should be shorter and more scannable
- `Meta Description` should be one clear sentence
- If no team or player is clearly mentioned, write `None`
