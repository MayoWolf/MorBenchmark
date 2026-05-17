import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopStatusBar } from './TopStatusBar';
import type { AppPage } from './types';
import type { BenchmarkPack, ModelProviderConfig } from '../../types/benchmark';
import type { BenchmarkPackLintReport } from '../../lib/lintBenchmarkPack';

interface AppShellProps {
  page: AppPage;
  onPageChange: (page: AppPage) => void;
  pack: BenchmarkPack;
  config: ModelProviderConfig;
  demoMode: boolean;
  report: BenchmarkPackLintReport;
  children: ReactNode;
}

export function AppShell({
  page,
  onPageChange,
  pack,
  config,
  demoMode,
  report,
  children,
}: AppShellProps) {
  return (
    <div className="grid min-h-screen bg-field-black text-slate-100 lg:grid-cols-[220px_1fr]">
      <Sidebar page={page} onPageChange={onPageChange} />
      <div className="min-w-0">
        <TopStatusBar pack={pack} config={config} demoMode={demoMode} report={report} />
        <main className="mx-auto max-w-[1500px] px-4 py-4">{children}</main>
      </div>
    </div>
  );
}
