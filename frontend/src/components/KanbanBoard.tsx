
import { ProjectSummary } from '../types';
import { statusToColumn, ColumnKey } from '../utils';
import { ProjectCard } from './ProjectCard';
import { FeatureCard } from './FeatureCard';

const COLUMNS: Array<{ key: ColumnKey; label: string }> = [
  { key: 'init',         label: 'Init' },
  { key: 'review',       label: 'Review' },
  { key: 'pm',           label: 'PM' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'ux',           label: 'UX / Design' },
  { key: 'features',     label: 'Features' },
  { key: 'deploy',       label: 'Deploy' },
  { key: 'e2e',          label: 'E2E' },
  { key: 'complete',     label: 'Complete' },
];

interface Props {
  projects: ProjectSummary[];
  onSelectProject: (p: ProjectSummary) => void;
}

export function KanbanBoard({ projects, onSelectProject }: Props) {
  const byColumn: Record<ColumnKey, ProjectSummary[]> = {
    init: [], review: [], pm: [], architecture: [], ux: [],
    features: [], deploy: [], e2e: [], complete: [],
  };

  for (const p of projects) {
    byColumn[statusToColumn(p.status)].push(p);
  }

  return (
    <div className="kanban-board">
      {COLUMNS.map(({ key, label }) => (
        <div className="kanban-column" key={key}>
          <div className="column-header">
            <span className="column-label">{label}</span>
            <span className="column-count">{byColumn[key].length}</span>
          </div>
          <div className="column-cards">
            {byColumn[key].map(p =>
              key === 'features'
                ? <FeatureCard key={p.name} project={p} onClick={onSelectProject} />
                : <ProjectCard key={p.name} project={p} onClick={onSelectProject} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
