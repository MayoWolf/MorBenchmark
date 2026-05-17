import { AlertTriangle, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { lintTypedBenchmarkPack } from '../lib/lintBenchmarkPack';
import type { BenchmarkPack } from '../types/benchmark';

interface PackQualityReportProps {
  pack: BenchmarkPack;
}

export function PackQualityReport({ pack }: PackQualityReportProps) {
  const [showIssues, setShowIssues] = useState(false);
  const report = useMemo(() => lintTypedBenchmarkPack(pack), [pack]);
  const issueGroups = Object.entries(report.issuesByTask).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="rounded-lg border border-white/10 bg-field-panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-blue-200">
            <BarChart3 className="h-4 w-4" />
            Pack quality report
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">{report.taskCount} tasks checked</h2>
          <p className="mt-1 text-sm text-slate-400">
            Errors block contribution checks. Warnings are review prompts for maintainers.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Metric
            icon={<XCircle className="h-4 w-4" />}
            label="Errors"
            value={report.errors.length}
            tone={report.errors.length ? 'red' : 'green'}
          />
          <Metric
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Warnings"
            value={report.warnings.length}
            tone={report.warnings.length ? 'amber' : 'green'}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <Distribution title="Categories" data={report.categoryDistribution} />
        <Distribution title="Seasons" data={report.seasonDistribution} />
        <Distribution title="Scoring" data={report.scoringTypeDistribution} />
        <Distribution title="Verification" data={report.verificationStatusDistribution} />
      </div>

      <div className="mt-5">
        <button type="button" className="button-secondary" onClick={() => setShowIssues((current) => !current)}>
          {showIssues ? 'Hide issues' : 'Show issues'}
        </button>
      </div>

      {showIssues && (
        <div className="mt-4 space-y-3">
          {issueGroups.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              No lint issues found.
            </div>
          ) : (
            issueGroups.map(([taskId, issues]) => (
              <article key={taskId} className="rounded-md border border-white/10 bg-field-black p-4">
                <h3 className="font-semibold text-white">{taskId}</h3>
                <ul className="mt-3 space-y-2">
                  {issues.map((issue) => (
                    <li key={`${issue.severity}-${issue.message}`} className="flex gap-2 text-sm">
                      <span
                        className={
                          issue.severity === 'error'
                            ? 'font-semibold text-red-200'
                            : 'font-semibold text-amber-200'
                        }
                      >
                        {issue.severity}
                      </span>
                      <span className="text-slate-300">{issue.message}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: 'green' | 'red' | 'amber';
}) {
  const toneClass =
    tone === 'red'
      ? 'border-red-300/30 bg-red-400/10 text-red-100'
      : tone === 'amber'
        ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
        : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100';

  return (
    <div className={`rounded-md border px-4 py-3 ${toneClass}`}>
      <div className="flex items-center gap-2 text-sm">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Distribution({ title, data }: { title: string; data: Record<string, number> }) {
  const rows = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const total = rows.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-lg border border-white/10 bg-field-rail p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.map(([label, count]) => {
          const width = total === 0 ? 0 : Math.max(6, Math.round((count / total) * 100));
          return (
            <div key={label}>
              <div className="flex justify-between gap-3 text-xs text-slate-400">
                <span className="truncate">{label}</span>
                <span>{count}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-blue-400" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
