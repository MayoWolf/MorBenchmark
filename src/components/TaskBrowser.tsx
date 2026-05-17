import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BenchmarkCategory, BenchmarkTask, VerificationStatus } from '../types/benchmark';

interface TaskBrowserProps {
  tasks: BenchmarkTask[];
  selectedCategories: BenchmarkCategory[];
  selectedSeasons: number[];
  onSelectedCategoriesChange: (categories: BenchmarkCategory[]) => void;
  onSelectedSeasonsChange: (seasons: number[]) => void;
}

const categoryLabels: Record<BenchmarkCategory, string> = {
  game_rules: 'Game rules',
  strategy_meta: 'Strategy meta',
  alliance_selection: 'Alliance selection',
  match_analysis: 'Match analysis',
  ranking_points: 'Ranking points',
  robot_design_tradeoffs: 'Robot design',
  scouting_interpretation: 'Scouting',
  historical_meta: 'Historical meta',
};

const verificationLabels: Record<VerificationStatus, string> = {
  unverified: 'Unverified',
  community_reviewed: 'Community reviewed',
  source_verified: 'Source verified',
};

const verificationStatuses: VerificationStatus[] = ['unverified', 'community_reviewed', 'source_verified'];

export function TaskBrowser({
  tasks,
  selectedCategories,
  selectedSeasons,
  onSelectedCategoriesChange,
  onSelectedSeasonsChange,
}: TaskBrowserProps) {
  const [query, setQuery] = useState('');
  const [selectedVerificationStatuses, setSelectedVerificationStatuses] =
    useState<VerificationStatus[]>(verificationStatuses);
  const categories = useMemo(() => Array.from(new Set(tasks.map((task) => task.category))).sort(), [tasks]);
  const seasons = useMemo(() => Array.from(new Set(tasks.map((task) => task.season))).sort((a, b) => b - a), [tasks]);

  const visibleTasks = tasks.filter((task) => {
    const queryMatch = [task.id, task.prompt, task.gameName, task.category, ...task.tags]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase());
    return (
      queryMatch &&
      selectedCategories.includes(task.category) &&
      selectedSeasons.includes(task.season) &&
      selectedVerificationStatuses.includes(task.verificationStatus ?? 'unverified')
    );
  });

  const toggleCategory = (category: BenchmarkCategory) => {
    onSelectedCategoriesChange(
      selectedCategories.includes(category)
        ? selectedCategories.filter((item) => item !== category)
        : [...selectedCategories, category],
    );
  };

  const toggleSeason = (season: number) => {
    onSelectedSeasonsChange(
      selectedSeasons.includes(season)
        ? selectedSeasons.filter((item) => item !== season)
        : [...selectedSeasons, season],
    );
  };

  const toggleVerificationStatus = (status: VerificationStatus) => {
    setSelectedVerificationStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  return (
    <section className="rounded-lg border border-white/10 bg-field-panel p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-blue-200">
            <Filter className="h-4 w-4" />
            Dataset/task browser
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">{visibleTasks.length} selected tasks</h2>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input pl-10"
            placeholder="Search tasks, tags, games..."
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="grid gap-3 md:grid-cols-2">
          {visibleTasks.map((task) => (
            <article key={task.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="badge-blue">{task.season}</span>
                <span>{task.gameName}</span>
                <span>{categoryLabels[task.category]}</span>
                <span>{task.difficulty}</span>
                <VerificationBadge status={task.verificationStatus ?? 'unverified'} />
              </div>
              <h3 className="mt-3 font-semibold text-white">{task.id}</h3>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-300">{task.prompt}</p>
              {task.publicExplanation && <p className="mt-3 text-xs text-slate-500">{task.publicExplanation}</p>}
            </article>
          ))}
        </div>

        <aside className="space-y-5 rounded-lg border border-white/10 bg-field-rail p-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Categories</h3>
            <div className="mt-3 space-y-2">
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="h-4 w-4 accent-blue-400"
                  />
                  {categoryLabels[category]}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Seasons</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {seasons.map((season) => (
                <label key={season} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedSeasons.includes(season)}
                    onChange={() => toggleSeason(season)}
                    className="h-4 w-4 accent-blue-400"
                  />
                  {season}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Verification</h3>
            <div className="mt-3 space-y-2">
              {verificationStatuses.map((status) => (
                <label key={status} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedVerificationStatuses.includes(status)}
                    onChange={() => toggleVerificationStatus(status)}
                    className="h-4 w-4 accent-blue-400"
                  />
                  {verificationLabels[status]}
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const className =
    status === 'source_verified'
      ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
      : status === 'community_reviewed'
        ? 'border-blue-300/30 bg-blue-400/10 text-blue-100'
        : 'border-amber-300/30 bg-amber-400/10 text-amber-100';

  return (
    <span className={`rounded-full border px-2 py-0.5 font-medium ${className}`}>
      {verificationLabels[status]}
    </span>
  );
}
