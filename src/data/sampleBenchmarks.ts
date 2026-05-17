import sampleBenchmarkFile from '../benchmarks/sample-v0.1.0.json';
import type { BenchmarkPack } from '../types/benchmark';

export const sampleBenchmarkPack = sampleBenchmarkFile as BenchmarkPack;
export const benchmarkVersion = sampleBenchmarkPack.version;
export const sampleBenchmarks = sampleBenchmarkPack.tasks;
