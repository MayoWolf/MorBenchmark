import strategyHistoryPack from '../../benchmark-packs/frc-strategy-history-v0.1.0.json';
import sampleBenchmarkFile from '../benchmarks/sample-v0.1.0.json';
import type { BenchmarkPack } from '../types/benchmark';

export const defaultBenchmarkPack = strategyHistoryPack as BenchmarkPack;
export const demoBenchmarkPack = sampleBenchmarkFile as BenchmarkPack;

export const builtInBenchmarkPacks: BenchmarkPack[] = [defaultBenchmarkPack, demoBenchmarkPack];
