import { Download, ExternalLink, Gauge, TableProperties, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { downloadCsv, downloadJson } from '../lib/exportResults';
import { calculateScoreBreakdown } from '../lib/scoring';
import type { BenchmarkPack, BenchmarkResult, ModelProviderConfig, ScoreBreakdown } from '../types/benchmark';
import { LeaderboardSubmitPanel } from './LeaderboardSubmitPanel';
import { SignedResultExport } from './SignedResultExport';

interface ResultsSummaryProps {
  results: BenchmarkResult[];
  benchmarkVersion: string;
  benchmarkPack: BenchmarkPack;
  config: ModelProviderConfig;
  onUpdateScore: (questionId: string, score: number) => void;
}

export function ResultsSummary({
  results,
  benchmarkVersion,
  benchmarkPack,
  config,
  onUpdateScore,
}: ResultsSummaryProps) {
  const summary = useMemo(() => calculateScoreBreakdown(results), [results]);
  const [selectedResult, setSelectedResult] = useState<BenchmarkResult | null>(null);

  const exportPayload = {
    app: 'FRCBench' as const,
    benchmarkVersion,
    exportedAt: new Date().toISOString(),
    summary,
    results,
  };

  if (!results.length) {
    return (
      <section className="rounded-lg border border-dashed border-white/15 bg-field-panel p-8 text-center">
        <Gauge className="mx-auto h-10 w-10 text-slate-500" />
        <h2 className="mt-4 text-2xl font-semibold text-white">No results yet</h2>
        <p className="mt-2 text-slate-400">Run the demo mode or connect an OpenAI-compatible API to populate this page.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-field-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-blue-200">
              <Gauge className="h-4 w-4" />
              Results
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {summary.totalScore}/{summary.totalMaxScore} points
            </h2>
            <p className="text-slate-400">{summary.percentScore}% across {results.length} benchmark tasks</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => downloadJson('frcbench-results.json', exportPayload)} className="button-secondary">
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button type="button" onClick={() => downloadCsv('frcbench-results.csv', results)} className="button-secondary">
              <TableProperties className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      <LeaderboardSubmitPanel pack={benchmarkPack} results={results} config={config} />

      <SignedResultExport pack={benchmarkPack} results={results} config={config} />

      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownCard title="Category breakdown" breakdown={summary.byCategory} />
        <BreakdownCard title="Season breakdown" breakdown={summary.bySeason} />
        <BreakdownCard title="Difficulty breakdown" breakdown={summary.byDifficulty} />
      </div>

      <section className="overflow-hidden rounded-lg border border-white/10 bg-field-panel">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-semibold text-white">Result details</h2>
          <p className="mt-1 text-sm text-slate-400">
            Rubric and manual tasks start at zero in v1 so humans can review and adjust them.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/[0.03] text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Season</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Latency</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {results.map((result) => (
                <tr
                  key={result.questionId}
                  className="cursor-pointer align-top text-slate-300 transition hover:bg-white/[0.03]"
                  onClick={() => setSelectedResult(result)}
                >
                  <td className="px-4 py-3 font-medium text-white">{result.questionId}</td>
                  <td className="px-4 py-3">{result.season}</td>
                  <td className="px-4 py-3">{result.category}</td>
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`Score for ${result.questionId}`}
                        type="number"
                        min={0}
                        max={result.maxScore}
                        step={0.5}
                        value={result.score}
                        onChange={(event) => onUpdateScore(result.questionId, Number(event.target.value))}
                        className="w-20 rounded-md border border-white/10 bg-field-black px-2 py-1 text-white"
                      />
                      <span>/ {result.maxScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{result.latency} ms</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedResult(result);
                      }}
                      className="text-blue-200 hover:text-blue-100"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedResult && (
        <ResultDetailsModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
          onUpdateScore={(questionId, score) => {
            onUpdateScore(questionId, score);
            setSelectedResult((current) =>
              current && current.questionId === questionId ? { ...current, score } : current,
            );
          }}
        />
      )}
    </div>
  );
}

function BreakdownCard({ title, breakdown }: { title: string; breakdown: ScoreBreakdown['byCategory'] }) {
  const rows = Object.entries(breakdown).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="rounded-lg border border-white/10 bg-field-panel p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map(([label, bucket]) => (
          <div key={label}>
            <div className="flex justify-between gap-4 text-sm">
              <span className="truncate text-slate-300">{label}</span>
              <span className="text-slate-400">{bucket.score}/{bucket.maxScore} ({bucket.percent}%)</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${bucket.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnswerBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">{text}</p>
    </div>
  );
}

function ResultDetailsModal({
  result,
  onClose,
  onUpdateScore,
}: {
  result: BenchmarkResult;
  onClose: () => void;
  onUpdateScore: (questionId: string, score: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-white/10 bg-field-panel shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-white/10 bg-field-panel p-5">
          <div>
            <p className="text-sm uppercase tracking-wider text-blue-200">Result details</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{result.questionId}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {result.gameName ? `${result.gameName} · ` : ''}
              {result.season} · {result.category} · {result.difficulty}
            </p>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-3" aria-label="Close result details">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <AnswerBlock title="Prompt" text={result.prompt} />
            <AnswerBlock title="Model answer" text={result.modelAnswer} />
            <AnswerBlock title="Expected answer" text={result.expectedAnswer} />
            {result.notes && <AnswerBlock title="Scoring notes" text={result.notes} />}
            {result.sourceNote && <AnswerBlock title="Source notes" text={result.sourceNote} />}

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rubric</h4>
              {result.rubric?.length ? (
                <ul className="mt-2 space-y-2">
                  {result.rubric.map((item) => (
                    <li key={`${item.point}-${item.points}`} className="rounded-md border border-white/10 bg-field-black p-3 text-sm text-slate-200">
                      <span className="font-medium text-white">{item.points} pt:</span> {item.point}
                      {item.keywords?.length ? (
                        <span className="mt-1 block text-xs text-slate-500">Keywords: {item.keywords.join(', ')}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No rubric was provided for this task.</p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sources</h4>
              {result.sources?.length ? (
                <ul className="mt-2 space-y-2">
                  {result.sources.map((source) => (
                    <li key={`${source.title}-${source.url}`} className="rounded-md border border-white/10 bg-field-black p-3 text-sm text-slate-200">
                      <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-200 hover:text-blue-100">
                        {source.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="mt-1 text-xs text-slate-500">
                        {source.publisher}, {source.year}. {source.note}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No citations are attached to this task yet.</p>
              )}
            </div>
          </div>

          <aside className="space-y-4 rounded-lg border border-white/10 bg-field-rail p-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Score</h3>
              <div className="mt-2 flex items-center gap-2">
                <input
                  aria-label={`Score for ${result.questionId}`}
                  type="number"
                  min={0}
                  max={result.maxScore}
                  step={0.5}
                  value={result.score}
                  onChange={(event) => onUpdateScore(result.questionId, Number(event.target.value))}
                  className="w-24 rounded-md border border-white/10 bg-field-black px-2 py-1 text-white"
                />
                <span className="text-slate-300">/ {result.maxScore}</span>
              </div>
            </div>
            <MetaItem label="Verification" value={result.verificationStatus ?? 'unverified'} />
            <MetaItem label="Scoring type" value={result.scoringType} />
            <MetaItem label="Model" value={result.modelName} />
            <MetaItem label="Latency" value={`${result.latency} ms`} />
            <MetaItem label="Timestamp" value={result.timestamp} />
            <div>
              <h3 className="text-sm font-semibold text-white">Tags</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.tags?.length ? (
                  result.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No tags</span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{label}</h3>
      <p className="mt-1 break-words text-sm text-slate-400">{value}</p>
    </div>
  );
}
