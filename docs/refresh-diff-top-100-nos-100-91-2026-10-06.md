# Refresh: NFL Top 100 of 2026, Nos. 100–91

Status: **APPLIED to Sanity on 2026-10-06 and verified.** The script is the source of truth: `scripts/refresh-top-100-nos-100-91.mjs`.

- Document: `auto-nfl-top-100-players-of-2026-nos-100-91-e713fe5c13`
- Rev before: `FAM7sl14R2NFN68aBeyKrY` (backup: `docs/backups/auto-nfl-top-100-players-of-2026-nos-100-91-e713fe5c13-2026-10-06.json`)
- Rev after: `q3TmcawVlts6ghyzOH2gxx`
- Slug: **unchanged** (`nfl-top-100-of-2026-nos-100-91-azeez-al-shaair-debuts-as-montez-sweat-returns`)
- Check any time, read-only: `node scripts/refresh-top-100-nos-100-91.mjs --verify`
- Re-running the default dry run now aborts by design, because the live `_rev` no longer matches the backup.

## Source and verification

Source: NFL.com, https://www.nfl.com/news/top-100-players-of-2026-nos-100-91

The page was fetched three times through a summarizing tool, each time asking for verbatim entry text. The quotes agreed across calls. This is not a raw HTML read, so a human still needs to complete the fact check in Studio (`factChecked` is false). The page text returned no author and no publish date, so neither appears in the article. The "Grant Gordon" byline in the old article and in the earlier draft was not confirmed and was removed.

## What changed

| Field | Before | After |
|---|---|---|
| `slug` | unchanged | unchanged |
| `title` | NFL Top 100 of 2026, Nos. 100–91: Azeez Al‑Shaair debuts as Montez Sweat returns | **Unchanged.** Optional replacement, applied only with `--new-title`: "NFL Top 100 of 2026, Nos. 100–91: Full List and First-Time Entrants" |
| `homepageTitle` | Top 100 Players 2026: Nos. 100–91 | unchanged |
| `summary` | generic countdown blurb | Cameron Jordan is No. 100 and Montez Sweat is No. 91 in the player-voted NFL Top 100 of 2026, with at least four first-time entries led by Bryce Young at No. 98. |
| `body` | 10 blocks, no ranks | 15 blocks: intro, 10-row `dataTable`, first-time entrants, returners, position tally, internal links, source |
| `players` | Al-Shaair, Young | Al-Shaair, Young, Schwesinger (only three have player docs) |
| `teams` | Bears, **Titans**, Panthers | Saints, Colts, Panthers, Seahawks, Jets, Chiefs, Browns, Texans, Bears |
| `tagRefs` | NFL, NFL Top 100, Player Rankings | unchanged |
| `seo` | autoGenerate | manual: "NFL Top 100 of 2026 Nos. 100–91: Full List \| The Snap" and a matching description |
| `editorialBrief` | none | added; `overlapChecked`, `humanReviewed`, `factChecked`, `imageRightsConfirmed` all **false** |
| `dateModified` / `updateNote` | none | set at apply time; "Added the full Nos. 100–91 list with ranks, teams, positions and sourced notes; corrected team tags." |

## Shipped table (as verified against NFL.com)

| Rank | Player | Team | Pos. | Top 100 status | Stat or note |
|---|---|---|---|---|---|
| 100 | Cameron Jordan | NO | DE | 9th appearance | 15th NFL season; 10.5 sacks in 2025, his most since 2021 |
| 99 | Quenton Nelson | IND | G | 4th selection; first since 2022 (No. 28) | Pro Bowler in each of his eight NFL seasons |
| 98 | Bryce Young | CAR | QB | First-time entry | No. 1 overall pick in 2023; Carolina won the NFC South; career bests in passing yards and touchdowns |
| 97 | Ernest Jones | SEA | LB | First-time entry | Seattle's leading tackler; six interceptions including the postseason; two-time Super Bowl winner |
| 96 | Travis Etienne | NO | RB | First-time entry | Career-best 13 scrimmage touchdowns in his final Jaguars season; signed with the Saints this offseason |
| 95 | Demario Davis | NYJ | OLB | Returns after missing 2025 | Five straight Top 100 years before the gap; 14-year veteran signed by the Jets |
| 94 | Creed Humphrey | KC | C | Down one spot from last year | Fourth straight Pro Bowl; second straight All-Pro; 85 straight starts to begin his career |
| 93 | Carson Schwesinger | CLE | LB | Status not stated by NFL.com | 2025 second-round pick; AP Defensive Rookie of the Year; Cleveland's leading tackler |
| 92 | Azeez Al-Shaair | HOU | LB | First-time entry | First Pro Bowl; 100+ tackles for a third time in seven seasons; two interceptions |
| 91 | Montez Sweat | CHI | DE | No. 82 in his 2024 debut | Chicago's sack leader three years running; returned to double-digit sacks |

## Corrections made during verification

- **Schwesinger:** NFL.com does not label his entry a debut, so he is not counted as a first-time entrant. The count is four, not five.
- **Sweat:** removed "10 sacks" and "returns". The page says only "double-digit sacks", and does not say he missed the 2025 list.
- **Humphrey:** "fourth straight Pro Bowl" and "second straight All-Pro" replace "4th Pro Bowl" and "second All-Pro season". The "93 last year" figure was dropped as unstated.
- **Nelson:** "Pro Bowler in each of his eight seasons" replaces "8-time Pro Bowler".
- **Teams:** Tennessee Titans removed; no player in this group is on the Titans.
- "Needs verification" markers in the published body: 0.

## Open items

1. **Stale title.** The title still says "Montez Sweat returns", which NFL.com does not support and the new body no longer says. Apply the optional title with `--new-title` (the slug stays), or edit it in Studio.
2. **Human review.** Complete `overlapChecked`, `humanReviewed`, `factChecked` and `imageRightsConfirmed` in Studio. Cover image alt text and rights are unconfirmed.
3. **Player docs.** Seven of the ten players have no player document. Creating them is a separate task.
4. **Duplicate team doc.** `drafts.6f0297b7-…` (Seahawks) exists next to the published tag. The script uses the published id.
5. **Live page.** Not yet loaded in a browser to check table rendering and the three internal links.
