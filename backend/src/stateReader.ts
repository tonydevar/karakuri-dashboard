import * as fs from 'fs';
import * as path from 'path';
import { ProjectSummary, ProjectDetail, PipelineState, DeployRegistry } from './types';

const WORKSPACE = process.env.KARAKURI_WORKSPACE ?? '';

export function getStateDir(): string {
  return path.join(WORKSPACE, 'state');
}

export function getRegistryPath(): string {
  return path.join(WORKSPACE, 'deploys', 'registry.json');
}

export function getLogsDir(): string {
  return path.join(WORKSPACE, 'logs');
}

function readJsonSafe<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function normalizeProject(name: string, state: PipelineState, registry: DeployRegistry): ProjectSummary {
  const deploy = registry[name];

  // Compute completed features — prefer modern completed_features[] field,
  // fall back to legacy state.features object map
  const completedFeatures: number[] = [];
  let currentFeature: { number: number; phase: string } | undefined;

  if (state.completed_features && Array.isArray(state.completed_features)) {
    // Modern state files: completed_features is a number[] e.g. [1, 2, 3, 4]
    completedFeatures.push(...state.completed_features);
    completedFeatures.sort((a, b) => a - b);
  } else if (state.features) {
    // Legacy state files: features is Record<string, {status, phase?, ...}>
    for (const [key, feat] of Object.entries(state.features)) {
      const num = parseInt(key.replace(/\D/g, ''), 10);
      if (isNaN(num)) continue;
      if (feat.status === 'complete') {
        completedFeatures.push(num);
      } else if (!currentFeature) {
        currentFeature = { number: num, phase: feat.phase ?? feat.status ?? 'unknown' };
      }
    }
    completedFeatures.sort((a, b) => a - b);
  }

  return {
    name,
    status: state.status,
    repo: state.repo || deploy?.repo || name,
    issueNumber: state.issue_number ?? 0,
    deployUrl: state.deploy_url || deploy?.url || '',
    updatedAt: state.updated_at,
    createdAt: state.created_at,
    errorCount: Array.isArray(state.errors) ? state.errors.length : 0,
    completedFeatures,
    currentFeature,
  };
}

export function readAllProjects(): ProjectSummary[] {
  const stateDir = getStateDir();
  if (!fs.existsSync(stateDir)) return [];

  const registry = readJsonSafe<DeployRegistry>(getRegistryPath()) ?? {};

  const projects: ProjectSummary[] = [];

  let entries: string[];
  try {
    entries = fs.readdirSync(stateDir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    const stateFile = path.join(stateDir, entry, 'pipeline-state.json');
    if (!fs.existsSync(stateFile)) continue;
    const state = readJsonSafe<PipelineState>(stateFile);
    if (!state) continue;
    projects.push(normalizeProject(entry, state, registry));
  }

  // Sort by updatedAt descending
  projects.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
  return projects;
}

export function readProject(name: string): ProjectDetail | null {
  const stateFile = path.join(getStateDir(), name, 'pipeline-state.json');
  if (!fs.existsSync(stateFile)) return null;

  const state = readJsonSafe<PipelineState>(stateFile);
  if (!state) return null;

  const registry = readJsonSafe<DeployRegistry>(getRegistryPath()) ?? {};
  const summary = normalizeProject(name, state, registry);

  return {
    ...summary,
    errors: Array.isArray(state.errors) ? state.errors : [],
    design: state.design,
  };
}

export function getStateGlob(): string {
  return path.join(getStateDir(), '**', 'pipeline-state.json');
}
