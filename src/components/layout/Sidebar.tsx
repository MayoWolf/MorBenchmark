import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileSearch,
  Gauge,
  ListOrdered,
  Play,
  ShieldCheck,
  TableProperties,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { AppPage } from './types';

interface SidebarProps {
  page: AppPage;
  onPageChange: (page: AppPage) => void;
}

const navItems: Array<{ page: AppPage; label: string; icon: ComponentType<{ className?: string }> }> = [
  { page: 'overview', label: 'Overview', icon: Gauge },
  { page: 'tasks', label: 'Tasks', icon: TableProperties },
  { page: 'run', label: 'Run', icon: Play },
  { page: 'results', label: 'Results', icon: BarChart3 },
  { page: 'leaderboard', label: 'Leaderboard', icon: ListOrdered },
  { page: 'quality', label: 'Pack Quality', icon: ClipboardCheck },
  { page: 'verify', label: 'Verify', icon: ShieldCheck },
  { page: 'docs', label: 'Docs/Scoring', icon: BookOpen },
];

export function Sidebar({ page, onPageChange }: SidebarProps) {
  return (
    <aside className="border-r border-white/10 bg-field-black">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <div className="grid h-7 w-7 place-items-center rounded border border-blue-400/30 bg-blue-400/10">
          <FileSearch className="h-4 w-4 text-blue-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">FRCBench</p>
          <p className="text-[11px] text-slate-500">benchmark runner</p>
        </div>
      </div>
      <nav className="space-y-1 p-2">
        {navItems.map(({ page: itemPage, label, icon: Icon }) => (
          <button
            key={itemPage}
            type="button"
            onClick={() => onPageChange(itemPage)}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition ${
              page === itemPage
                ? 'bg-blue-400/10 text-blue-100'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
