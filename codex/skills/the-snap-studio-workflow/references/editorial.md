# Editorial Workflow

## Standard article content type

Use `_type == "article"` for most editorial work.

Common `format` values:

- `headline`
- `feature`
- `fantasy`
- `analysis`
- `ranking`
- `powerRankings`

## Standard article field checklist

Fill or review these fields when preparing an article:

- `title`
- `homepageTitle`
- `slug`
- `seo`
- `coverImage`
- `author`
- `date`
- `summary`
- `category`
- `players`
- `teams`
- `topicHubs`
- `tagRefs`
- `published`
- `body`

## Tagging rules

- `teams` should reference `_type == "tag"` docs
- `topicHubs` should reference `_type == "topicHub"` docs
- `tagRefs` should reference `_type == "advancedTag"` docs
- Legacy freeform `tags` are not preferred for new content

## Homepage / SEO guidance

- `homepageTitle` should be shorter and cleaner than `title`
- Avoid unnecessary slug churn
- Keep title specific to the article’s search intent
- `summary` should be short and usable in cards or previews

## Good default article workflow

1. Pick the correct `format`
2. Set `title`
3. Set `homepageTitle`
4. Generate `slug`
5. Fill `summary`
6. Attach `coverImage`
7. Attach `author`
8. Add `teams`, `topicHubs`, and `tagRefs`
9. Fill `body`
10. Review `seo`
11. Set `published` when ready
