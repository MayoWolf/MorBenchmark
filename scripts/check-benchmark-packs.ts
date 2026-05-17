import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { lintBenchmarkPack } from '../src/lib/lintBenchmarkPack';

const roots = ['benchmark-packs', 'src/benchmarks'];
const files = roots.flatMap((root) =>
  readdirSync(root)
    .filter((file) => file.endsWith('.json'))
    .map((file) => join(root, file)),
);

let totalErrors = 0;
let totalWarnings = 0;

console.log(`FRCBench benchmark pack check\n`);

for (const file of files) {
  console.log(`Checking ${file}`);

  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown;
    const report = lintBenchmarkPack(parsed);

    totalErrors += report.errors.length;
    totalWarnings += report.warnings.length;

    console.log(`  tasks: ${report.taskCount}`);
    console.log(`  errors: ${report.errors.length}`);
    console.log(`  warnings: ${report.warnings.length}`);
    printDistribution('categories', report.categoryDistribution);
    printDistribution('seasons', report.seasonDistribution);
    printDistribution('scoring', report.scoringTypeDistribution);
    printDistribution('verification', report.verificationStatusDistribution);

    const issueGroups = Object.entries(report.issuesByTask).sort(([a], [b]) => a.localeCompare(b));
    if (issueGroups.length > 0) {
      console.log('  issues:');
      issueGroups.forEach(([taskId, issues]) => {
        console.log(`    ${taskId}`);
        issues.forEach((issue) => {
          const marker = issue.severity === 'error' ? 'ERROR' : 'WARN ';
          console.log(`      [${marker}] ${issue.message}`);
        });
      });
    }
  } catch (error) {
    totalErrors += 1;
    const message = error instanceof Error ? error.message : 'Unknown file read/parse error.';
    console.log(`  [ERROR] Could not parse JSON: ${message}`);
  }

  console.log('');
}

console.log(`Summary: ${files.length} files, ${totalErrors} errors, ${totalWarnings} warnings`);

if (totalErrors > 0) {
  process.exitCode = 1;
}

function printDistribution(label: string, distribution: Record<string, number>) {
  const value = Object.entries(distribution)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `${key}:${count}`)
    .join(', ');
  console.log(`  ${label}: ${value || 'none'}`);
}
