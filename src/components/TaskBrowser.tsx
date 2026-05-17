import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { BenchmarkCategory, BenchmarkTask, VerificationStatus } from '../types/benchmark';
import { Badge, VerificationBadge } from './ui/Badge';
import { Button } from './ui/Button';
import { Panel, PanelHeader } from './ui/Panel';
import { DataTable, StickyHeader, TableShell } from './ui/Table';

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

export function TaskBrowser({ tasks }: { tasks: BenchmarkTask[] }) {
  const [query, setQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<BenchmarkTask | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<BenchmarkCategory[]>(() =>
    Array.from(new Set(tasks.map((task) => task.category))).sort() as BenchmarkCategory[],
  );
  const [selectedSeasons, setSelectedSeasons] = useState<number[]>(() =>
    Array.from(new Set(tasks.map((task) => task.season))).sort((a, b) => b - a),
  );
  const [selectedVerificationStatuses, setSelectedVerificationStatuses] =
    useState<VerificationStatus[]>(verificationStatuses);

  const categories = useMemo(() => Array.from(new Set(tasks.map((task) => task.category))).sort() as BenchmarkCategory[], [tasks]);
  const seasons = useMemo(() => Array.from(new Set(tasks.map((task) => task.season))).sort((a, b) => b - a), [tasks]);

  useEffect(() => {
    setSelectedCategories(categories);
    setSelectedSeasons(seasons);
    setSelectedVerificationStatuses(verificationStatuses);
  }, [categories, seasons, tasks]);

  const visibleTasks = tasks.filter((task) => {
    const queryMatch = [task.id, task.prompt, task.gameName, task.category, task.difficulty, task.scoringType, ...task.tags]
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
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  };

  const toggleSeason = (season: number) => {
    setSelectedSeasons((current) =>
      current.includes(season) ? current.filter((item) => item !== season) : [...current, season],
    );
  };

  const toggleVerificationStatus = (status: VerificationStatus) => {
    setSelectedVerificationStatuses((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <Panel>
        <PanelHeader eyebrow="Tasks" title={`${visibleTasks.length} visible / ${tasks.length} total`}>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input h-9 pl-9"
              placeholder="Search id, prompt, tags..."
            />
          </div>
        </PanelHeader>

        <TableShell>
          <DataTable>
            <StickyHeader>
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Season</th>
                <th className="px-3 py-2 font-medium">Game</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Difficulty</th>
                <th className="px-3 py-2 font-medium">Scoring</th>
                <th className="px-3 py-2 font-medium">Verification</th>
                <th className="px-3 py-2 font-medium">Tags</th>
              </tr>
            </StickyHeader>
            <tbody className="divide-y divide-white/10">
              {visibleTasks.map((task) => (
                <tr
                  key={task.id}
                  className="cursor-pointer text-slate-300 transition hover:bg-white/[0.03]"
                  onClick={() => setSelectedTask(task)}
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-white">{task.id}</td>
                  <td className="px-3 py-2">{task.season}</td>
                  <td className="whitespace-nowrap px-3 py-2">{task.gameName}</td>
                  <td className="whitespace-nowrap px-3 py-2">{categoryLabels[task.category]}</td>
                  <td className="px-3 py-2"><Badge>{task.difficulty}</Badge></td>
                  <td className="whitespace-nowrap px-3 py-2"><Badge tone="blue">{task.scoringType}</Badge></td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <VerificationBadge status={task.verificationStatus ?? 'unverified'} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex max-w-sm flex-wrap gap-1">
                      {task.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                      {task.tags.length > 4 && <Badge>+{task.tags.length - 4}</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableShell>
      </Panel>

      <Panel className="self-start p-4">
        <h2 className="text-sm font-semibold text-white">Filters</h2>
        <FilterGroup title="Categories">
          {categories.map((category) => (
            <CheckFilter
              key={category}
              label={categoryLabels[category]}
              checked={selectedCategories.includes(category)}
              onChange={() => toggleCategory(category)}
            />
          ))}
        </FilterGroup>
        <FilterGroup title="Seasons">
          <div className="grid grid-cols-2 gap-2">
            {seasons.map((season) => (
              <CheckFilter
                key={season}
                label={String(season)}
                checked={selectedSeasons.includes(season)}
                onChange={() => toggleSeason(season)}
              />
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title="Verification">
          {verificationStatuses.map((status) => (
            <CheckFilter
              key={status}
              label={verificationLabels[status]}
              checked={selectedVerificationStatuses.includes(status)}
              onChange={() => toggleVerificationStatus(status)}
            />
          ))}
        </FilterGroup>
      </Panel>

      {selectedTask && <TaskDetails task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckFilter({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-blue-400" />
      {label}
    </label>
  );
}

function TaskDetails({ task, onClose }: { task: BenchmarkTask; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded border border-white/10 bg-field-panel shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-white/10 bg-field-panel px-4 py-3">
          <div>
            <p className="font-mono text-sm text-blue-200">{task.id}</p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {task.season} · {task.gameName} · {categoryLabels[task.category]}
            </h2>
          </div>
          <Button type="button" onClick={onClose} aria-label="Close task details">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-5 p-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <TextBlock title="Prompt" text={task.prompt} />
            <TextBlock title="Expected answer" text={task.expectedAnswer} />
            {task.sourceNote && <TextBlock title="Source note" text={task.sourceNote} />}
            {task.publicExplanation && <TextBlock title="Public explanation" text={task.publicExplanation} />}
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Rubric</h3>
              <ul className="mt-2 space-y-2">
                {task.rubric.map((item) => (
                  <li key={`${item.point}-${item.points}`} className="rounded border border-white/10 bg-field-black p-3 text-sm text-slate-300">
                    <span className="font-medium text-white">{item.points} pt</span> · {item.point}
                    {item.keywords?.length ? <p className="mt-1 text-xs text-slate-500">Keywords: {item.keywords.join(', ')}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <aside className="space-y-4 rounded border border-white/10 bg-field-rail p-4">
            <Meta label="Difficulty" value={task.difficulty} />
            <Meta label="Scoring" value={task.scoringType} />
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Verification</h3>
              <div className="mt-2"><VerificationBadge status={task.verificationStatus ?? 'unverified'} /></div>
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Tags</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {task.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Sources</h3>
              {task.sources?.length ? (
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {task.sources.map((source) => (
                    <li key={`${source.title}-${source.url}`} className="break-words">
                      <a className="text-blue-200 hover:text-blue-100" href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                      <p className="text-xs text-slate-500">{source.publisher}, {source.year}. {source.note}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No sources attached.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</h3>
      <p className="mt-1 text-sm text-slate-300">{value}</p>
    </div>
  );
}
