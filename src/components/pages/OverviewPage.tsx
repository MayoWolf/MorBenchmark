import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BenchmarkPackManager } from '../BenchmarkPackManager';
import { Badge } from '../ui/Badge';
import { Panel, PanelHeader } from '../ui/Panel';
import type { BenchmarkPack } from '../../types/benchmark';
import type { BenchmarkPackLintReport } from '../../lib/lintBenchmarkPack';

interface OverviewPageProps {
  pack: BenchmarkPack;
  builtInPacks: BenchmarkPack[];
  report: BenchmarkPackLintReport;
  onPackChange: (pack: BenchmarkPack) => void;
}

export function OverviewPage({ pack, builtInPacks, report, onPackChange }: OverviewPageProps) {
  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">FRCBench benchmark dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Evaluate LLM performance on FRC strategy, rules reasoning, scouting interpretation, alliance selection,
              match analysis, and historical season meta. Runs are client-side; users bring their own API keys.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">Loaded {pack.tasks.length} tasks</Badge>
            <Badge tone="blue">{pack.version}</Badge>
          </div>
        </div>
      </Panel>

      <BenchmarkPackManager pack={pack} builtInPacks={builtInPacks} onPackChange={onPackChange} />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <PanelHeader eyebrow="Distribution" title="Benchmark coverage" />
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <DistributionTable title="Categories" data={report.categoryDistribution} />
            <DistributionTable title="Seasons" data={report.seasonDistribution} />
            <DistributionTable title="Verification" data={report.verificationStatusDistribution} />
            <DistributionTable title="Scoring" data={report.scoringTypeDistribution} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Quality" title="Pack lint status" />
          <div className="space-y-3 p-4">
            <QualityMetric
              label="Errors"
              count={report.errors.length}
              okText="No blocking pack errors."
              issueText="Blocking pack errors need fixes before contribution."
              tone={report.errors.length ? 'red' : 'green'}
            />
            <QualityMetric
              label="Warnings"
              count={report.warnings.length}
              okText="No review warnings."
              issueText="Warnings are review prompts, not blockers."
              tone={report.warnings.length ? 'amber' : 'green'}
            />
            <p className="text-sm text-slate-400">
              Sanity check: Loaded {pack.tasks.length} tasks from{' '}
              <span className="font-mono text-slate-200">
                {pack.id === 'frc-strategy-history' ? 'frc-strategy-history-v0.1.0' : pack.id}
              </span>
              .
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function DistributionTable({ title, data }: { title: string; data: Record<string, number> }) {
  const rows = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="overflow-hidden rounded border border-white/10">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-white/10">
            {rows.map(([label, count]) => (
              <tr key={label}>
                <td className="px-3 py-2 text-slate-300">{label}</td>
                <td className="px-3 py-2 text-right font-mono text-slate-400">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QualityMetric({
  label,
  count,
  okText,
  issueText,
  tone,
}: {
  label: string;
  count: number;
  okText: string;
  issueText: string;
  tone: 'green' | 'amber' | 'red';
}) {
  const icon =
    tone === 'green' ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />;
  const textClass = tone === 'red' ? 'text-red-200' : tone === 'amber' ? 'text-amber-200' : 'text-emerald-200';

  return (
    <div className="rounded border border-white/10 bg-field-rail p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-white">{icon}{label}</span>
        <span className={`font-mono text-sm ${textClass}`}>{count}</span>
      </div>
      <p className="mt-1 text-sm text-slate-400">{count ? issueText : okText}</p>
    </div>
  );
}
