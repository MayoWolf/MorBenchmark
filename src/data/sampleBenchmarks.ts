import sampleBenchmarkFile from '../benchmarks/sample-v0.1.0.json';
import type { BenchmarkTask } from '../types/benchmark';

export const benchmarkVersion = sampleBenchmarkFile.version;
export const sampleBenchmarks = sampleBenchmarkFile.tasks as BenchmarkTask[];
