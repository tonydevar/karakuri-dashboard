
import { ProjectSummary } from '../types';
import { formatProjectName, timeAgo } from '../utils';

interface Props {
  project: ProjectSummary;
  onClick: (project: ProjectSummary) => void;
}

function featureIcon(featureNum: number, project: ProjectSummary): string {
  if (project.completedFeatures.includes(featureNum)) return '✅';
  if (project.currentFeature?.number === featureNum) return '🔄';
  return '⬜';
}

// Infer total features: max of completed + current
function inferTotalFeatures(project: ProjectSummary): number {
  const maxCompleted = project.completedFeatures.length > 0
    ? Math.max(...project.completedFeatures)
    : 0;
  const current = project.currentFeature?.number ?? 0;
  return Math.max(maxCompleted, current, 1);
}

export function FeatureCard({ project, onClick }: Props) {
  const total = inferTotalFeatures(project);
  const featureNums = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="feature-card" onClick={() => onClick(project)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(project)}>
      <div className="card-header">
        <span className="card-name">{formatProjectName(project.name)}</span>
        {project.errorCount > 0 && (
          <span className="error-badge">{project.errorCount}</span>
        )}
      </div>

      <div className="card-repo">{project.repo.split('/').pop()}</div>

      <div className="feature-list">
        {featureNums.map(n => (
          <div key={n} className="feature-row">
            <span className="feature-icon">{featureIcon(n, project)}</span>
            <span className="feature-label">
              Feature {n}
              {project.currentFeature?.number === n && (
                <span className="feature-phase"> · {project.currentFeature.phase}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="card-meta">
        <span className="card-time">{timeAgo(project.updatedAt)}</span>
      </div>
    </div>
  );
}
