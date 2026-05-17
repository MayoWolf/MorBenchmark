import { Bot, Github, Home, LockKeyhole, Play, Scale, ShieldCheck, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { sampleBenchmarkPack } from './data/sampleBenchmarks';
import { BenchmarkRunner } from './components/BenchmarkRunner';
import { ResultsSummary } from './components/ResultsSummary';
import type { BenchmarkPack, BenchmarkResult, ModelProviderConfig } from './types/benchmark';

type Page = 'home' | 'runner' | 'results' | 'scoring';

const defaultConfig: ModelProviderConfig = {
  providerName: 'OpenAI-compatible API',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelName: 'gpt-4o-mini',
  temperature: 0.2,
  maxTokens: 700,
  storagePreference: 'none',
};

function App() {
  const [page, setPage] = useState<Page>('home');
  const [demoMode, setDemoMode] = useState(true);
  const [config, setConfig] = useState<ModelProviderConfig>(() => loadStoredConfig());
  const [benchmarkPack, setBenchmarkPack] = useState<BenchmarkPack>(sampleBenchmarkPack);
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  const stats = useMemo(() => {
    const seasons = new Set(benchmarkPack.tasks.map((task) => task.season));
    const categories = new Set(benchmarkPack.tasks.map((task) => task.category));
    return {
      tasks: benchmarkPack.tasks.length,
      seasons: seasons.size,
      categories: categories.size,
      packName: benchmarkPack.name,
      packVersion: benchmarkPack.version,
    };
  }, [benchmarkPack]);

  const updateScore = (questionId: string, score: number) => {
    setResults((current) =>
      current.map((result) =>
        result.questionId === questionId
          ? { ...result, score: Math.min(result.maxScore, Math.max(0, score)) }
          : result,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-field-black text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-field-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <button type="button" onClick={() => setPage('home')} className="flex items-center gap-3 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-blue-300/30 bg-blue-400/10">
              <Bot className="h-6 w-6 text-blue-200" />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-wide text-white">FRCBench</p>
              <p className="text-xs text-slate-400">Open community LLM benchmark</p>
            </div>
          </button>

          <nav className="flex flex-wrap gap-2">
            <NavButton active={page === 'home'} onClick={() => setPage('home')} icon={<Home className="h-4 w-4" />}>
              Home
            </NavButton>
            <NavButton active={page === 'runner'} onClick={() => setPage('runner')} icon={<Play className="h-4 w-4" />}>
              Runner
            </NavButton>
            <NavButton
              active={page === 'results'}
              onClick={() => setPage('results')}
              icon={<Trophy className="h-4 w-4" />}
            >
              Results
            </NavButton>
            <NavButton
              active={page === 'scoring'}
              onClick={() => setPage('scoring')}
              icon={<Scale className="h-4 w-4" />}
            >
              Scoring
            </NavButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {page === 'home' && (
          <HomePage stats={stats} onStart={() => setPage('runner')} />
        )}
        {page === 'runner' && (
          <BenchmarkRunner
            config={config}
            demoMode={demoMode}
            benchmarkPack={benchmarkPack}
            onConfigChange={setConfig}
            onDemoModeChange={setDemoMode}
            onBenchmarkPackChange={(pack) => {
              setBenchmarkPack(pack);
              setResults([]);
            }}
            onResults={setResults}
          />
        )}
        {page === 'results' && (
          <ResultsSummary
            results={results}
            benchmarkVersion={benchmarkPack.version}
            onUpdateScore={updateScore}
          />
        )}
        {page === 'scoring' && <ScoringGuide />}
      </main>
    </div>
  );
}

function HomePage({
  stats,
  onStart,
}: {
  stats: { tasks: number; seasons: number; categories: number; packName: string; packVersion: string };
  onStart: () => void;
}) {
  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-sm text-blue-100">
            <ShieldCheck className="h-4 w-4" />
            FOSS, BYO keys, browser-only v1
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
            Benchmark LLMs on FRC strategy, rules reasoning, scouting, and match analysis.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            FRCBench is a community benchmark for evaluating how models reason about FIRST Robotics Competition
            seasons without turning every answer into a trivia contest. It starts with transparent JSON datasets,
            a generic OpenAI-compatible adapter, and exportable local results.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onStart} className="button-primary">
              <Play className="h-4 w-4" />
              Open benchmark runner
            </button>
            <a
              href="https://github.com/"
              className="button-secondary"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="h-4 w-4" />
              FOSS-ready project
            </a>
          </div>
        </div>

        <div className="arena-visual" aria-hidden="true">
          <div className="arena-grid">
            {Array.from({ length: 24 }).map((_, index) => (
              <span key={index} className={index % 5 === 0 ? 'node-red' : index % 4 === 0 ? 'node-blue' : ''} />
            ))}
          </div>
          <div className="arena-card">
            <p className="text-sm uppercase tracking-widest text-slate-400">Sample pack</p>
            <p className="mt-2 text-4xl font-semibold text-white">{stats.tasks}</p>
            <p className="text-slate-300">tasks across {stats.seasons} seasons</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-field-blue via-emerald-400 to-field-red" />
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {stats.categories} categories in {stats.packName} {stats.packVersion}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={<LockKeyhole className="h-5 w-5" />}
          title="No paid backend"
          body="API keys stay in localStorage or sessionStorage only if you choose to save them. Calls go directly from your browser to the provider endpoint you configure."
        />
        <InfoCard
          icon={<Bot className="h-5 w-5" />}
          title="OpenAI-compatible first"
          body="Use OpenAI-style /chat/completions endpoints including OpenRouter-style gateways and compatible local servers when CORS allows it."
        />
        <InfoCard
          icon={<Trophy className="h-5 w-5" />}
          title="Reviewable results"
          body="Multiple choice and keyword tasks auto-score in v1. Rubric tasks are captured for manual review with JSON and CSV export."
        />
      </section>

      <section className="rounded-lg border border-white/10 bg-field-panel p-5">
        <h2 className="text-xl font-semibold text-white">Privacy note</h2>
        <p className="mt-2 leading-7 text-slate-300">
          FRCBench runs in your browser. Your API key is stored locally if you choose to save it. Benchmark prompts and
          responses are not uploaded to an FRCBench server in v1.
        </p>
      </section>
    </div>
  );
}

function ScoringGuide() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-field-panel p-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-blue-200">
          <Scale className="h-4 w-4" />
          Scoring
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">How FRCBench scores v1 runs</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          FRCBench favors transparent scoring over pretending that subjective strategy answers can be judged perfectly.
          The exported result file includes model answers, expected answers, notes, and task metadata so people can audit
          scores after a run.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard
          icon={<Trophy className="h-5 w-5" />}
          title="Exact and multiple choice"
          body="Multiple-choice tasks use exact letter matching against expectedAnswer. This is useful for smoke tests and clear factual checks, but it should not dominate a strategy benchmark."
        />
        <InfoCard
          icon={<Scale className="h-5 w-5" />}
          title="Keyword scoring"
          body="Short-answer and JSON tasks use rubric keywords as a first-pass signal. Keyword scoring is explainable, but it can miss good paraphrases and reward shallow wording."
        />
        <InfoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Manual rubric review"
          body="Rubric and manual tasks are captured with a zero starting score in v1 so reviewers can inspect the answer and adjust the score in the results table."
        />
        <InfoCard
          icon={<Bot className="h-5 w-5" />}
          title="Judge models later"
          body="Model-judge grading is not automatic yet because judges can share blind spots with the tested model, prefer verbose answers, and encode provider-specific bias."
        />
      </section>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-lg border border-white/10 bg-field-panel p-5">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-400/10 text-blue-200">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 leading-7 text-slate-400">{body}</p>
    </article>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
        active ? 'bg-blue-400/15 text-blue-100' : 'text-slate-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function loadStoredConfig(): ModelProviderConfig {
  const stored = sessionStorage.getItem('frcbench:modelConfig') ?? localStorage.getItem('frcbench:modelConfig');

  if (!stored) {
    return defaultConfig;
  }

  try {
    return { ...defaultConfig, ...JSON.parse(stored) } as ModelProviderConfig;
  } catch {
    return defaultConfig;
  }
}

export default App;
