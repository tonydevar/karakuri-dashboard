
import { ProjectSummary } from '../types';
import { formatProjectName, timeAgo } from '../utils';

interface Props {
  project: ProjectSummary;
  onClose: () => void;
}

export function ProjectDetail({ project, onClose }: Props) {
  const issueUrl = project.issueNumber > 0
    ? `https://github.com/${project.repo}/issues/${project.issueNumber}`
    : null;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <h2>{formatProjectName(project.name)}</h2>
          <button className="detail-close" onClick={onClose}>✕</button>
        </div>

        <div className="detail-body">
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value status-chip">{project.status}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Repo</span>
            <a href={`https://github.com/${project.repo}`} target="_blank" rel="noreferrer"
              className="detail-link">{project.repo}</a>
          </div>
          {issueUrl && (
            <div className="detail-row">
              <span className="detail-label">Issue</span>
              <a href={issueUrl} target="_blank" rel="noreferrer"
                className="detail-link">#{project.issueNumber}</a>
            </div>
          )}
          {project.deployUrl && (
            <div className="detail-row">
              <span className="detail-label">Deploy</span>
              <a href={project.deployUrl} target="_blank" rel="noreferrer"
                className="detail-link">{project.deployUrl}</a>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Updated</span>
            <span className="detail-value">{timeAgo(project.updatedAt)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Errors</span>
            <span className="detail-value" style={{ color: project.errorCount > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
              {project.errorCount}
            </span>
          </div>

          {project.completedFeatures.length > 0 && (
            <div className="detail-row">
              <span className="detail-label">Completed</span>
              <span className="detail-value">Features {project.completedFeatures.join(', ')}</span>
            </div>
          )}

          {project.currentFeature && (
            <div className="detail-row">
              <span className="detail-label">In Progress</span>
              <span className="detail-value">Feature {project.currentFeature.number} · {project.currentFeature.phase}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
