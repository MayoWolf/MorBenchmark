import { createClient } from '@supabase/supabase-js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
};

const selectFields = [
  'id',
  'created_at',
  'run_id',
  'display_name',
  'team_number',
  'model_provider',
  'model_name',
  'api_base_url',
  'benchmark_pack_id',
  'benchmark_pack_version',
  'benchmark_pack_hash',
  'total_score',
  'max_score',
  'percent_score',
  'task_count',
  'signature_valid',
  'public_key_fingerprint',
].join(',');

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return response(204, {});
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return response(503, {
      error: 'Leaderboard is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in Netlify.',
    });
  }

  try {
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('leaderboard_runs')
        .select(selectFields)
        .order('percent_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return leaderboardErrorResponse(error);
      }

      return response(200, { runs: data ?? [] });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const validationError = validateSubmission(body);
      if (validationError) {
        return response(400, { error: validationError });
      }

      const manifest = body.manifest;
      const { error } = await supabase.from('leaderboard_runs').insert({
        run_id: manifest.runId,
        display_name: String(body.displayName || 'anonymous').trim().slice(0, 80) || 'anonymous',
        team_number: body.teamNumber ?? null,
        model_provider: manifest.modelProvider,
        model_name: manifest.modelName,
        api_base_url: manifest.apiBaseUrl,
        benchmark_pack_id: manifest.benchmarkPackId,
        benchmark_pack_version: manifest.benchmarkPackVersion,
        benchmark_pack_hash: manifest.benchmarkPackHash,
        total_score: manifest.totalScore,
        max_score: manifest.maxScore,
        percent_score: manifest.percentScore,
        task_count: manifest.taskResults.length,
        signature_valid: true,
        public_key_fingerprint: manifest.signature.publicKeyFingerprint,
        signed_manifest: manifest,
        task_results: manifest.taskResults,
        environment: manifest.environment,
        submitted_from: 'client',
      });

      if (error) {
        return leaderboardErrorResponse(error);
      }

      return response(201, { ok: true });
    }

    return response(405, { error: 'Method not allowed.' });
  } catch (error) {
    return response(500, {
      error: error instanceof Error ? error.message : 'Unknown leaderboard function error.',
    });
  }
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function validateSubmission(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body must be an object.';
  }

  const manifest = body.manifest;
  if (!manifest || typeof manifest !== 'object') {
    return 'Missing signed result manifest.';
  }

  if (manifest.schemaVersion !== 'frcbench.signed-result.v1' || manifest.appName !== 'FRCBench') {
    return 'Invalid FRCBench signed result manifest.';
  }

  if (!manifest.signature?.signatureValue || !manifest.signature?.publicKeyFingerprint) {
    return 'Leaderboard submissions must include a signature.';
  }

  if (!Array.isArray(manifest.taskResults) || manifest.taskResults.length === 0) {
    return 'Leaderboard submissions must include task results.';
  }

  if (typeof manifest.percentScore !== 'number' || manifest.percentScore < 0 || manifest.percentScore > 100) {
    return 'percentScore must be between 0 and 100.';
  }

  if (body.teamNumber !== undefined && body.teamNumber !== null) {
    const teamNumber = Number(body.teamNumber);
    if (!Number.isInteger(teamNumber) || teamNumber < 1 || teamNumber > 99999) {
      return 'teamNumber must be a valid FRC-style team number.';
    }
  }

  return '';
}

function leaderboardErrorResponse(error) {
  const message = error?.message ?? 'Unknown Supabase leaderboard error.';
  const code = error?.code;

  if (code === 'PGRST205' || message.includes('schema cache') || message.includes('leaderboard_runs')) {
    return response(503, {
      error:
        'Leaderboard database is not initialized. Create public.leaderboard_runs in your Supabase project by running supabase/migrations/001_leaderboard.sql, then retry after the Supabase schema cache refreshes.',
      details: message,
    });
  }

  return response(500, { error: message });
}

function response(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}
