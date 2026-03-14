import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { readAllProjects, readProject, getLogsDir } from './stateReader';
import { getMostRecentOrchestratorLog, tailLines } from './logTailer';
import { initWebSocketServer } from './wsServer';

const PORT = parseInt(process.env.PORT ?? '8200', 10);
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');

if (!fs.existsSync(distPath)) {
  process.stderr.write('frontend/dist/ not found — build frontend first\n');
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(distPath));

// ── REST Routes ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/projects', (_req: Request, res: Response) => {
  const projects = readAllProjects();
  res.json(projects);
});

app.get('/api/projects/:name', (req: Request, res: Response) => {
  const project = readProject(req.params.name);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
});

app.get('/api/logs/latest', (req: Request, res: Response) => {
  const lines = parseInt((req.query.lines as string) ?? '200', 10);
  const logFile = getMostRecentOrchestratorLog();
  if (!logFile) {
    res.json({ file: null, lines: [] });
    return;
  }
  const logLines = tailLines(logFile, lines);
  res.json({ file: path.basename(logFile), lines: logLines });
});

// SPA fallback — must be last route
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── HTTP + WebSocket Server ─────────────────────────────────────────────────

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  process.stdout.write(`Karakuri Dashboard backend listening on http://localhost:${PORT}\n`);
});

export default app;
