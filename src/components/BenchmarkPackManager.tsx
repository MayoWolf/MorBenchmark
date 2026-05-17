import { AlertCircle, Download, FileJson, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { downloadBenchmarkPack } from '../lib/exportResults';
import { validateBenchmarkPack } from '../lib/validateBenchmarkPack';
import type { BenchmarkPack } from '../types/benchmark';

interface BenchmarkPackManagerProps {
  pack: BenchmarkPack;
  onPackChange: (pack: BenchmarkPack) => void;
}

export function BenchmarkPackManager({ pack, onPackChange }: BenchmarkPackManagerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const importPack = async (file: File | undefined) => {
    setMessage('');
    setErrors([]);

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      const validation = validateBenchmarkPack(parsed);

      if (!validation.valid || !validation.pack) {
        setErrors(validation.errors);
        return;
      }

      onPackChange(validation.pack);
      setMessage(`Loaded "${validation.pack.name}" with ${validation.pack.tasks.length} tasks.`);
    } catch (error) {
      setErrors([
        error instanceof SyntaxError
          ? 'That file is not valid JSON. Check for missing commas, quotes, or brackets.'
          : 'FRCBench could not read that benchmark pack file.',
      ]);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <section className="rounded-lg border border-white/10 bg-field-panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-blue-200">
            <FileJson className="h-4 w-4" />
            Benchmark pack
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">{pack.name}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {pack.id} · {pack.version} · {pack.tasks.length} tasks
          </p>
          {pack.description && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{pack.description}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void importPack(event.target.files?.[0])}
          />
          <button type="button" className="button-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import JSON
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => downloadBenchmarkPack(`${pack.id}-${pack.version}.json`, pack)}
          >
            <Download className="h-4 w-4" />
            Export pack
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          {message}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            This benchmark pack needs a few fixes before FRCBench can load it.
          </div>
          <ul className="list-disc space-y-1 pl-5">
            {errors.slice(0, 8).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          {errors.length > 8 && <p className="mt-2">And {errors.length - 8} more validation errors.</p>}
        </div>
      )}
    </section>
  );
}
