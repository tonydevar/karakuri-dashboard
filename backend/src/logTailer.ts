import * as fs from 'fs';
import * as path from 'path';
import { getLogsDir } from './stateReader';

// Return the path of the most recently modified orchestrator-*.log
export function getMostRecentOrchestratorLog(): string | null {
  const logsDir = getLogsDir();
  if (!fs.existsSync(logsDir)) return null;

  let entries: string[];
  try {
    entries = fs.readdirSync(logsDir);
  } catch {
    return null;
  }

  const logFiles = entries
    .filter(f => /^orchestrator-.*\.log$/.test(f))
    .map(f => {
      const full = path.join(logsDir, f);
      try {
        const stat = fs.statSync(full);
        return { full, mtime: stat.mtimeMs };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{ full: string; mtime: number }>;

  if (logFiles.length === 0) return null;
  logFiles.sort((a, b) => b.mtime - a.mtime);
  return logFiles[0].full;
}

// Read the last N lines of a file (efficient tail)
export function tailLines(filePath: string, n: number): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    return lines.slice(-n);
  } catch {
    return [];
  }
}

// Read bytes from `position` to EOF, return new position + new lines
export function readNewBytes(filePath: string, position: number): { newPosition: number; lines: string[] } {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size <= position) return { newPosition: position, lines: [] };

    const fd = fs.openSync(filePath, 'r');
    const length = stat.size - position;
    const buf = Buffer.alloc(length);
    fs.readSync(fd, buf, 0, length, position);
    fs.closeSync(fd);

    const text = buf.toString('utf-8');
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return { newPosition: stat.size, lines };
  } catch {
    return { newPosition: position, lines: [] };
  }
}
