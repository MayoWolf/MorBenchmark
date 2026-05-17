import { Loader2, Square, Timer, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getDemoModelResponse } from '../lib/demoResponses';
import { callOpenAICompatibleChat } from '../lib/modelAdapters/openAICompatible';
import { scoreAnswer } from '../lib/scoring';
import type {
  BenchmarkCategory,
  BenchmarkPack,
  BenchmarkResult,
  BenchmarkRunConfig,
  BenchmarkTask,
  ModelProviderConfig,
} from '../types/benchmark';
import { ModelConfig } from './ModelConfig';
import { Button } from './ui/Button';
import { Panel, PanelHeader } from './ui/Panel';

interface BenchmarkRunnerProps {
  config: ModelProviderConfig;
  demoMode: boolean;
  benchmarkPack: BenchmarkPack;
  onConfigChange: (config: ModelProviderConfig) => void;
  onDemoModeChange: (enabled: boolean) => void;
  onResults: (results: BenchmarkResult[]) => void;
}

export function BenchmarkRunner({
  config,
  demoMode,
  benchmarkPack,
  onConfigChange,
  onDemoModeChange,
  onResults,
}: BenchmarkRunnerProps) {
  const categories = useMemo(
    () => Array.from(new Set(benchmarkPack.tasks.map((task) => task.category))).sort() as BenchmarkCategory[],
    [benchmarkPack],
  );
  const seasons = useMemo(
    () => Array.from(new Set(benchmarkPack.tasks.map((task) => task.season))).sort((a, b) => b - a),
    [benchmarkPack],
  );
  const [selectedCategories, setSelectedCategories] = useState<BenchmarkCategory[]>(categories);
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>(seasons);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(`Ready to run ${benchmarkPack.version}`);
  const [runResults, setRunResults] = useState<BenchmarkResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSelectedCategories(categories);
    setSelectedSeasons(seasons);
    setRunResults([]);
    onResults([]);
    setProgress(0);
    setStatusMessage(`Ready to run ${benchmarkPack.version}`);
  }, [benchmarkPack, categories, seasons, onResults]);

  const selectedTasks = benchmarkPack.tasks.filter(
    (task) => selectedCategories.includes(task.category) && selectedSeasons.includes(task.season),
  );

  const runConfig: BenchmarkRunConfig = {
    provider: config,
    selectedCategories,
    selectedSeasons,
    demoMode,
  };

  const startRun = async () => {
    if (!selectedTasks.length) {
      setStatusMessage('Select at least one task before running.');
      return;
    }

    if (!demoMode && (!config.baseUrl.trim() || !config.modelName.trim())) {
      setStatusMessage('Add an API base URL and model name, or use demo mode.');
      return;
    }

    const abortController = new AbortController();
    abortRef.current = abortController;
    setIsRunning(true);
    setProgress(0);
    setRunResults([]);
    onResults([]);
    setStatusMessage(`Running ${selectedTasks.length} tasks from ${benchmarkPack.version}...`);

    const nextResults: BenchmarkResult[] = [];

    for (const [index, task] of selectedTasks.entries()) {
      if (abortController.signal.aborted) {
        break;
      }

      setStatusMessage(`Running ${task.id} (${index + 1}/${selectedTasks.length})`);

      try {
        const modelResponse = runConfig.demoMode
          ? await getDemoModelResponse(task)
          : await callOpenAICompatibleChat(
              runConfig.provider,
              [
                {
                  role: 'system',
                  content:
                    'You are being evaluated by FRCBench. Answer the FRC benchmark task directly and avoid inventing official rule details. If exact official verification is needed, say so.',
                },
                {
                  role: 'user',
                  content: formatTaskPrompt(task),
                },
              ],
              abortController.signal,
            );

        const scored = scoreAnswer(task, modelResponse.content);
        const result: BenchmarkResult = {
          questionId: task.id,
          gameName: task.gameName,
          prompt: formatTaskPrompt(task),
          modelAnswer: modelResponse.content,
          expectedAnswer: task.expectedAnswer,
          score: scored.score,
          maxScore: scored.maxScore,
          category: task.category,
          season: task.season,
          difficulty: task.difficulty,
          latency: modelResponse.latency,
          modelName: demoMode ? 'frcbench-demo-model' : config.modelName,
          timestamp: new Date().toISOString(),
          scoringType: task.scoringType,
          rubric: task.rubric,
          tags: task.tags,
          sourceNote: task.sourceNote,
          publicExplanation: task.publicExplanation,
          sources: task.sources,
          verificationStatus: task.verificationStatus ?? 'unverified',
          notes: scored.notes,
        };

        nextResults.push(result);
        setRunResults([...nextResults]);
        onResults([...nextResults]);
      } catch (error) {
        if (abortController.signal.aborted) {
          break;
        }

        const result = buildErrorResult(task, error, config.modelName);
        nextResults.push(result);
        setRunResults([...nextResults]);
        onResults([...nextResults]);
      }

      setProgress(Math.round(((index + 1) / selectedTasks.length) * 100));
    }

    setIsRunning(false);
    abortRef.current = null;
    setStatusMessage(abortController.signal.aborted ? 'Run stopped.' : 'Run complete.');
  };

  const stopRun = () => {
    abortRef.current?.abort();
    setIsRunning(false);
    setStatusMessage('Stopping run...');
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <ModelConfig
        config={config}
        demoMode={demoMode}
        onConfigChange={onConfigChange}
        onDemoModeChange={onDemoModeChange}
      />

      <div className="space-y-4">
        <Panel>
          <PanelHeader eyebrow="Benchmark options" title="Selection" />
          <div className="space-y-4 p-4">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() =>
                        setSelectedCategories((current) =>
                          current.includes(category)
                            ? current.filter((item) => item !== category)
                            : [...current, category],
                        )
                      }
                      className="h-4 w-4 accent-blue-400"
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Seasons</h3>
              <div className="grid grid-cols-3 gap-2">
                {seasons.map((season) => (
                  <label key={season} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedSeasons.includes(season)}
                      onChange={() =>
                        setSelectedSeasons((current) =>
                          current.includes(season)
                            ? current.filter((item) => item !== season)
                            : [...current, season],
                        )
                      }
                      className="h-4 w-4 accent-blue-400"
                    />
                    {season}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Runner" title="Run selected benchmark" />
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">{selectedTasks.length} tasks selected</p>
                <p className="text-xs text-slate-500">{runResults.length} results in current run</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={startRun} disabled={isRunning} variant="primary">
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                  Run selected benchmark
                </Button>
                <Button type="button" onClick={stopRun} disabled={!isRunning}>
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-slate-500" />
                  {statusMessage}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-white/10">
                <div className="h-full rounded bg-blue-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function formatTaskPrompt(task: BenchmarkTask) {
  const choices = task.choices?.length ? `\n\nChoices:\n${task.choices.join('\n')}` : '';
  return `${task.prompt}${choices}`;
}

function buildErrorResult(task: BenchmarkTask, error: unknown, modelName: string): BenchmarkResult {
  const message = error instanceof Error ? error.message : 'Unknown run error.';
  return {
    questionId: task.id,
    gameName: task.gameName,
    prompt: formatTaskPrompt(task),
    modelAnswer: `ERROR: ${message}`,
    expectedAnswer: task.expectedAnswer,
    score: 0,
    maxScore: task.rubric.reduce((total, item) => total + item.points, 0) || 1,
    category: task.category,
    season: task.season,
    difficulty: task.difficulty,
    latency: 0,
    modelName,
    timestamp: new Date().toISOString(),
    scoringType: task.scoringType,
    rubric: task.rubric,
    tags: task.tags,
    sourceNote: task.sourceNote,
    publicExplanation: task.publicExplanation,
    sources: task.sources,
    verificationStatus: task.verificationStatus ?? 'unverified',
    notes: 'Request failed. Check API key, CORS, rate limits, base URL, or endpoint compatibility.',
  };
}
