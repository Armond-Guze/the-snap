# Codex Start Here

If Codex on a new machine does not seem to know this project well yet, open the repo root and use this as your first prompt:

```text
This is THE SNAP project. Read AGENTS.md and use the project skill if relevant. This repo is a Next.js site with an embedded Sanity Studio. Main editorial content uses the article schema in sanity/schemaTypes/article.ts. Power rankings are article docs with format == "powerRankings". Team refs use tag docs, canonical tags use advancedTag refs in tagRefs, and power rankings require top-level intro and conclusion when published. When helping with article creation or rewrites, shape output to the site’s publishing workflow and prefer concise homepage titles, good slugs, and usable metadata.
```

Then ask Codex for the actual task:

- rewrite an article
- create a Sanity schema change
- fill in article fields
- update a page design
- fix a publishing workflow
