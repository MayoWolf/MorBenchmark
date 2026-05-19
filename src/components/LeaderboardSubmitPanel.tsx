import { Send, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { hashBenchmarkPack } from '../lib/hashBenchmarkPack';
import { submitLeaderboardRun } from '../lib/leaderboard/leaderboardService';
import {
  createUnsignedResultManifest,
  generateLocalSigningKey,
  loadStoredSigningKey,
  signResultManifest,
} from '../lib/signResults';
import type { BenchmarkPack, BenchmarkResult, ModelProviderConfig } from '../types/benchmark';
import { Button } from './ui/Button';
import { Panel, PanelHeader } from './ui/Panel';

interface LeaderboardSubmitPanelProps {
  pack: BenchmarkPack;
  results: BenchmarkResult[];
  config: ModelProviderConfig;
  onSubmitted?: () => void | Promise<void>;
}

export function LeaderboardSubmitPanel({
  pack,
  results,
  config,
  onSubmitted,
}: LeaderboardSubmitPanelProps) {
  const [displayName, setDisplayName] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestScore = useMemo(() => {
    const score = results.reduce((sum, result) => sum + result.score, 0);
    const max = results.reduce((sum, result) => sum + result.maxScore, 0);
    const percent = max ? Math.round((score / max) * 1000) / 10 : 0;
    return { score, max, percent };
  }, [results]);

  const submitLatestRun = async () => {
    if (!results.length) {
      setStatus('Run a benchmark before submitting to the leaderboard.');
      return;
    }

    setIsSubmitting(true);
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
      await onSubmitted?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not submit leaderboard run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Panel>
      <PanelHeader eyebrow="Leaderboard" title="Do you want to put this result on the leaderboard?">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="h-4 w-4 text-blue-300" />
          Signed result required
        </div>
      </PanelHeader>
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Your display name</span>
            <input
              className="input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="John Doe"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Team number</span>
            <input
              className="input"
              value={teamNumber}
              onChange={(event) => setTeamNumber(event.target.value)}
              placeholder="1515"
              inputMode="numeric"
            />
          </label>
        </div>
        <div className="rounded border border-white/10 bg-field-rail p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Latest local result</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {latestScore.score}/{latestScore.max} ({latestScore.percent}%)
          </p>
          <p className="text-xs text-slate-500">{results.length} task results</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
          <Button type="button" variant="primary" onClick={submitLatestRun} disabled={isSubmitting || !results.length}>
            <Send className="h-4 w-4" />
            Submit signed result
          </Button>
          <p className="text-sm text-slate-400">
            Submitting stores this signed run and task results in the public leaderboard database.
          </p>
          {status && <span className="basis-full text-sm text-slate-300">{status}</span>}
        </div>
      </div>
    </Panel>
  );
}
