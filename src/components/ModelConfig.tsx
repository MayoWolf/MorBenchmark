import { AlertTriangle, CheckCircle2, KeyRound, Loader2, PlayCircle, Server } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { testOpenAICompatibleConfig } from '../lib/modelAdapters/openAICompatible';
import type { ModelProviderConfig, StoragePreference } from '../types/benchmark';

interface ModelConfigProps {
  config: ModelProviderConfig;
  demoMode: boolean;
  onConfigChange: (config: ModelProviderConfig) => void;
  onDemoModeChange: (enabled: boolean) => void;
}

const providerPresets = [
  {
    label: 'OpenAI-compatible API',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o-mini',
  },
  {
    label: 'OpenRouter-compatible API',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelName: 'openai/gpt-4o-mini',
  },
  {
    label: 'Local compatible server',
    baseUrl: 'http://localhost:11434/v1',
    modelName: 'llama3.1',
  },
];

export function ModelConfig({
  config,
  demoMode,
  onConfigChange,
  onDemoModeChange,
}: ModelConfigProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const updateConfig = <Key extends keyof ModelProviderConfig>(key: Key, value: ModelProviderConfig[Key]) => {
    const nextConfig = { ...config, [key]: value };
    onConfigChange(nextConfig);
    persistConfig(nextConfig);
  };

  const applyPreset = (preset: (typeof providerPresets)[number]) => {
    const nextConfig = {
      ...config,
      providerName: preset.label,
      baseUrl: preset.baseUrl,
      modelName: preset.modelName,
    };
    onConfigChange(nextConfig);
    persistConfig(nextConfig);
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const response = await testOpenAICompatibleConfig(config);
      setTestStatus('success');
      setTestMessage(`Provider replied in ${response.latency} ms: ${response.content}`);
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'The test call failed.');
    }
  };

  return (
    <section className="rounded-lg border border-white/10 bg-field-panel p-5 shadow-glow">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-blue-200">
            <Server className="h-4 w-4" />
            Model/API configuration
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Bring your own compatible endpoint</h2>
        </div>
        <label className="flex items-center gap-3 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(event) => onDemoModeChange(event.target.checked)}
            className="h-4 w-4 accent-emerald-400"
          />
          Demo mode
        </label>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {providerPresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200 transition hover:border-blue-300/50 hover:bg-blue-400/10"
          >
            <span className="block font-medium text-white">{preset.label}</span>
            <span className="mt-1 block truncate text-xs text-slate-400">{preset.baseUrl}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="API base URL">
          <input
            value={config.baseUrl}
            onChange={(event) => updateConfig('baseUrl', event.target.value)}
            placeholder="https://api.example.com/v1"
            className="input"
          />
        </Field>
        <Field label="Model name">
          <input
            value={config.modelName}
            onChange={(event) => updateConfig('modelName', event.target.value)}
            placeholder="gpt-4o-mini"
            className="input"
          />
        </Field>
        <Field label="API key">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={config.apiKey}
              onChange={(event) => updateConfig('apiKey', event.target.value)}
              type="password"
              placeholder="Stored only in this browser if saved"
              className="input pl-10"
            />
          </div>
        </Field>
        <Field label="Key storage">
          <select
            value={config.storagePreference}
            onChange={(event) => updateConfig('storagePreference', event.target.value as StoragePreference)}
            className="input"
          >
            <option value="none">Do not save key</option>
            <option value="session">Save in sessionStorage</option>
            <option value="local">Save in localStorage</option>
          </select>
        </Field>
        <Field label={`Temperature: ${config.temperature.toFixed(1)}`}>
          <input
            value={config.temperature}
            min={0}
            max={2}
            step={0.1}
            type="range"
            onChange={(event) => updateConfig('temperature', Number(event.target.value))}
            className="w-full accent-blue-400"
          />
        </Field>
        <Field label="Max tokens">
          <input
            value={config.maxTokens}
            min={32}
            max={4096}
            step={32}
            type="number"
            onChange={(event) => updateConfig('maxTokens', Number(event.target.value))}
            className="input"
          />
        </Field>
      </div>

      <div className="mt-5 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Browser-based API calls expose keys to your own browser session and the configured provider endpoint.
            Use restricted or temporary keys when possible. FRCBench does not run a v1 server or analytics.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleTest}
          disabled={demoMode || testStatus === 'testing'}
          className="button-primary w-full sm:w-auto"
        >
          {testStatus === 'testing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          Test API call
        </button>
        {testStatus === 'success' && (
          <span className="flex items-center gap-2 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            {testMessage}
          </span>
        )}
        {testStatus === 'error' && <span className="text-sm text-red-200">{testMessage}</span>}
        {demoMode && <span className="text-sm text-slate-400">API test is disabled while demo mode is active.</span>}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function persistConfig(config: ModelProviderConfig) {
  const storageSafeConfig = {
    ...config,
    apiKey: config.storagePreference === 'none' ? '' : config.apiKey,
  };
  const serialized = JSON.stringify(storageSafeConfig);
  sessionStorage.removeItem('frcbench:modelConfig');
  localStorage.removeItem('frcbench:modelConfig');

  if (config.storagePreference === 'session') {
    sessionStorage.setItem('frcbench:modelConfig', serialized);
  }

  if (config.storagePreference === 'local') {
    localStorage.setItem('frcbench:modelConfig', serialized);
  }
}
