export type BenchmarkCategory =
  | 'game_rules'
  | 'strategy_meta'
  | 'alliance_selection'
  | 'match_analysis'
  | 'ranking_points'
  | 'robot_design_tradeoffs'
  | 'scouting_interpretation'
  | 'historical_meta';

export type BenchmarkDifficulty = 'easy' | 'medium' | 'hard';

export type ScoringType =
  | 'multiple_choice'
  | 'short_answer'
  | 'keyword'
  | 'rubric'
  | 'json_structured'
  | 'structured_json'
  | 'manual';

export type StoragePreference = 'none' | 'session' | 'local';

export type VerificationStatus = 'unverified' | 'community_reviewed' | 'source_verified';

export interface BenchmarkSource {
  title: string;
  url: string;
  publisher: string;
  year: number;
  note: string;
}

export interface RubricItem {
  point: string;
  points: number;
  keywords?: string[];
}

export interface BenchmarkTask {
  id: string;
  season: number;
  gameName: string;
  category: BenchmarkCategory;
  difficulty: BenchmarkDifficulty;
  prompt: string;
  expectedAnswer: string;
  scoringType: ScoringType;
  rubric: RubricItem[];
  tags: string[];
  sourceNote?: string;
  publicExplanation?: string;
  sources?: BenchmarkSource[];
  verificationStatus?: VerificationStatus;
  choices?: string[];
}

export interface BenchmarkPack {
  id: string;
  name: string;
  version: string;
  description?: string;
  tasks: BenchmarkTask[];
}

export interface ModelProviderConfig {
  providerName: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  storagePreference: StoragePreference;
}

export interface BenchmarkRunConfig {
  provider: ModelProviderConfig;
  selectedCategories: BenchmarkCategory[];
  selectedSeasons: number[];
  demoMode: boolean;
}

export interface BenchmarkResult {
  questionId: string;
  gameName?: string;
  prompt: string;
  modelAnswer: string;
  expectedAnswer: string;
  score: number;
  maxScore: number;
  category: BenchmarkCategory;
  season: number;
  difficulty: BenchmarkDifficulty;
  latency: number;
  modelName: string;
  timestamp: string;
  scoringType: ScoringType;
  rubric?: RubricItem[];
  tags?: string[];
  sourceNote?: string;
  publicExplanation?: string;
  sources?: BenchmarkSource[];
  verificationStatus?: VerificationStatus;
  notes?: string;
}

export interface BreakdownBucket {
  score: number;
  maxScore: number;
  percent: number;
  count: number;
}

export interface ScoreBreakdown {
  totalScore: number;
  totalMaxScore: number;
  percentScore: number;
  byCategory: Record<string, BreakdownBucket>;
  bySeason: Record<string, BreakdownBucket>;
  byDifficulty: Record<string, BreakdownBucket>;
}

export interface ResultEnvironment {
  userAgent: string;
  appVersion?: string;
  browserTimestamp: string;
  note: string;
}

export interface ResultManifestSignature {
  algorithm: 'ECDSA-P256-SHA256';
  publicKeyJwk: JsonWebKey;
  publicKeyFingerprint: string;
  signatureValue: string;
  signedAt: string;
}

export interface SignedResultManifest {
  schemaVersion: 'frcbench.signed-result.v1';
  appName: 'FRCBench';
  benchmarkPackId: string;
  benchmarkPackVersion: string;
  benchmarkPackHash: string;
  runId: string;
  timestamp: string;
  modelProvider: string;
  modelName: string;
  apiBaseUrl: string;
  temperature: number;
  maxTokens: number;
  totalScore: number;
  maxScore: number;
  percentScore: number;
  categoryBreakdown: ScoreBreakdown['byCategory'];
  seasonBreakdown: ScoreBreakdown['bySeason'];
  difficultyBreakdown: ScoreBreakdown['byDifficulty'];
  taskResults: BenchmarkResult[];
  environment: ResultEnvironment;
  signature: ResultManifestSignature | null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelResponse {
  content: string;
  latency: number;
}
