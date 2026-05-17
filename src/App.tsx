import { useMemo, useState } from 'react';
import { BenchmarkRunner } from './components/BenchmarkRunner';
import { AppShell } from './components/layout/AppShell';
import type { AppPage } from './components/layout/types';
import { DocsScoringPage } from './components/pages/DocsScoringPage';
import { OverviewPage } from './components/pages/OverviewPage';
import { PackQualityReport } from './components/PackQualityReport';
import { ResultsSummary } from './components/ResultsSummary';
import { SignedResultExport } from './components/SignedResultExport';
import { TaskBrowser } from './components/TaskBrowser';
import { Panel, PanelHeader } from './components/ui/Panel';
import { builtInBenchmarkPacks, defaultBenchmarkPack } from './data/benchmarkPacks';
import { lintTypedBenchmarkPack } from './lib/lintBenchmarkPack';
import type { BenchmarkPack, BenchmarkResult, ModelProviderConfig } from './types/benchmark';

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
  const [page, setPage] = useState<AppPage>('overview');
  const [demoMode, setDemoMode] = useState(true);
  const [config, setConfig] = useState<ModelProviderConfig>(() => loadStoredConfig());
  const [benchmarkPack, setBenchmarkPack] = useState<BenchmarkPack>(defaultBenchmarkPack);
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  const qualityReport = useMemo(() => lintTypedBenchmarkPack(benchmarkPack), [benchmarkPack]);

  const updateScore = (questionId: string, score: number) => {
    setResults((current) =>
      current.map((result) =>
        result.questionId === questionId
          ? { ...result, score: Math.min(result.maxScore, Math.max(0, score)) }
          : result,
      ),
    );
  };

  const changePack = (pack: BenchmarkPack) => {
    setBenchmarkPack(pack);
    setResults([]);
  };

  return (
    <AppShell
      page={page}
      onPageChange={setPage}
      pack={benchmarkPack}
      config={config}
      demoMode={demoMode}
      report={qualityReport}
    >
      {page === 'overview' && (
        <OverviewPage
          pack={benchmarkPack}
          builtInPacks={builtInBenchmarkPacks}
          report={qualityReport}
          onPackChange={changePack}
        />
      )}

      {page === 'tasks' && <TaskBrowser tasks={benchmarkPack.tasks} />}

      {page === 'run' && (
        <BenchmarkRunner
          config={config}
          demoMode={demoMode}
          benchmarkPack={benchmarkPack}
          onConfigChange={setConfig}
          onDemoModeChange={setDemoMode}
          onResults={setResults}
        />
      )}

      {page === 'results' && (
        <ResultsSummary
          results={results}
          benchmarkVersion={benchmarkPack.version}
          benchmarkPack={benchmarkPack}
          config={config}
          onUpdateScore={updateScore}
        />
      )}

      {page === 'quality' && <PackQualityReport pack={benchmarkPack} />}

      {page === 'verify' && (
        <div className="space-y-4">
          <Panel>
            <PanelHeader eyebrow="Verify" title="Signed result manifests" />
            <div className="p-4 text-sm leading-6 text-slate-300">
              Generate, download, import, and verify signed result JSON. Verification is tamper evidence, not proof that
              a run was honest.
            </div>
          </Panel>
          <SignedResultExport pack={benchmarkPack} results={results} config={config} />
        </div>
      )}

      {page === 'docs' && <DocsScoringPage />}
    </AppShell>
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
