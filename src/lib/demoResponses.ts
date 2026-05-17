import type { BenchmarkTask, ModelResponse } from '../types/benchmark';

export async function getDemoModelResponse(task: BenchmarkTask): Promise<ModelResponse> {
  const started = performance.now();
  await new Promise((resolve) => window.setTimeout(resolve, 250 + Math.random() * 500));

  const content =
    task.scoringType === 'multiple_choice'
      ? task.expectedAnswer
      : task.scoringType === 'json_structured'
        ? '{"role":"scoring/cycling candidate","strengths":["teleop speed","low foul risk"],"risks":["inconsistent autonomous"],"dataToVerify":["cycle time","auto success rate","scoring accuracy"]}'
        : [
            'Demo response:',
            task.expectedAnswer,
            'I would verify official season-specific details before treating this as canonical.',
          ].join(' ');

  return {
    content,
    latency: Math.round(performance.now() - started),
  };
}
