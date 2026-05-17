import type { ReactNode } from 'react';
import type { VerificationStatus } from '../../types/benchmark';

type BadgeTone = 'blue' | 'green' | 'amber' | 'red' | 'slate';

const toneClasses: Record<BadgeTone, string> = {
  blue: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  red: 'border-red-400/30 bg-red-400/10 text-red-200',
  slate: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const tone = status === 'source_verified' ? 'green' : status === 'community_reviewed' ? 'blue' : 'amber';
  const label =
    status === 'source_verified' ? 'Source verified' : status === 'community_reviewed' ? 'Community reviewed' : 'Unverified';

  return <Badge tone={tone}>{label}</Badge>;
}
