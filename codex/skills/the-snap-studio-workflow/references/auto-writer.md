# Auto-Writer Quality Standard

Use this standard for every AI-assisted article draft. The goal is not to make a rewrite longer. The goal is to make the page meaningfully more useful, specific, and trustworthy than the source material already available.

## Before drafting

Create the Sanity `editorialBrief` first:

- `targetQuery`: one precise query or reader question
- `searchIntent`: news, explainer, analysis, data, fantasy, or reported
- `readerPromise`: the concrete answer or outcome the page will deliver
- `originalValue`: the calculation, comparison, dataset, reporting, example, or conclusion The Snap adds
- `sources`: at least one primary or authoritative source, with the claim it supports
- `internalLinkPlan`: two to four closely related Snap articles or topic hubs

Do not draft when any of these is true:

- the only plan is to paraphrase another publisher
- The Snap has no distinct angle, evidence, analysis, or useful asset to add
- the main facts cannot be verified from a named source
- an existing Snap page already satisfies the same search intent and should be improved instead
- the proposed story falls outside the priority clusters: power rankings, NFL rules/contracts/draft/salary cap, or data-backed fantasy strategy

## Draft requirements

- Lead with the answer or real takeaway; do not manufacture suspense.
- Attribute sourced claims near the claim and link to the original source in the Body.
- Add at least one concrete value element: calculation, table, comparison, timeline, example, methodology, or original conclusion.
- Add contextual internal links where they help the reader. A related-articles widget does not satisfy this requirement.
- Use one H1 supplied by the Sanity title. Body headings begin at H2.
- Keep paragraphs short and mobile-friendly.
- Never invent quotes, reporting, statistics, credentials, sources, or certainty.
- Mark uncertain facts `Needs verification` and leave `published` false.
- Do not change an existing slug merely to refresh keywords.
- Set `dateModified` only after a substantive reader-visible update and explain it in `updateNote`.

## SEO requirements

- Write a specific title for one intent. Avoid vague labels such as `NFL mock draft`.
- Keep `homepageTitle` shorter than the full title.
- Write `summary` as a complete, specific sentence that can support a search description.
- Use three to six canonical `tagRefs`; do not create free-form tag clutter.
- Never add the current year unless the page is genuinely season-specific and the facts were verified for that year.
- Never force a focus keyword into awkward sentences.

## Handoff package

Return:

1. `format`
2. `title`
3. `homepageTitle`
4. `slug`
5. `summary`
6. `editorialBrief`
7. `category`
8. `teams`
9. `topicHubs`
10. `tagRefs` (3–6)
11. `players`
12. `seo focus keyword`
13. `source links used in Body`
14. `contextual internal links used in Body`
15. `body`
16. `verification notes`

Always leave the overlap-check, human-review, fact-check, and image-rights confirmations false. A person must complete those checks in Studio.
