# FRC Strategy History Starter Pack v0.1.0 Notes

This pack is a public starter benchmark for evaluating whether LLMs can reason about FRC strategy and history without pretending that every rule or meta claim is already verified.

## Purpose

The pack focuses on recent and historically important FRC seasons, especially 2019, 2020/2021, 2022, 2023, 2024, and 2025. It is meant to seed community review, not to be treated as a final official benchmark.

## Skills Tested

- strategy meta reasoning
- alliance selection and picklist logic
- scouting data interpretation
- qualification ranking-objective tradeoffs
- match analysis and drive-team adjustment
- robot design tradeoffs under build constraints
- source discipline for official rules
- historical context awareness across unusual seasons
- structured JSON response following

## What Still Needs Verification

Most tasks use `verificationStatus: "unverified"` by design. Community reviewers should verify:

- official game names, terminology, and field-element wording
- any prompt that references protected areas, contact, fouls, endgame legality, or ranking objectives
- ranking-point and endgame concepts against the exact season manual
- whether strategy/meta prompts match real event-level observations
- whether expected answers are fair across regional, district, and Championship-level play
- whether rubrics reward the right reasoning instead of only matching keywords

Rule-specific tasks currently include source notes or placeholder official source links. They need exact manual section, team update, or Q&A references before being marked `source_verified`.

## How Community Reviewers Should Improve It

1. Import the pack in FRCBench and confirm it validates.
2. Pick one season at a time and compare rule-adjacent tasks against the official manual and updates.
3. Add precise `sources` entries with title, URL, publisher, year, and note.
4. Change `verificationStatus` only when a task has actually been checked.
5. Replace generic source notes with exact citations where possible.
6. Add region/event context for meta claims instead of presenting one meta as universal.
7. Improve rubrics so they reward reasoning, not just buzzwords.
8. Add examples from The Blue Alliance, Statbotics, Chief Delphi, and team strategy resources when they support community-meta claims.
9. Keep tasks understandable to students and mentors who did not personally play that season.
10. Avoid fake rule numbers, unsupported point values, and confident claims that need official verification.

This pack should become more valuable through review, citation, and debate. The first version is the starting line, not the trophy.
