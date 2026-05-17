import { Badge } from '../ui/Badge';
import type { BenchmarkPack, ModelProviderConfig } from '../../types/benchmark';
import type { BenchmarkPackLintReport } from '../../lib/lintBenchmarkPack';

interface TopStatusBarProps {
  pack: BenchmarkPack;
  config: ModelProviderConfig;
  demoMode: boolean;
  report: BenchmarkPackLintReport;
}

export function TopStatusBar({ pack, config, demoMode, report }: TopStatusBarProps) {
  const verificationSummary = Object.entries(report.verificationStatusDistribution)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `${status}: ${count}`)
    .join(' · ');

  return (
    <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-field-black px-4 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="truncate text-sm font-medium text-white">{pack.name}</span>
        <Badge tone="blue">{pack.version}</Badge>
        <Badge>{pack.tasks.length} tasks</Badge>
        <Badge tone={report.errors.length ? 'red' : 'green'}>{report.errors.length} errors</Badge>
        <Badge tone={report.warnings.length ? 'amber' : 'green'}>{report.warnings.length} warnings</Badge>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="truncate">Model: {demoMode ? 'demo mode' : config.modelName || 'not set'}</span>
        <span>Mode: {demoMode ? 'Demo' : 'API'}</span>
        <span className="hidden max-w-md truncate xl:inline">{verificationSummary}</span>
      </div>
    </header>
  );
}
