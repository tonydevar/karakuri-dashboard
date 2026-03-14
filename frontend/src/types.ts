export interface ProjectSummary {
  name: string;
  status: string;
  repo: string;
  issueNumber: number;
  deployUrl: string;
  updatedAt: string;
  createdAt: string;
  errorCount: number;
  completedFeatures: number[];
  currentFeature?: { number: number; phase: string };
}

export interface WsMessage {
  type: 'snapshot' | 'project_updated' | 'log_lines';
  projects?: ProjectSummary[];
  project?: ProjectSummary;
  lines?: string[];
}
