import { IncomingMessage, Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import * as chokidar from 'chokidar';
import { readAllProjects, readProject, getStateGlob, getRegistryPath, getLogsDir } from './stateReader';
import { getMostRecentOrchestratorLog, readNewBytes, tailLines } from './logTailer';
import { WsMessage } from './types';
import * as path from 'path';

let wss: WebSocketServer | null = null;

function broadcast(msg: WsMessage): void {
  if (!wss) return;
  const payload = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Track log file tail position
let logFilePath: string | null = null;
let logPosition = 0;

function refreshLogFile(): void {
  const latest = getMostRecentOrchestratorLog();
  if (latest !== logFilePath) {
    logFilePath = latest;
    logPosition = 0;
    // Fast-forward to current EOF (don't re-send historical lines on reconnect)
    if (logFilePath) {
      const { newPosition } = readNewBytes(logFilePath, 0);
      logPosition = newPosition;
    }
  }
}

export function initWebSocketServer(server: Server): void {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    // Send snapshot of all projects on connect
    const projects = readAllProjects();
    const snapshot: WsMessage = { type: 'snapshot', projects };
    ws.send(JSON.stringify(snapshot));
  });

  // Watch state files + registry
  const stateGlob = getStateGlob();
  const registryPath = getRegistryPath();

  const stateWatcher = chokidar.watch([stateGlob, registryPath], {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  stateWatcher.on('change', (filePath: string) => {
    // Extract project name from state file path or reload all for registry changes
    if (filePath === registryPath) {
      // Registry changed — reload all
      const projects = readAllProjects();
      projects.forEach(project => {
        broadcast({ type: 'project_updated', project });
      });
    } else {
      // Individual state file changed — extract project name from path
      const parts = filePath.split(path.sep);
      const stateIdx = parts.lastIndexOf('state');
      const projectName = stateIdx !== -1 ? parts[stateIdx + 1] : null;
      if (projectName) {
        const project = readProject(projectName);
        if (project) {
          broadcast({ type: 'project_updated', project });
        }
      }
    }
  });

  // Watch logs directory for orchestrator log changes
  const logsDir = getLogsDir();
  refreshLogFile();

  const logWatcher = chokidar.watch(logsDir, {
    persistent: true,
    ignoreInitial: true,
    depth: 0,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  logWatcher.on('change', (filePath: string) => {
    // Refresh which log is most recent
    refreshLogFile();
    if (!logFilePath || filePath !== logFilePath) return;

    const { newPosition, lines } = readNewBytes(logFilePath, logPosition);
    logPosition = newPosition;
    if (lines.length > 0) {
      broadcast({ type: 'log_lines', lines });
    }
  });

  logWatcher.on('add', (filePath: string) => {
    // New orchestrator log appeared — switch to it
    refreshLogFile();
    if (logFilePath && filePath === logFilePath) {
      logPosition = 0;
    }
  });
}
