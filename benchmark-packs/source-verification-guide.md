# Source Verification Guide

FRCBench benchmark packs should be honest about what is verified, what is community interpretation, and what still needs review. This guide explains how to move tasks toward `source_verified` without turning benchmark writing into rule hallucination.

## Preferred Sources

Use the strongest source that matches the claim:

- Official FIRST game manual: best source for game structure, scoring, penalties, field terminology, ranking points, robot rules, and event rules.
- Official FIRST team updates: best source when a rule changed or was clarified after kickoff.
- Official FIRST Q&A when available: useful for official clarifications tied to a specific season. Cite the exact Q&A item when possible.
- The Blue Alliance: use for event, match, alliance, award, schedule, and team-performance data.
- Statbotics: use for EPA-style historical data, team/event strength, and statistical context.
- Chief Delphi: use for community meta discussion only. Do not cite Chief Delphi as an official rule source.

Useful starting points:

- FIRST FRC season materials and manuals: https://www.firstinspires.org/resource-library/frc/competition-manual-qa-system
- The Blue Alliance: https://www.thebluealliance.com/
- The Blue Alliance API docs: https://www.thebluealliance.com/apidocs
- Statbotics: https://www.statbotics.io/
- Statbotics docs: https://statbotics.readthedocs.io/
- Chief Delphi: https://www.chiefdelphi.com/

## Verifying Official Rule and Game Questions

For official game or rule tasks:

1. Find the exact season manual.
2. Check whether the relevant rule changed in team updates.
3. Search official Q&A for clarifications.
4. Confirm the task prompt does not overstate what the source says.
5. Confirm the expected answer and rubric are supported by the source.
6. Add a source entry with the exact URL and a note naming the manual section, team update, or Q&A item.
7. Mark `verificationStatus` as `source_verified` only after the prompt, expected answer, and rubric all line up with the sources.

If the task depends on event data, check The Blue Alliance or Statbotics. If it depends on community strategy meta, cite community resources and keep the wording scoped to that context.

## How to Cite a Source

Use the task `sources` array:

```json
{
  "title": "2024 CRESCENDO Game Manual",
  "url": "https://example.com/exact-manual-url",
  "publisher": "FIRST",
  "year": 2024,
  "note": "Supports the ranking point terminology used in the prompt and rubric."
}
```

Good notes explain what the source supports. Examples:

- "Supports exact scoring objective language in the prompt."
- "Team Update 12 changed the relevant penalty wording."
- "TBA event data used for match-level context."
- "Chief Delphi discussion used only as community meta context, not as official rule authority."

## Quoting and Paraphrasing

Prefer paraphrase over copying. Do not paste large manual sections, long Chief Delphi posts, or large chunks of outside text into benchmark JSON.

Good benchmark tasks summarize the relevant situation and cite where reviewers can check details. If you need an exact quote, keep it short and include the source URL. The prompt should test reasoning, not reproduce copyrighted source material.

## Verification Status

- `unverified`: draft, generic, or needs source review.
- `community_reviewed`: reviewed by knowledgeable FRC contributors, but not fully source-cited.
- `source_verified`: supported by official or high-quality public sources attached in `sources`.

Only mark official rule questions as `source_verified` when official FIRST materials support them. Do not promote a rule task based only on memory or community discussion.

## What Should Stay Unverified

Keep a task `unverified` when:

- the exact manual section has not been checked
- the prompt mentions penalties, protected areas, ranking points, or endgame legality without official citations
- the task describes a season meta but has no event, team, or community-source support
- the expected answer relies on personal memory
- the wording could imply a universal claim across all regions or event levels
- the task is intentionally generic and not meant to assert official facts

Unverified tasks are still useful. They just need clear `sourceNote` guidance so the next reviewer knows what to check.
