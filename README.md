# FRCBench

FRCBench is a fully open-source browser app for benchmarking LLMs on FIRST Robotics Competition knowledge and reasoning: game strategy, season-specific metas, alliance selection, rule interpretation, scouting interpretation, robot tradeoffs, ranking-point decisions, and match analysis.

The v1 app is intentionally backend-free. Users bring their own API keys, and calls go directly from their browser to the OpenAI-compatible endpoint they configure.

## Screenshots

Screenshots will be added as the UI stabilizes.

- Home page: `docs/screenshots/home.png`
- Runner and pack import: `docs/screenshots/runner.png`
- Results modal: `docs/screenshots/results-modal.png`

## Benchmark Philosophy

FRCBench should feel useful to FRC people, not only to benchmark hobbyists. The goal is to test whether a model can reason about FRC the way drive coaches, scouts, strategy mentors, and students actually talk:

- distinguish official rules from community meta
- avoid unsupported rule claims and fake citations
- reason about alliance role fit instead of raw stats only
- explain tradeoffs around reliability, ceiling, schedule, traffic, fouls, and partner compatibility
- handle season context without pretending every local event followed the same meta
- make outputs auditable through transparent prompts, expected answers, rubrics, source notes, and exports

## Features

- Vite + React + TypeScript + Tailwind CSS
- Netlify-deployable static app
- Generic OpenAI-compatible `/chat/completions` adapter
- Demo mode with fake responses for UI testing
- Model config for base URL, API key, model, temperature, and max tokens
- Client-side benchmark pack JSON import/export with validation
- Versioned sample benchmark pack in `src/benchmarks`
- Contribution template in `benchmark-packs`
- Category and season filtering
- Progress bar and stop/cancel button
- Score summary by category, season, and difficulty
- Result details modal with prompt, answer, expected answer, rubric, tags, verification status, and sources
- Manual score adjustment
- JSON and CSV result export

## Privacy and BYO API Keys

FRCBench runs in your browser. Your API key is stored locally only if you choose to save it. Benchmark prompts and responses are not uploaded to an FRCBench server in v1.

Browser-based API calls expose keys to your own browser session and the configured provider endpoint. Use restricted or temporary keys when possible. Do not commit real API keys.

FRCBench does not include analytics, a paid backend, or server-side key storage.

## CORS Warning

The OpenAI-compatible adapter calls:

```text
{baseUrl}/chat/completions
```

from the browser with standard OpenAI chat messages. Some providers and local model servers block browser requests with CORS. If a request fails even with a valid API key, check whether the provider allows browser clients or whether your local server needs CORS enabled.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

Before opening a benchmark-pack PR, run:

```bash
npm run check:packs
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Netlify

This repo includes `netlify.toml`.

- Build command: `npm run build`
- Publish directory: `dist`

You can deploy through the Netlify UI, Netlify CLI, or by connecting a Git repository.

## Benchmark Packs

The starter pack lives at:

```text
src/benchmarks/sample-v0.1.0.json
```

Contributor templates live at:

```text
benchmark-packs/template-pack.json
benchmark-packs/README.md
```

Each pack needs:

- `id`
- `name`
- `version`
- `tasks`

Each task needs:

- `id`
- `season`
- `gameName`
- `category`
- `difficulty`
- `prompt`
- `expectedAnswer`
- `scoringType`
- `tags`

Optional task fields include:

- `rubric`
- `choices`
- `sourceNote`
- `publicExplanation`
- `verificationStatus`
- `sources`

The app validates imported packs before loading them and rejects duplicate task ids, missing pack fields, malformed tasks, missing multiple-choice choices, and missing rubric arrays for rubric/manual tasks.

## Pack Quality Checks

FRCBench has two levels of pack checks:

- Errors block CI and should be fixed before review. Examples: missing required fields, duplicate task ids, invalid categories, invalid scoring types, malformed multiple-choice tasks, empty prompts, and structured JSON tasks without a rubric or expected JSON shape.
- Warnings do not fail CI, but they are review prompts. Examples: very short prompts, missing source notes, unverified rule tasks, source-verified tasks without sources, missing public explanations, and cited sources without URLs.

Run the checker locally:

```bash
npm run check:packs
```

## Contributing Benchmark Packs

1. Copy `benchmark-packs/template-pack.json`.
2. Add tasks with stable, unique ids.
3. Use `verificationStatus` honestly: `unverified`, `community_reviewed`, or `source_verified`.
4. Add `sources` for official manuals, team updates, TBA, Statbotics, Chief Delphi discussions, team strategy resources, or public scouting/strategy materials.
5. Do not cite community discussion as an official rule source.
6. Avoid unsupported claims, fake rule numbers, and overgeneralizing one event's meta.
7. Import the pack in the app and fix validation errors before opening a PR.
8. Run `npm run check:packs` and include any intentional warnings in the PR description.

See `benchmark-packs/README.md` for detailed writing guidance, and `benchmark-packs/source-verification-guide.md` for source verification workflow.

To move a task to `source_verified`, add at least one acceptable source and make sure the prompt, expected answer, and rubric are supported by that source. Official rule questions should cite FIRST manuals, team updates, or Q&A. Event data can cite The Blue Alliance or Statbotics. Community meta can cite Chief Delphi, team strategy posts, public presentations, or scouting resources, but those should be described as community evidence rather than official rules.

## Scoring in v1

- Multiple choice: exact letter match.
- Short answer: keyword/rubric matching.
- JSON structured response: keyword/rubric matching plus valid JSON parse credit.
- Rubric/manual answers: stored for human review and editable in the results table.
- Judge-model rubric grading is intentionally not automatic yet because model judges can be biased, reward verbosity, and share blind spots with the tested model.

## Signed Result Exports

FRCBench can create signed result JSON files entirely in the browser. Users generate a local signing key, sign the latest result manifest, and share the signed JSON plus the included public key.

Signed exports prove:

- the manifest has not changed since it was signed
- the file was signed by the private key matching the included public key
- the benchmark pack hash, model settings, score breakdown, task results, and environment note are part of the signed payload

Signed exports do not prove:

- the run was honest
- the model response was generated live
- the benchmark pack was hidden from the user
- browser code was unmodified
- API settings were truthful beyond what the file records

This is useful before a leaderboard because teams, reviewers, and community contributors can share tamper-evident result files without FRCBench running a backend. Users can publish their public key fingerprint in a README, team site, GitHub profile, or Chief Delphi post so later files can be associated with the same signer.

For stronger anti-cheat, FRCBench will still need hidden/private benchmark packs, signed pack releases, reproducible runner builds, and eventually optional server-side or community-reviewed leaderboard workflows.

## License

The app code is MIT licensed. Benchmark datasets may eventually need additional provenance and contribution metadata as community packs mature.

## Roadmap

- v0.2: source-verified public benchmark pack
- v0.3: signed benchmark results
- v0.4: optional leaderboard
- Hidden/private benchmark mode
- Community submitted task review flow
- Judge-model rubric grading with calibration sets
- Better local model runner support
- Pack versioning and compatibility metadata
- Official source citations for rule-specific tasks
- Per-season packs
- Anti-cheat mode
- Screenshot and demo deployment docs
