import type { SignedResultManifest } from '../../types/benchmark';

export interface LeaderboardRun {
  id: string;
  created_at: string;
  run_id: string;
  display_name: string;
  team_number: number | null;
  model_provider: string;
  model_name: string;
  api_base_url: string;
  benchmark_pack_id: string;
  benchmark_pack_version: string;
  benchmark_pack_hash: string;
  total_score: number;
  max_score: number;
  percent_score: number;
  task_count: number;
  signature_valid: boolean;
  public_key_fingerprint: string | null;
}

export interface LeaderboardSubmissionInput {
  displayName: string;
  teamNumber?: number | null;
  manifest: SignedResultManifest;
}

export async function fetchLeaderboardRuns(): Promise<LeaderboardRun[]> {
  const response = await fetch('/.netlify/functions/leaderboard');
  const payload = (await response.json()) as { runs?: LeaderboardRun[]; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load leaderboard.');
  }

  return payload.runs ?? [];
}

export async function submitLeaderboardRun({
  displayName,
  teamNumber,
  manifest,
}: LeaderboardSubmissionInput): Promise<void> {
  if (!manifest.signature) {
    throw new Error('Leaderboard submissions must be signed first.');
  }

  const response = await fetch('/.netlify/functions/leaderboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName,
      teamNumber,
      manifest,
    }),
  });
  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not submit leaderboard run.');
  }
}
