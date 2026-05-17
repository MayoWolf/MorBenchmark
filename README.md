# FRCBench

FRCBench is a fully open-source browser app for benchmarking LLMs on FIRST Robotics Competition game knowledge, strategy reasoning, season-specific metas, alliance selection, rule interpretation, scouting interpretation, and match analysis.

The v1 app is intentionally backend-free. Users bring their own API keys, and calls go directly from their browser to the OpenAI-compatible endpoint they configure.

## Features

- Vite + React + TypeScript + Tailwind CSS
- Netlify deployable static app
- Generic OpenAI-compatible `/chat/completions` adapter
- Demo mode with fake responses for UI testing
- Model config for base URL, API key, model, temperature, and max tokens
- Versioned JSON benchmark dataset in `src/benchmarks`
- Category and season filtering
- Progress bar and stop/cancel button
- Score summary by category, season, and difficulty
- Expandable results table with manual score adjustment
- JSON and CSV result export

## Privacy and API Keys

FRCBench runs in your browser. Your API key is stored locally if you choose to save it. Benchmark prompts and responses are not uploaded to an FRCBench server in v1.

Browser-based API calls expose keys to your own browser session and the configured provider endpoint. Use restricted or temporary keys when possible. Do not commit real API keys.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

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

## Benchmark JSON

The starter pack lives at:

```text
src/benchmarks/sample-v0.1.0.json
```

Each task supports:

- `id`
- `season`
- `gameName`
- `category`
- `difficulty`
- `prompt`
- `expectedAnswer`
- `scoringType`
- `rubric`
- `tags`
- `sourceNote`
- `publicExplanation`
- optional `choices`

The sample pack uses generic prompts where official FRC details would need verification. Before treating rule-specific tasks as canonical, add official source citations and verify against the season manual, team updates, and event rules.

## Add New Questions

1. Add a new versioned JSON file in `src/benchmarks`.
2. Follow the `BenchmarkTask` shape in `src/types/benchmark.ts`.
3. Keep rule claims source-aware. Use `sourceNote` to identify whether the prompt is verified, generic, or awaiting citation.
4. Add rubric keywords for auto-scored short-answer tasks.
5. Update `src/data/sampleBenchmarks.ts` when switching the active pack.

## Scoring in v1

- Multiple choice: exact letter match.
- Short answer: keyword/rubric matching.
- JSON structured response: keyword/rubric matching plus valid JSON parse credit.
- Rubric/manual answers: stored for human review and editable in the results table.
- Judge-model rubric grading is intentionally stubbed for a future version.

## API Compatibility

The first adapter calls:

```text
{baseUrl}/chat/completions
```

with standard OpenAI chat messages. OpenAI-style providers, OpenRouter-style gateways, and local compatible servers may work if they support browser CORS and the OpenAI chat-completions shape.

## Contributing

FRCBench is meant to be community maintained.

- Keep datasets transparent and versioned.
- Prefer small, reviewable PRs.
- Cite official sources for rule-specific benchmark items.
- Mark uncertain prompts clearly with `sourceNote`.
- Avoid adding analytics or server-side key storage.
- Keep benchmark logic modular so local model runners and future adapters can be added cleanly.

## License

MIT is recommended for the app code. Benchmark datasets may eventually need a separate contribution policy and provenance metadata.

## Roadmap

- Hidden/private benchmark mode
- Community submitted tasks
- Judge-model rubric grading
- Local model runner support
- Leaderboard with signed result files
- Benchmark versioning
- Official source citations for rules
- Per-season packs
- Anti-cheat mode
