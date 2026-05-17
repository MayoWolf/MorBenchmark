import { CheckCircle2, Download, FileSignature, KeyRound, Loader2, ShieldAlert, Upload, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { hashBenchmarkPack } from '../lib/hashBenchmarkPack';
import {
  createUnsignedResultManifest,
  forgetStoredSigningKey,
  generateLocalSigningKey,
  loadStoredSigningKey,
  signResultManifest,
  verifySignedResultManifest,
  type LocalSigningKey,
  type SignedResultVerification,
} from '../lib/signResults';
import type { BenchmarkPack, BenchmarkResult, ModelProviderConfig, SignedResultManifest } from '../types/benchmark';

interface SignedResultExportProps {
  pack: BenchmarkPack;
  results: BenchmarkResult[];
  config: ModelProviderConfig;
}

export function SignedResultExport({ pack, results, config }: SignedResultExportProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [savePrivateKey, setSavePrivateKey] = useState(false);
  const [signingKey, setSigningKey] = useState<LocalSigningKey | null>(null);
  const [packHash, setPackHash] = useState('');
  const [signedManifest, setSignedManifest] = useState<SignedResultManifest | null>(null);
  const [verification, setVerification] = useState<SignedResultVerification | null>(null);
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    void hashBenchmarkPack(pack).then(setPackHash);
  }, [pack]);

  useEffect(() => {
    void loadStoredSigningKey().then((key) => {
      if (key) {
        setSigningKey(key);
        setSavePrivateKey(true);
      }
    });
  }, []);

  const generateKey = async () => {
    setIsBusy(true);
    setStatus('');
    try {
      const key = await generateLocalSigningKey(savePrivateKey);
      setSigningKey(key);
      setSignedManifest(null);
      setStatus(savePrivateKey ? 'Generated and saved a local signing key.' : 'Generated a temporary local signing key.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not generate a signing key.');
    } finally {
      setIsBusy(false);
    }
  };

  const forgetKey = () => {
    forgetStoredSigningKey();
    setSigningKey(null);
    setSignedManifest(null);
    setSavePrivateKey(false);
    setStatus('Forgot the locally saved signing key.');
  };

  const signLatestRun = async () => {
    if (!signingKey) {
      setStatus('Generate a signing key first.');
      return;
    }

    if (!results.length) {
      setStatus('Run a benchmark before signing results.');
      return;
    }

    setIsBusy(true);
    setStatus('');

    try {
      const unsignedManifest = await createUnsignedResultManifest({
        pack,
        packHash,
        results,
        config,
      });
      const nextManifest = await signResultManifest(unsignedManifest, signingKey);
      setSignedManifest(nextManifest);
      setStatus('Signed the latest result manifest.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not sign the result manifest.');
    } finally {
      setIsBusy(false);
    }
  };

  const importSignedResult = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setIsBusy(true);
    setVerification(null);
    setStatus('');

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = await verifySignedResultManifest(parsed);
      setVerification(result);
    } catch (error) {
      setVerification({
        valid: false,
        reason:
          error instanceof SyntaxError
            ? 'The imported signed result file is not valid JSON.'
            : 'Could not read the imported signed result file.',
      });
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const cryptoAvailable = typeof crypto !== 'undefined' && Boolean(crypto.subtle);

  return (
    <section className="rounded-lg border border-white/10 bg-field-panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-blue-200">
            <FileSignature className="h-4 w-4" />
            Signed result export
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Client-side signed manifests</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Sign a result file with a local browser key. A valid signature proves the manifest was not modified after
            signing with that key. It does not prove the run was honest.
          </p>
        </div>
        <div className="rounded-md border border-white/10 bg-field-black px-3 py-2 text-xs text-slate-400">
          Pack hash
          <span className="mt-1 block max-w-xs truncate font-mono text-slate-200">{packHash || 'Calculating...'}</span>
        </div>
      </div>

      {!cryptoAvailable && (
        <div className="mt-4 rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">
          This browser does not expose Web Crypto signing APIs needed for signed exports.
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-white/10 bg-field-rail p-4">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <KeyRound className="h-4 w-4" />
            Local signing key
          </h3>
          <label className="mt-4 flex items-start gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={savePrivateKey}
              onChange={(event) => setSavePrivateKey(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-blue-400"
            />
            Save private key in this browser's localStorage when generating a key
          </label>

          {signingKey && (
            <div className="mt-4 rounded-md border border-white/10 bg-field-black p-3 text-sm">
              <p className="text-slate-400">Public key fingerprint</p>
              <p className="mt-1 break-all font-mono text-blue-100">{signingKey.fingerprint}</p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="button-primary" onClick={generateKey} disabled={!cryptoAvailable || isBusy}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Generate key
            </button>
            <button type="button" className="button-secondary" onClick={forgetKey} disabled={!signingKey || isBusy}>
              Forget key
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-field-rail p-4">
          <h3 className="font-semibold text-white">Sign and download</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The signed manifest includes scores, task results, model settings, benchmark pack hash, browser environment,
            public key, and signature.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="button-primary" onClick={signLatestRun} disabled={!cryptoAvailable || isBusy || !results.length}>
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
              Sign latest run
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => signedManifest && downloadSignedManifest(signedManifest)}
              disabled={!signedManifest}
            >
              <Download className="h-4 w-4" />
              Download signed JSON
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-field-rail p-4">
        <h3 className="font-semibold text-white">Verify signed result JSON</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Import a signed result manifest to check whether the signature matches the included public key.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => void importSignedResult(event.target.files?.[0])}
        />
        <button type="button" className="button-secondary mt-4" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
          <Upload className="h-4 w-4" />
          Import signed JSON
        </button>

        {verification && <VerificationResult verification={verification} />}
      </div>

      {status && <p className="mt-4 text-sm text-slate-300">{status}</p>}
    </section>
  );
}

function VerificationResult({ verification }: { verification: SignedResultVerification }) {
  const manifest = verification.manifest;

  return (
    <div
      className={`mt-4 rounded-md border p-4 text-sm ${
        verification.valid
          ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
          : 'border-red-300/30 bg-red-400/10 text-red-100'
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        {verification.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {verification.valid ? 'Signature valid' : 'Signature invalid'}
      </div>
      <p className="mt-2">{verification.reason}</p>
      {manifest && (
        <div className="mt-4 grid gap-2 text-slate-200 sm:grid-cols-2">
          <VerifyItem label="Benchmark pack hash" value={manifest.benchmarkPackHash} />
          <VerifyItem label="Model" value={manifest.modelName} />
          <VerifyItem label="Score" value={`${manifest.totalScore}/${manifest.maxScore} (${manifest.percentScore}%)`} />
          <VerifyItem label="Timestamp" value={manifest.timestamp} />
          <VerifyItem label="Public key" value={manifest.signature?.publicKeyFingerprint ?? 'missing'} />
        </div>
      )}
      <div className="mt-4 flex gap-2 rounded-md border border-amber-300/30 bg-amber-400/10 p-3 text-amber-100">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          A valid signature only proves the file has not changed since signing. It does not prove the benchmark run was
          honest, private, or executed without edits.
        </p>
      </div>
    </div>
  );
}

function VerifyItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-all font-mono text-xs">{value}</p>
    </div>
  );
}

function downloadSignedManifest(manifest: SignedResultManifest) {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `frcbench-signed-${manifest.runId}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
