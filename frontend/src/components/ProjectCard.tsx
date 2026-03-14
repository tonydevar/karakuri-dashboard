
import { ProjectSummary } from '../types';
import { formatProjectName, timeAgo } from '../utils';

interface Props {
  project: ProjectSummary;
  onClick: (project: ProjectSummary) => void;
}

export function ProjectCard({ project, onClick }: Props) {
  const hasDeployUrl = !!project.deployUrl;
  const repoName = project.repo.split('/').pop() ?? project.repo;
  const issueUrl = project.issueNumber > 0
    ? `https://github.com/${project.repo}/issues/${project.issueNumber}`
    : null;

  return (
    <div className="project-card" onClick={() => onClick(project)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(project)}>
      <div className="card-header">
        <span className="card-name">{formatProjectName(project.name)}</span>
        {project.errorCount > 0 && (
          <span className="error-badge" title={`${project.errorCount} error(s)`}>
            {project.errorCount}
          </span>
        )}
      </div>

      <div className="card-repo">{repoName}</div>

      <div className="card-meta">
        <span className="card-time">{timeAgo(project.updatedAt)}</span>

        {hasDeployUrl && (
          <a
            className="card-deploy-chip"
            href={project.deployUrl}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
          >
            🌐 Live
          </a>
        )}

        {issueUrl && (
          <a
            className="card-issue-link"
            href={issueUrl}
            target="_blank"
            rel="noreferrer"
            title={`Issue #${project.issueNumber}`}
            onClick={e => e.stopPropagation()}
          >
            #{project.issueNumber}
          </a>
        )}
      </div>
    </div>
  );
}
