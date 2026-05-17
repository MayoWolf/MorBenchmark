import { ChevronDown, Download, Gauge, TableProperties } from 'lucide-react';
import { useMemo, useState } from 'react';
import { benchmarkVersion } from '../data/sampleBenchmarks';
import { downloadCsv, downloadJson } from '../lib/exportResults';
import { calculateScoreBreakdown } from '../lib/scoring';
import type { BenchmarkResult, ScoreBreakdown } from '../types/benchmark';

interface ResultsSummaryProps {
  results: BenchmarkResult[];
  onUpdateScore: (questionId: string, score: number) => void;
}

export function ResultsSummary({ results, onUpdateScore }: ResultsSummaryProps) {
  const summary = useMemo(() => calculateScoreBreakdown(results), [results]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
                <th className="px-4 py-3 font-medium">Answer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {results.map((result) => (
                <tr key={result.questionId} className="align-top text-slate-300">
                  <td className="px-4 py-3 font-medium text-white">{result.questionId}</td>
                  <td className="px-4 py-3">{result.season}</td>
                  <td className="px-4 py-3">{result.category}</td>
                  <td className="px-4 py-3">
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
                      onClick={() => setExpanded((current) => ({ ...current, [result.questionId]: !current[result.questionId] }))}
                      className="inline-flex items-center gap-1 text-blue-200 hover:text-blue-100"
                    >
                      <ChevronDown className={`h-4 w-4 transition ${expanded[result.questionId] ? 'rotate-180' : ''}`} />
                      {expanded[result.questionId] ? 'Hide' : 'Expand'}
                    </button>
                    {expanded[result.questionId] && (
                      <div className="mt-3 max-w-2xl space-y-3 rounded-md border border-white/10 bg-field-black p-3">
                        <AnswerBlock title="Prompt" text={result.prompt} />
                        <AnswerBlock title="Model answer" text={result.modelAnswer} />
                        <AnswerBlock title="Expected answer" text={result.expectedAnswer} />
                        {result.notes && <AnswerBlock title="Scoring notes" text={result.notes} />}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
