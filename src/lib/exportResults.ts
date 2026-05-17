import type { BenchmarkResult, ScoreBreakdown } from '../types/benchmark';

export interface ExportPayload {
  app: 'FRCBench';
  benchmarkVersion: string;
  exportedAt: string;
  summary: ScoreBreakdown;
  results: BenchmarkResult[];
}

export function downloadJson(filename: string, payload: ExportPayload) {
  downloadFile(filename, JSON.stringify(payload, null, 2), 'application/json');
}

export function downloadCsv(filename: string, results: BenchmarkResult[]) {
  const headers = [
    'questionId',
    'season',
    'category',
    'difficulty',
    'modelName',
    'score',
    'maxScore',
    'latency',
    'timestamp',
    'prompt',
    'expectedAnswer',
    'modelAnswer',
    'notes',
  ];

  const rows = results.map((result) =>
    headers.map((header) => escapeCsv(String(result[header as keyof BenchmarkResult] ?? ''))).join(','),
  );

  downloadFile(filename, [headers.join(','), ...rows].join('\n'), 'text/csv');
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}
