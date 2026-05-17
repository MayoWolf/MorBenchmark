import type {
  BenchmarkCategory,
  BenchmarkDifficulty,
  BenchmarkPack,
  BenchmarkTask,
  ScoringType,
  VerificationStatus,
} from '../types/benchmark';

export type BenchmarkLintSeverity = 'error' | 'warning';

export interface BenchmarkLintIssue {
  severity: BenchmarkLintSeverity;
  taskId: string;
  message: string;
}

export interface BenchmarkPackLintReport {
  taskCount: number;
  errors: BenchmarkLintIssue[];
  warnings: BenchmarkLintIssue[];
  issuesByTask: Record<string, BenchmarkLintIssue[]>;
  categoryDistribution: Record<string, number>;
  seasonDistribution: Record<string, number>;
  scoringTypeDistribution: Record<string, number>;
  verificationStatusDistribution: Record<string, number>;
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
  'keyword',
  'rubric',
  'json_structured',
  'structured_json',
  'manual',
];

const verificationStatuses: VerificationStatus[] = ['unverified', 'community_reviewed', 'source_verified'];

export function lintBenchmarkPack(input: unknown): BenchmarkPackLintReport {
  const issues: BenchmarkLintIssue[] = [];
  const pack = isRecord(input) ? input : {};
  const tasks = Array.isArray(pack.tasks) ? pack.tasks : [];
  const seenIds = new Set<string>();

  if (!isNonEmptyString(pack.id)) {
    issues.push(error('__pack__', 'Pack id is required.'));
  }
  if (!isNonEmptyString(pack.name)) {
    issues.push(error('__pack__', 'Pack name is required.'));
  }
  if (!isNonEmptyString(pack.version)) {
    issues.push(error('__pack__', 'Pack version is required.'));
  }
  if (!Array.isArray(pack.tasks)) {
    issues.push(error('__pack__', 'Pack tasks must be an array.'));
  }

  tasks.forEach((task, index) => lintTask(task, index, seenIds, issues));

  const typedTasks = tasks.filter(isRecord) as Partial<BenchmarkTask>[];
  const allIssues = groupIssues(issues);

  return {
    taskCount: tasks.length,
    errors: issues.filter((issue) => issue.severity === 'error'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
    issuesByTask: allIssues,
    categoryDistribution: distribution(typedTasks, (task) => task.category),
    seasonDistribution: distribution(typedTasks, (task) => task.season),
    scoringTypeDistribution: distribution(typedTasks, (task) => task.scoringType),
    verificationStatusDistribution: distribution(
      typedTasks,
      (task) => task.verificationStatus ?? 'unverified',
    ),
  };
}

export function lintTypedBenchmarkPack(pack: BenchmarkPack): BenchmarkPackLintReport {
  return lintBenchmarkPack(pack);
}

function lintTask(task: unknown, index: number, seenIds: Set<string>, issues: BenchmarkLintIssue[]) {
  const fallbackId = `task-${index + 1}`;

  if (!isRecord(task)) {
    issues.push(error(fallbackId, 'Task must be an object.'));
    return;
  }

  const taskId = isNonEmptyString(task.id) ? task.id : fallbackId;

  if (!isNonEmptyString(task.id)) {
    issues.push(error(taskId, 'Task id is required.'));
  } else if (seenIds.has(task.id)) {
    issues.push(error(taskId, `Duplicate task id rejected: ${task.id}.`));
  } else {
    seenIds.add(task.id);
  }

  if (!isFiniteNumber(task.season)) {
    issues.push(error(taskId, 'season is required and must be a number.'));
  }

  if (!isNonEmptyString(task.gameName)) {
    issues.push(error(taskId, 'gameName is required.'));
  }

  if (!isNonEmptyString(task.prompt)) {
    issues.push(error(taskId, 'prompt is required and cannot be empty.'));
  } else {
    if (task.prompt.trim().length < 40) {
      issues.push(warning(taskId, 'Prompt is shorter than 40 characters.'));
    }
    if (task.prompt.length > 4000) {
      issues.push(warning(taskId, 'Prompt is very long at over 4000 characters.'));
    }
  }

  if (!isNonEmptyString(task.expectedAnswer)) {
    issues.push(error(taskId, 'expectedAnswer is required and cannot be empty.'));
  } else if (task.expectedAnswer.trim().length < 10) {
    issues.push(warning(taskId, 'expectedAnswer is shorter than 10 characters.'));
  }

  if (!Array.isArray(task.tags) || !task.tags.every((tag) => typeof tag === 'string')) {
    issues.push(error(taskId, 'tags must be an array of strings.'));
  } else if (task.tags.length === 0) {
    issues.push(warning(taskId, 'Task has no tags.'));
  }

  const category = isNonEmptyString(task.category) ? task.category : '';
  if (!category) {
    issues.push(error(taskId, 'category is required.'));
  } else if (!categories.includes(category as BenchmarkCategory)) {
    issues.push(error(taskId, `Invalid category "${category}".`));
  }

  const difficulty = isNonEmptyString(task.difficulty) ? task.difficulty : '';
  if (!difficulty) {
    issues.push(error(taskId, 'difficulty is required.'));
  } else if (!difficulties.includes(difficulty as BenchmarkDifficulty)) {
    issues.push(error(taskId, `Invalid difficulty "${difficulty}".`));
  }

  const scoringType = isNonEmptyString(task.scoringType) ? task.scoringType : '';
  if (!scoringType) {
    issues.push(error(taskId, 'scoringType is required.'));
  } else if (!scoringTypes.includes(scoringType as ScoringType)) {
    issues.push(error(taskId, `Invalid scoringType "${scoringType}".`));
  }

  const verificationStatus = isNonEmptyString(task.verificationStatus)
    ? task.verificationStatus
    : 'unverified';
  if (!verificationStatuses.includes(verificationStatus as VerificationStatus)) {
    issues.push(error(taskId, `Invalid verificationStatus "${verificationStatus}".`));
  }

  if (!isNonEmptyString(task.sourceNote)) {
    issues.push(warning(taskId, 'Task has no sourceNote.'));
  }

  if (!isNonEmptyString(task.publicExplanation)) {
    issues.push(warning(taskId, 'Task has no publicExplanation.'));
  }

  if (category === 'game_rules' && verificationStatus === 'unverified') {
    issues.push(warning(taskId, 'Rule-specific task is still unverified.'));
  }

  if ((scoringType === 'rubric' || scoringType === 'manual') && !hasRubric(task)) {
    issues.push(error(taskId, `Rubric/manual task must include a non-empty rubric array.`));
  }

  if (Array.isArray(task.rubric)) {
    task.rubric.forEach((item, rubricIndex) => {
      if (!isRecord(item)) {
        issues.push(error(taskId, `Rubric item ${rubricIndex + 1} must be an object.`));
        return;
      }
      if (!isNonEmptyString(item.point)) {
        issues.push(error(taskId, `Rubric item ${rubricIndex + 1} needs a point description.`));
      }
      if (!isFiniteNumber(item.points)) {
        issues.push(error(taskId, `Rubric item ${rubricIndex + 1} points must be a number.`));
      } else if (item.points <= 0) {
        issues.push(warning(taskId, `Rubric item ${rubricIndex + 1} has points <= 0.`));
      }
    });
  }

  if (scoringType === 'multiple_choice') {
    if (!Array.isArray(task.choices) || task.choices.length === 0) {
      issues.push(error(taskId, 'Multiple choice task must include choices.'));
    } else if (!task.choices.every((choice) => typeof choice === 'string' && choice.trim())) {
      issues.push(error(taskId, 'Multiple choice choices must be non-empty strings.'));
    }

    if (!multipleChoiceAnswerMatches(task)) {
      issues.push(error(taskId, 'Multiple choice expectedAnswer must be a valid choice letter or match one of the choices.'));
    }
  }

  if ((scoringType === 'structured_json' || scoringType === 'json_structured') && !hasJsonShape(task) && !hasRubric(task)) {
    issues.push(error(taskId, 'structured_json task must include an expected JSON shape or a rubric.'));
  }

  if (verificationStatus === 'source_verified' && (!Array.isArray(task.sources) || task.sources.length === 0)) {
    issues.push(warning(taskId, 'Task is source_verified but has no sources.'));
  }

  if ('sources' in task && !Array.isArray(task.sources)) {
    issues.push(error(taskId, 'sources must be an array when provided.'));
  }

  if (Array.isArray(task.sources)) {
    task.sources.forEach((source, sourceIndex) => {
      if (!isRecord(source)) {
        issues.push(error(taskId, `Source ${sourceIndex + 1} must be an object.`));
        return;
      }
      if (!isNonEmptyString(source.title)) {
        issues.push(error(taskId, `Source ${sourceIndex + 1} needs a title.`));
      }
      if (!isNonEmptyString(source.url)) {
        issues.push(warning(taskId, `Source ${sourceIndex + 1} is missing a URL.`));
      }
      if (!isNonEmptyString(source.publisher)) {
        issues.push(error(taskId, `Source ${sourceIndex + 1} needs a publisher.`));
      }
      if (!isFiniteNumber(source.year)) {
        issues.push(error(taskId, `Source ${sourceIndex + 1} needs a numeric year.`));
      }
      if (!isNonEmptyString(source.note)) {
        issues.push(error(taskId, `Source ${sourceIndex + 1} needs a note.`));
      }
    });
  }
}

function multipleChoiceAnswerMatches(task: Record<string, unknown>) {
  if (!isNonEmptyString(task.expectedAnswer) || !Array.isArray(task.choices)) {
    return false;
  }

  const expectedAnswer = task.expectedAnswer.trim();
  const choices = task.choices.filter((choice): choice is string => typeof choice === 'string');
  const letterIndex = /^[A-Z]$/i.test(expectedAnswer) ? expectedAnswer.toUpperCase().charCodeAt(0) - 65 : -1;

  return (
    (letterIndex >= 0 && letterIndex < choices.length) ||
    choices.some((choice) => choice.trim() === expectedAnswer)
  );
}

function hasJsonShape(task: Record<string, unknown>) {
  if (!isNonEmptyString(task.expectedAnswer)) {
    return false;
  }

  try {
    JSON.parse(task.expectedAnswer);
    return true;
  } catch {
    return false;
  }
}

function hasRubric(task: Record<string, unknown>) {
  return Array.isArray(task.rubric) && task.rubric.length > 0;
}

function groupIssues(issues: BenchmarkLintIssue[]) {
  return issues.reduce<Record<string, BenchmarkLintIssue[]>>((grouped, issue) => {
    grouped[issue.taskId] = [...(grouped[issue.taskId] ?? []), issue];
    return grouped;
  }, {});
}

function distribution<T extends Partial<BenchmarkTask>>(
  tasks: T[],
  getValue: (task: T) => unknown,
) {
  return tasks.reduce<Record<string, number>>((counts, task) => {
    const value = getValue(task);
    const key = value === undefined || value === null || value === '' ? 'missing' : String(value);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function error(taskId: string, message: string): BenchmarkLintIssue {
  return { severity: 'error', taskId, message };
}

function warning(taskId: string, message: string): BenchmarkLintIssue {
  return { severity: 'warning', taskId, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
