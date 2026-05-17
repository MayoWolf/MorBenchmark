import { AlertCircle, Download, FileJson, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { downloadBenchmarkPack } from '../lib/exportResults';
import { validateBenchmarkPack } from '../lib/validateBenchmarkPack';
import type { BenchmarkPack } from '../types/benchmark';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Panel, PanelHeader } from './ui/Panel';

interface BenchmarkPackManagerProps {
  pack: BenchmarkPack;
  builtInPacks?: BenchmarkPack[];
  onPackChange: (pack: BenchmarkPack) => void;
}

export function BenchmarkPackManager({ pack, builtInPacks = [], onPackChange }: BenchmarkPackManagerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const verificationSummary = pack.tasks.reduce<Record<string, number>>((summary, task) => {
    const status = task.verificationStatus ?? 'unverified';
    summary[status] = (summary[status] ?? 0) + 1;
    return summary;
  }, {});

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
    <Panel>
      <PanelHeader eyebrow="Benchmark pack" title={pack.name}>
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">{pack.version}</Badge>
          <Badge>{pack.tasks.length} tasks</Badge>
        </div>
      </PanelHeader>
      <div className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mt-1 text-sm text-slate-400">
            {pack.id} · {pack.version} · {pack.tasks.length} tasks
          </p>
          {pack.description && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{pack.description}</p>}
          <p className="mt-3 text-sm font-medium text-emerald-200">
            Loaded {pack.tasks.length} tasks from {pack.id === 'frc-strategy-history' ? 'frc-strategy-history-v0.1.0' : pack.id}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(verificationSummary)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([status, count]) => (
                <Badge key={status} tone={status === 'source_verified' ? 'green' : status === 'community_reviewed' ? 'blue' : 'amber'}>
                  {status}: {count}
                </Badge>
              ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-72">
          {builtInPacks.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Built-in pack</span>
              <select
                className="input"
                value={`${pack.id}@${pack.version}`}
                onChange={(event) => {
                  const nextPack = builtInPacks.find((item) => `${item.id}@${item.version}` === event.target.value);
                  if (nextPack) {
                    setMessage(`Loaded "${nextPack.name}" with ${nextPack.tasks.length} tasks.`);
                    setErrors([]);
                    onPackChange(nextPack);
                  }
                }}
              >
                {builtInPacks.map((item) => (
                  <option key={`${item.id}@${item.version}`} value={`${item.id}@${item.version}`}>
                    {item.name} · {item.version} · {item.tasks.length} tasks
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void importPack(event.target.files?.[0])}
          />
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import JSON
          </Button>
          <Button
            type="button"
            onClick={() => downloadBenchmarkPack(`${pack.id}-${pack.version}.json`, pack)}
          >
            <Download className="h-4 w-4" />
            Export pack
          </Button>
          </div>
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
      </div>
    </Panel>
  );
}
