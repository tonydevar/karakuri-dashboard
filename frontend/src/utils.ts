export function formatProjectName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'unknown';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return 'unknown';
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Map pipeline status → Kanban column key
export type ColumnKey =
  | 'init'
  | 'review'
  | 'pm'
  | 'architecture'
  | 'ux'
  | 'features'
  | 'deploy'
  | 'e2e'
  | 'complete';

export function statusToColumn(status: string): ColumnKey {
  const s = status.toLowerCase();
  if (s === 'complete' || s === 'shipped') return 'complete';
  if (s.startsWith('e2e')) return 'e2e';
  if (s.startsWith('deploy') || s === 'deploying') return 'deploy';
  if (
    s.startsWith('feat') ||
    s.includes('feat') ||
    s === 'dev' ||
    s === 'dev_done' ||
    s.includes('needs-review') ||
    s.includes('qa') ||
    s === 'review_complete' ||
    s === 'shipped'
  ) return 'features';
  if (s.startsWith('ux') || s.includes('design') || s === 'ux_done') return 'ux';
  if (s.startsWith('arch') || s === 'architecture') return 'architecture';
  if (s.startsWith('pm') || s === 'spec_ready') return 'pm';
  if (s === 'review' || s === 'review_needed') return 'review';
  if (s === 'init' || s === 'created') return 'init';
  // Default: treat unknown as pm/active
  return 'pm';
}
