import type {
  BenchmarkResult,
  BenchmarkTask,
  BreakdownBucket,
  ScoreBreakdown,
} from '../types/benchmark';

const normalizeAnswer = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[\s"'`({[]+|[\s"'`)}\].,;:!]+$/g, '');

const includesKeyword = (answer: string, keyword: string) =>
  normalizeAnswer(answer).includes(normalizeAnswer(keyword));

export function getMaxScore(task: BenchmarkTask): number {
  if (task.scoringType === 'multiple_choice') {
    return 1;
  }

  const rubricTotal = task.rubric.reduce((total, item) => total + item.points, 0);
  if (task.scoringType === 'json_structured') {
    return rubricTotal + 1;
  }

  return rubricTotal || 1;
}

export function scoreAnswer(task: BenchmarkTask, answer: string): Pick<BenchmarkResult, 'score' | 'maxScore' | 'notes'> {
  const maxScore = getMaxScore(task);

  if (task.scoringType === 'multiple_choice') {
    const selected = normalizeAnswer(answer).match(/\b[a-d]\b/)?.[0] ?? normalizeAnswer(answer).charAt(0);
    const expected = normalizeAnswer(task.expectedAnswer).charAt(0);

    return {
      score: selected === expected ? 1 : 0,
      maxScore,
      notes: selected === expected ? 'Exact multiple-choice match.' : 'No exact multiple-choice match.',
    };
  }

  if (task.scoringType === 'manual' || task.scoringType === 'rubric') {
    return {
      score: 0,
      maxScore,
      notes: 'Manual review recommended for rubric-graded answers in v1.',
    };
  }

  let score = 0;
  const matched: string[] = [];

  task.rubric.forEach((item) => {
    const keywords = item.keywords?.length ? item.keywords : item.point.split(/\s+/);
    if (keywords.some((keyword) => includesKeyword(answer, keyword))) {
      score += item.points;
      matched.push(item.point);
    }
  });

  if (task.scoringType === 'json_structured') {
    try {
      JSON.parse(answer);
      score = Math.min(maxScore, score + 1);
      matched.push('Valid JSON parse');
    } catch {
      matched.push('JSON parse failed');
    }
  }

  return {
    score: Math.min(score, maxScore),
    maxScore,
    notes: matched.length ? `Matched: ${matched.join('; ')}` : 'No rubric keywords matched.',
  };
}

export function calculateScoreBreakdown(results: BenchmarkResult[]): ScoreBreakdown {
  const totalScore = roundScore(results.reduce((total, result) => total + result.score, 0));
  const totalMaxScore = results.reduce((total, result) => total + result.maxScore, 0);

  return {
    totalScore,
    totalMaxScore,
    percentScore: percent(totalScore, totalMaxScore),
    byCategory: buildBreakdown(results, (result) => result.category),
    bySeason: buildBreakdown(results, (result) => String(result.season)),
    byDifficulty: buildBreakdown(results, (result) => result.difficulty),
  };
}

function buildBreakdown(
  results: BenchmarkResult[],
  getKey: (result: BenchmarkResult) => string,
): Record<string, BreakdownBucket> {
  const buckets: Record<string, BreakdownBucket> = {};

  results.forEach((result) => {
    const key = getKey(result);
    const existing = buckets[key] ?? {
      score: 0,
      maxScore: 0,
      percent: 0,
      count: 0,
    };

    existing.score = roundScore(existing.score + result.score);
    existing.maxScore += result.maxScore;
    existing.count += 1;
    existing.percent = percent(existing.score, existing.maxScore);
    buckets[key] = existing;
  });

  return buckets;
}

const percent = (score: number, maxScore: number) =>
  maxScore === 0 ? 0 : Math.round((score / maxScore) * 1000) / 10;

const roundScore = (value: number) => Math.round(value * 100) / 100;
