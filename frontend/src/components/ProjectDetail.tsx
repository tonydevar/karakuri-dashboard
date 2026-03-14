import { useState, useEffect, useCallback } from 'react';
import { ProjectSummary, ProjectDetail as ProjectDetailType } from '../types';
import { formatProjectName, timeAgo, statusToColumn } from '../utils';
import { LogPanel } from './LogPanel';

// The 9 pipeline stages in order
const STAGES = [
  { key: 'init',         label: 'Init' },
  { key: 'review',       label: 'Review' },
  { key: 'pm',           label: 'PM' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'ux',           label: 'UX / Design' },
  { key: 'features',     label: 'Features' },
  { key: 'deploy',       label: 'Deploy' },
  { key: 'e2e',          label: 'E2E' },
  { key: 'complete',     label: 'Complete' },
] as const;

interface Props {
  project: ProjectSummary;
  onClose: () => void;
  newLogLines?: string[];
}

export function ProjectDetail({ project, onClose, newLogLines = [] }: Props) {
  const [detail, setDetail] = useState<ProjectDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch full project detail
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/projects/${encodeURIComponent(project.name)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data: ProjectDetailType) => {
        setDetail(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [project.name]);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const d = detail ?? project as unknown as ProjectDetailType;
  const currentColumn = statusToColumn(d.status);
  const currentStageIdx = STAGES.findIndex(s => s.key === currentColumn);
  const issueUrl = d.issueNumber > 0 ? `https://github.com/${d.repo}/issues/${d.issueNumber}` : null;
  const repoUrl = `https://github.com/${d.repo}`;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <h2 className="detail-title">{formatProjectName(d.name)}</h2>
            <div className="detail-header-links">
              <a href={repoUrl} target="_blank" rel="noreferrer" className="detail-link-chip">
                📦 {d.repo}
              </a>
              {issueUrl && (
                <a href={issueUrl} target="_blank" rel="noreferrer" className="detail-link-chip">
                  🔗 #{d.issueNumber}
                </a>
              )}
              {d.deployUrl && (
                <a href={d.deployUrl} target="_blank" rel="noreferrer" className="detail-link-chip detail-deploy">
                  🌐 Live
                </a>
              )}
            </div>
          </div>
          <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="detail-body">
          {/* Status + timestamps */}
          <div className="detail-meta-row">
            <span className="status-chip">{d.status}</span>
            <span className="detail-time">Updated {timeAgo(d.updatedAt)}</span>
          </div>

          {/* ── Stage Timeline ──────────────────────────────────── */}
          <section className="detail-section">
            <h3 className="detail-section-title">Stage Timeline</h3>
            <div className="stage-list">
              {STAGES.map((stage, idx) => {
                const isComplete  = idx < currentStageIdx;
                const isCurrent   = idx === currentStageIdx;
                const isUpcoming  = idx > currentStageIdx;

                return (
                  <div key={stage.key}
                    className={`stage-row ${isComplete ? 'stage-done' : ''} ${isCurrent ? 'stage-active' : ''} ${isUpcoming ? 'stage-pending' : ''}`}>
                    <span className="stage-icon">
                      {isComplete  ? '✅' : isCurrent ? '🔄' : '⬜'}
                    </span>
                    <span className="stage-label">{stage.label}</span>
                    {isCurrent && (
                      <span className="stage-current-badge">current</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Error Log ──────────────────────────────────────── */}
          {loading && <div className="detail-loading">Loading…</div>}
          {error && <div className="detail-error">Failed to load detail: {error}</div>}

          {!loading && detail && detail.errors.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title" style={{ color: 'var(--red)' }}>
                Errors ({detail.errors.length})
              </h3>
              <div className="error-list">
                {detail.errors.map((err, i) => (
                  <div key={i} className="error-card">
                    <div className="error-phase">{err.phase}</div>
                    <div className="error-message">{err.error}</div>
                    {err.recovery && (
                      <div className="error-recovery">{err.recovery}</div>
                    )}
                    <div className="error-timestamp">{timeAgo(err.at)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Design Section ──────────────────────────────────── */}
          {!loading && detail?.design && detail.design.status !== 'skipped' && (
            <section className="detail-section">
              <h3 className="detail-section-title">Design</h3>
              <div className="design-block">
                <span className="design-status">{detail.design.status}</span>
                {detail.design.reason && (
                  <p className="design-reason">{detail.design.reason}</p>
                )}
              </div>
            </section>
          )}

          {/* ── Features ────────────────────────────────────────── */}
          {(d.completedFeatures.length > 0 || d.currentFeature) && (
            <section className="detail-section">
              <h3 className="detail-section-title">Features</h3>
              {d.completedFeatures.map(n => (
                <div key={n} className="stage-row stage-done">
                  <span className="stage-icon">✅</span>
                  <span className="stage-label">Feature {n}</span>
                </div>
              ))}
              {d.currentFeature && (
                <div className="stage-row stage-active">
                  <span className="stage-icon">🔄</span>
                  <span className="stage-label">Feature {d.currentFeature.number}</span>
                  <span className="stage-current-badge">{d.currentFeature.phase}</span>
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Live Log Panel ──────────────────────────────────── */}
        <LogPanel newLines={newLogLines} />
      </div>
    </div>
  );
}
