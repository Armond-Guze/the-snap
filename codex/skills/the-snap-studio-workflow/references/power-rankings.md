# Power Rankings Workflow

## Content model

Power rankings use `_type == "article"` with:

- `format == "powerRankings"`

Two modes:

- `rankingType == "live"`
- `rankingType == "snapshot"`

## Required rankings fields

- `seasonYear`
- `rankings`
- `rankingIntro`
- `rankingConclusion`

Snapshot-specific:

- `weekNumber` for regular season
- or `playoffRound` for playoff / offseason targets

## Snapshot target rules

- use `weekNumber` for weeks `1–17`
- use `playoffRound` for:
  - `WC`
  - `DIV`
  - `CONF`
  - `SB`
  - `OFF`

`OFF` is the offseason target.

## Validation rules

- rankings must contain all 32 teams
- ranks must be unique and contiguous `1–32`
- teams must be unique
- published power rankings require:
  - `rankingIntro`
  - `rankingConclusion`

## Editorial helpers

- `biggestRiser` and `biggestFaller` are helper fields
- `editorialStatus` is used for checkpointing

## Studio actions/plugins

Relevant files:

- `sanity/plugins/duplicatePowerRankingWeek.ts`
- `sanity/plugins/snapshotFromLiveAction.tsx`
- `sanity/plugins/powerRankingHelpersAction.ts`
- `sanity/plugins/seoRegenerateAction.ts`

Use these workflows rather than inventing a new manual process if the user is working inside Studio.
