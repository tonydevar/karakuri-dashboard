
import { ProjectSummary } from '../types';

interface Props {
  projects: ProjectSummary[];
  wsConnected: boolean;
}

export function StatsBar({ projects, wsConnected }: Props) {
  const total = projects.length;
  const active = projects.filter(p => p.status !== 'complete' && p.status !== 'shipped').length;
  const errors = projects.reduce((sum, p) => sum + p.errorCount, 0);

  return (
    <div className="stats-bar">
      <div className="stats-logo">
        <span className="stats-logo-icon">🤖</span>
        <span className="stats-logo-text">Karakuri</span>
      </div>
      <div className="stats-items">
        <div className="stat-item">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: 'var(--blue)' }}>{active}</span>
          <span className="stat-label">Active</span>
        </div>
        {errors > 0 && (
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--red)' }}>{errors}</span>
            <span className="stat-label">Errors</span>
          </div>
        )}
      </div>
      <div className={`ws-indicator ${wsConnected ? 'ws-connected' : 'ws-disconnected'}`}
        title={wsConnected ? 'Live' : 'Disconnected'}>
        <span className="ws-dot" />
        <span className="ws-label">{wsConnected ? 'Live' : 'Offline'}</span>
      </div>
    </div>
  );
}
