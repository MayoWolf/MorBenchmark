# Benchmark Pack Contributions

FRCBench benchmark packs are plain JSON files. A good pack should be useful to FRC people, transparent about sources, and honest about what is verified versus community interpretation.

Start from `template-pack.json`, then import your file in the app to check validation errors before opening a PR.

Before opening a PR, also run:

```bash
npm run check:packs
```

## Pack Shape

Each pack needs:

- `id`: stable lowercase id, such as `2024-crescendo-strategy`
- `name`: human-readable pack name
- `version`: semantic or date-based version
- `description`: short explanation of scope
- `tasks`: array of benchmark tasks

Each task needs:

- `id`
- `season`
- `gameName`
- `category`
- `difficulty`
- `scoringType`
- `prompt`
- `expectedAnswer`
- `tags`

Rubric and manual tasks need a `rubric` array. Multiple-choice tasks need `choices` and a letter in `expectedAnswer`.

## Categories

- `game_rules`: rule interpretation, source discipline, and manual-aware answers
- `strategy_meta`: season strategy, role fit, cycles, match priorities, and tradeoffs
- `alliance_selection`: playoff pick lists, partner fit, redundancy, ceiling, and risk
- `match_analysis`: diagnosing match flow, drive team adjustments, and tactical review
- `ranking_points`: qualification objectives and ranking tradeoffs
- `robot_design_tradeoffs`: mechanism, reliability, schedule, and integration choices
- `scouting_interpretation`: turning scout data into decisions
- `historical_meta`: retrospective season meta, regional variation, and source-aware history

## Scoring Types

- `multiple_choice`: exact letter match
- `short_answer`: keyword/rubric matching
- `json_structured`: keyword/rubric matching plus valid JSON parsing
- `structured_json`: alias for `json_structured`
- `keyword`: alias for keyword/rubric matching
- `rubric`: manual review in v1
- `manual`: manual review in v1

Rubric items should be specific enough to review consistently. Add `keywords` only when keyword scoring makes sense.

## Sources and Verification

For the full verification workflow, see `source-verification-guide.md`.

Use the optional `sources` array when a task depends on outside information:

```json
{
  "title": "2024 FRC Game Manual",
  "url": "https://example.com/manual.pdf",
  "publisher": "FIRST",
  "year": 2024,
  "note": "Supports the rule terminology used in this task."
}
```

Good sources include:

- Official game manuals, team updates, Q&A, and event rules from FIRST
- The Blue Alliance for event, match, and team data
- Statbotics for EPA, event strength, and historical performance context
- Chief Delphi threads when clearly marked as community discussion
- Team strategy resources, scouting whitepapers, match strategy talks, and public picklist retrospectives

Do not cite community discussion as if it were an official rule. Chief Delphi, team blogs, and strategy videos are useful for meta, but they are not replacements for manuals or updates.

Acceptable sources should be public, stable enough for reviewers to inspect, and directly related to the claim in the task. For source entries, include `title`, `url`, `publisher`, `year`, and a short `note` explaining what the source supports.

## Verification Status

Use `verificationStatus` honestly:

- `unverified`: drafted or generic; needs review before canonical use
- `community_reviewed`: checked by knowledgeable FRC contributors
- `source_verified`: supported by cited official or high-quality public sources

Move a task from `unverified` to `source_verified` only when the prompt, expected answer, and rubric are all supported by the cited source material. For rule-specific tasks, use official FIRST manuals, team updates, or Q&A. For event data, use The Blue Alliance or Statbotics. For meta claims, cite community resources and keep the wording honest about regional or event-level context.

## Errors vs Warnings

`npm run check:packs` reports errors and warnings.

Errors fail CI and must be fixed before merging. They include missing required fields, duplicate task ids, invalid categories, invalid difficulty, invalid scoring types, rubric tasks without rubrics, multiple-choice tasks without choices, malformed multiple-choice answers, empty prompts, empty expected answers, and structured JSON tasks without a rubric or expected JSON shape.

Warnings do not fail CI, but they should be reviewed. They include short prompts, very short expected answers, missing tags, missing `sourceNote`, `source_verified` tasks without sources, unverified `game_rules` tasks, rubric items with non-positive points, missing `publicExplanation`, missing source URLs, and prompts over 4000 characters.

## Avoid Unsupported Claims

Do not write prompts that require exact rule facts unless you have verified them. If a prompt is intentionally generic, say that in `sourceNote`.

Avoid:

- invented rule numbers
- claims like "always" or "never" without source support
- overgeneralizing one event's meta to a whole season
- treating elite playoff strategy as the same as local qualification strategy

## Writing Strong Strategy and Meta Questions

Good strategy tasks ask the model to reason about tradeoffs:

- role fit instead of raw score
- reliability versus peak output
- partner compatibility
- defense, traffic, foul risk, and repairability
- qualification ranking incentives versus playoff win conditions
- scouting data quality and sample size
- regional or event-level variation

A strong expected answer should describe the reasoning pattern, not only one "correct" team choice.

## Review Checklist

- The pack imports successfully in the app.
- `npm run check:packs` has zero errors.
- Task ids are unique.
- Rule-specific claims have official citations.
- Community meta is marked as community meta.
- Rubrics can be applied by a human reviewer.
- Multiple-choice answers have one clear correct letter.
- Prompts avoid hidden assumptions that only one team or event would know.
