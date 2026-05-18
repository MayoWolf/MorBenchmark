import { RefreshCw, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fetchLeaderboardRuns,
  type LeaderboardRun,
} from '../../lib/leaderboard/leaderboardService';
import type { BenchmarkPack, BenchmarkResult, ModelProviderConfig } from '../../types/benchmark';
import { LeaderboardSubmitPanel } from '../LeaderboardSubmitPanel';
import { Button } from '../ui/Button';
import { Panel, PanelHeader } from '../ui/Panel';
import { DataTable, StickyHeader, TableShell } from '../ui/Table';

interface LeaderboardPageProps {
  pack: BenchmarkPack;
  results: BenchmarkResult[];
  config: ModelProviderConfig;
}

export function LeaderboardPage({ pack, results, config }: LeaderboardPageProps) {
  const [runs, setRuns] = useState<LeaderboardRun[]>([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadRuns = async () => {
    setIsLoading(true);
    setStatus('');
    try {
      setRuns(await fetchLeaderboardRuns());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load leaderboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  return (
    <div className="space-y-4">
      <LeaderboardSubmitPanel pack={pack} results={results} config={config} onSubmitted={loadRuns} />

      <Panel>
        <PanelHeader eyebrow="Public runs" title="Leaderboard">
          <div className="flex items-center gap-2">
            <Button type="button" onClick={loadRuns} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {status && <span className="text-sm text-slate-300">{status}</span>}
          </div>
        </PanelHeader>
        <TableShell>
          <DataTable>
            <StickyHeader>
              <tr>
                <th className="px-3 py-2 font-medium">Rank</th>
                <th className="px-3 py-2 font-medium">Submitter</th>
                <th className="px-3 py-2 font-medium">Model</th>
                <th className="px-3 py-2 font-medium">Pack</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Tasks</th>
                <th className="px-3 py-2 font-medium">Signature</th>
                <th className="px-3 py-2 font-medium">Submitted</th>
              </tr>
            </StickyHeader>
            <tbody className="divide-y divide-white/10">
              {runs.map((run, index) => (
                <tr key={run.id} className="text-slate-300">
                  <td className="px-3 py-2 font-mono text-slate-500">#{index + 1}</td>
                  <td className="px-3 py-2">
                    {run.display_name}
                    {run.team_number ? <span className="ml-2 text-xs text-slate-500">FRC {run.team_number}</span> : null}
                  </td>
                  <td className="px-3 py-2">{run.model_name}</td>
                  <td className="px-3 py-2">{run.benchmark_pack_id}@{run.benchmark_pack_version}</td>
                  <td className="px-3 py-2 font-mono text-white">{run.total_score}/{run.max_score} ({run.percent_score}%)</td>
                  <td className="px-3 py-2">{run.task_count}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-emerald-200">
                      <Trophy className="h-3 w-3" />
                      {run.public_key_fingerprint ?? 'signed'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{new Date(run.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                    No leaderboard runs found.
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
        </TableShell>
      </Panel>
    </div>
  );
}
