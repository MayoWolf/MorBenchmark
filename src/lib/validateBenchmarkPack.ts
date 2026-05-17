import type {
  BenchmarkCategory,
  BenchmarkDifficulty,
  BenchmarkPack,
  BenchmarkTask,
  ScoringType,
} from '../types/benchmark';

export interface BenchmarkPackValidationResult {
  valid: boolean;
  pack?: BenchmarkPack;
  errors: string[];
}

const categories: BenchmarkCategory[] = [
  'game_rules',
  'strategy_meta',
  'alliance_selection',
  'match_analysis',
  'ranking_points',
  'robot_design_tradeoffs',
  'scouting_interpretation',
  'historical_meta',
];

const difficulties: BenchmarkDifficulty[] = ['easy', 'medium', 'hard'];

const scoringTypes: ScoringType[] = [
  'multiple_choice',
  'short_answer',
  'rubric',
  'json_structured',
  'manual',
];

const verificationStatuses = ['unverified', 'community_reviewed', 'source_verified'];

export function validateBenchmarkPack(input: unknown): BenchmarkPackValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: ['The file must contain one JSON object for a benchmark pack.'],
    };
  }

  requireString(input, 'id', 'Pack id', errors);
  requireString(input, 'name', 'Pack name', errors);
  requireString(input, 'version', 'Pack version', errors);

  if (!Array.isArray(input.tasks)) {
    errors.push('Pack tasks must be an array.');
  }

  const seenIds = new Set<string>();
  if (Array.isArray(input.tasks)) {
    input.tasks.forEach((task, index) => {
      validateTask(task, index, seenIds, errors);
    });
  }

  return {
    valid: errors.length === 0,
    pack: errors.length === 0 ? (input as unknown as BenchmarkPack) : undefined,
    errors,
  };
}

function validateTask(task: unknown, index: number, seenIds: Set<string>, errors: string[]) {
  const label = `Task ${index + 1}`;

  if (!isRecord(task)) {
    errors.push(`${label} must be an object.`);
    return;
  }

  const id = requireString(task, 'id', `${label} id`, errors);
  if (id) {
    if (seenIds.has(id)) {
      errors.push(`Duplicate task id rejected: ${id}.`);
    }
    seenIds.add(id);
  }

  requireNumber(task, 'season', `${label} season`, errors);
  requireString(task, 'gameName', `${label} gameName`, errors);
  requireString(task, 'prompt', `${label} prompt`, errors);
  requireString(task, 'expectedAnswer', `${label} expectedAnswer`, errors);
  requireStringArray(task, 'tags', `${label} tags`, errors);

  const category = requireString(task, 'category', `${label} category`, errors);
  if (category && !categories.includes(category as BenchmarkCategory)) {
    errors.push(`${label} category "${category}" is not supported.`);
  }

  const difficulty = requireString(task, 'difficulty', `${label} difficulty`, errors);
  if (difficulty && !difficulties.includes(difficulty as BenchmarkDifficulty)) {
    errors.push(`${label} difficulty must be easy, medium, or hard.`);
  }

  const scoringType = requireString(task, 'scoringType', `${label} scoringType`, errors);
  if (scoringType && !scoringTypes.includes(scoringType as ScoringType)) {
    errors.push(`${label} scoringType "${scoringType}" is not supported.`);
  }

  if (
    'verificationStatus' in task &&
    (typeof task.verificationStatus !== 'string' || !verificationStatuses.includes(task.verificationStatus))
  ) {
    errors.push(`${label} verificationStatus must be unverified, community_reviewed, or source_verified.`);
  }

  if ((scoringType === 'rubric' || scoringType === 'manual') && !Array.isArray(task.rubric)) {
    errors.push(`${label} uses ${scoringType} scoring and must include a rubric array.`);
  }

  if (Array.isArray(task.rubric)) {
    task.rubric.forEach((rubricItem, rubricIndex) => {
      if (!isRecord(rubricItem)) {
        errors.push(`${label} rubric item ${rubricIndex + 1} must be an object.`);
        return;
      }
      requireString(rubricItem, 'point', `${label} rubric item ${rubricIndex + 1} point`, errors);
      requireNumber(rubricItem, 'points', `${label} rubric item ${rubricIndex + 1} points`, errors);
    });
  }

  if (scoringType === 'multiple_choice') {
    if (
      !Array.isArray(task.choices) ||
      task.choices.length < 2 ||
      !task.choices.every((choice) => typeof choice === 'string')
    ) {
      errors.push(`${label} uses multiple_choice scoring and must include at least two choices.`);
    }

    const expectedAnswer = typeof task.expectedAnswer === 'string' ? task.expectedAnswer.trim() : '';
    if (!/^[A-Z]$/i.test(expectedAnswer)) {
      errors.push(`${label} multiple-choice expectedAnswer must be a letter such as "A" or "B".`);
    } else if (Array.isArray(task.choices) && expectedAnswer.toUpperCase().charCodeAt(0) - 65 >= task.choices.length) {
      errors.push(`${label} multiple-choice expectedAnswer must point to one of the provided choices.`);
    }
  }

  if ('sources' in task && !Array.isArray(task.sources)) {
    errors.push(`${label} sources must be an array when provided.`);
  }

  if (Array.isArray(task.sources)) {
    task.sources.forEach((source, sourceIndex) => {
      if (!isRecord(source)) {
        errors.push(`${label} source ${sourceIndex + 1} must be an object.`);
        return;
      }
      requireString(source, 'title', `${label} source ${sourceIndex + 1} title`, errors);
      requireString(source, 'url', `${label} source ${sourceIndex + 1} url`, errors);
      requireString(source, 'publisher', `${label} source ${sourceIndex + 1} publisher`, errors);
      requireNumber(source, 'year', `${label} source ${sourceIndex + 1} year`, errors);
      requireString(source, 'note', `${label} source ${sourceIndex + 1} note`, errors);
    });
  }
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  label: string,
  errors: string[],
): string | undefined {
  if (typeof record[key] !== 'string' || !record[key].trim()) {
    errors.push(`${label} is required.`);
    return undefined;
  }

  return record[key];
}

function requireNumber(record: Record<string, unknown>, key: string, label: string, errors: string[]) {
  if (typeof record[key] !== 'number' || !Number.isFinite(record[key])) {
    errors.push(`${label} is required and must be a number.`);
  }
}

function requireStringArray(
  record: Record<string, unknown>,
  key: string,
  label: string,
  errors: string[],
) {
  if (!Array.isArray(record[key]) || !record[key].every((item) => typeof item === 'string')) {
    errors.push(`${label} must be an array of strings.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
