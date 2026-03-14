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

export interface PipelineState {
  version: number;
  status: string;
  repo: string;
  repo_url: string;
  issue_number: number;
  deploy_url: string;
  updated_at: string;
  created_at: string;
  errors: Array<{ phase: string; error: string; at: string; recovery?: string }>;
  features?: Record<string, { status: string; phase?: string; completed_at?: string }>;
}

export interface DeployRegistry {
  [name: string]: {
    repo?: string;
    pid?: number;
    port?: number;
    url?: string;
    serve_dir?: string;
    deployed_at?: string;
  };
}

export interface WsMessage {
  type: 'snapshot' | 'project_updated' | 'log_lines';
  projects?: ProjectSummary[];
  project?: ProjectSummary;
  lines?: string[];
}

export interface LogLine {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  raw: string;
}
