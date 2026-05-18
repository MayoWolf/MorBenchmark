import { RefreshCw, Send, ShieldCheck, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { hashBenchmarkPack } from '../../lib/hashBenchmarkPack';
import {
  fetchLeaderboardRuns,
  submitLeaderboardRun,
  type LeaderboardRun,
} from '../../lib/leaderboard/leaderboardService';
import {
  createUnsignedResultManifest,
  generateLocalSigningKey,
  loadStoredSigningKey,
  signResultManifest,
} from '../../lib/signResults';
import type { BenchmarkPack, BenchmarkResult, ModelProviderConfig } from '../../types/benchmark';
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
  const [displayName, setDisplayName] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const latestScore = useMemo(() => {
    const score = results.reduce((sum, result) => sum + result.score, 0);
    const max = results.reduce((sum, result) => sum + result.maxScore, 0);
    const percent = max ? Math.round((score / max) * 1000) / 10 : 0;
    return { score, max, percent };
  }, [results]);

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

  const submitLatestRun = async () => {
    if (!results.length) {
      setStatus('Run a benchmark before submitting to the leaderboard.');
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      const signingKey = (await loadStoredSigningKey()) ?? (await generateLocalSigningKey(true));
      const packHash = await hashBenchmarkPack(pack);
      const unsignedManifest = await createUnsignedResultManifest({
        pack,
        packHash,
        results,
        config,
      });
      const signedManifest = await signResultManifest(unsignedManifest, signingKey);
      await submitLeaderboardRun({
        displayName,
        teamNumber: teamNumber.trim() ? Number(teamNumber) : null,
        manifest: signedManifest,
      });
      setStatus('Submitted signed result to the leaderboard.');
      await loadRuns();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not submit leaderboard run.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader eyebrow="Connection" title="Server-side Supabase connection" />
        <div className="space-y-3 p-4 text-sm leading-6 text-slate-300">
          <p>
            Leaderboard reads and submissions go through `/.netlify/functions/leaderboard`. Supabase credentials are read
            only by that Netlify Function from server-side environment variables.
          </p>
          <p className="rounded border border-amber-400/30 bg-amber-400/10 p-3 text-amber-100">
            Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Netlify. Do not use `VITE_` variables and do not expose a
            service-role key to the browser.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Leaderboard" title="Submit latest run">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck className="h-4 w-4 text-blue-300" />
            Signed client-side manifest required
          </div>
        </PanelHeader>
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Display name</span>
              <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="team, handle, or anonymous" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Team number</span>
              <input className="input" value={teamNumber} onChange={(event) => setTeamNumber(event.target.value)} placeholder="optional" inputMode="numeric" />
            </label>
          </div>
          <div className="rounded border border-white/10 bg-field-rail p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Latest local result</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {latestScore.score}/{latestScore.max} ({latestScore.percent}%)
            </p>
            <p className="text-xs text-slate-500">{results.length} task results</p>
          </div>
          <div className="lg:col-span-2 flex flex-wrap items-center gap-2">
            <Button type="button" variant="primary" onClick={submitLatestRun} disabled={isLoading || !results.length}>
              <Send className="h-4 w-4" />
              Submit signed result
            </Button>
            <Button type="button" onClick={loadRuns} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {status && <span className="text-sm text-slate-300">{status}</span>}
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Public runs" title="Leaderboard" />
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
