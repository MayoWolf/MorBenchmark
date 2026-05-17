import { Bot, Scale, ShieldCheck, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { Panel, PanelHeader } from '../ui/Panel';

export function DocsScoringPage() {
  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader eyebrow="Docs" title="Scoring and review model" />
        <div className="p-4">
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            FRCBench keeps v1 scoring transparent. Objective items can be auto-scored; subjective strategy answers are
            exported with rubrics for human review.
          </p>
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <DocCard icon={<Trophy className="h-4 w-4" />} title="Exact and multiple choice" text="Multiple-choice tasks use exact answer matching. This is useful for clear factual checks and smoke tests." />
        <DocCard icon={<Scale className="h-4 w-4" />} title="Keyword scoring" text="Short-answer and structured JSON tasks use rubric keywords as an explainable first pass. Good paraphrases may still need review." />
        <DocCard icon={<ShieldCheck className="h-4 w-4" />} title="Manual rubric review" text="Rubric and manual tasks are captured for human scoring. Reviewers can adjust scores in the result table." />
        <DocCard icon={<Bot className="h-4 w-4" />} title="Judge models later" text="Model-judge grading can reward verbosity and share blind spots with the tested model, so it remains a future calibrated workflow." />
      </div>
    </div>
  );
}

function DocCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2 text-blue-300">{icon}<h2 className="font-semibold text-white">{title}</h2></div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </Panel>
  );
}
