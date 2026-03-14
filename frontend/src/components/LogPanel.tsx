import { useState, useEffect, useRef, useCallback } from 'react';

interface LogLineRendered {
  raw: string;
  timestamp: string;
  level: string;
  component: string;
  message: string;
  isSeparator: boolean;
}

// Parse log line format: [ISO-TIMESTAMP] [LEVEL ] [COMPONENT] message
// or separator: [ISO-TIMESTAMP] [-----] ──────────────
function parseLine(raw: string): LogLineRendered {
  const m = raw.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(?:\[([^\]]+)\]\s+)?(.*)$/);
  if (!m) {
    return { raw, timestamp: '', level: '', component: '', message: raw, isSeparator: false };
  }
  const level = m[2].trim();
  const isSeparator = level === '-----' || /^─+$/.test(m[4] ?? '');
  const component = m[3] ? m[3].trim() : '';
  const message = m[4] ?? '';
  return { raw, timestamp: m[1], level, component, message, isSeparator };
}

function levelColor(level: string): string {
  if (level === 'ERROR') return 'var(--red)';
  if (level === 'WARN' || level === 'WARNING') return 'var(--amber)';
  if (level === 'INFO') return 'var(--text-muted)';
  return 'var(--text-muted)';
}

interface Props {
  newLines: string[]; // streamed from WS log_lines, passed from parent
}

export function LogPanel({ newLines }: Props) {
  const [lines, setLines] = useState<LogLineRendered[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const prevNewLines = useRef<string[]>([]);

  // Fetch initial tail
  useEffect(() => {
    setLoading(true);
    fetch('/api/logs/latest?lines=200')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data: { file: string | null; lines: string[] }) => {
        setLines(data.lines.map(parseLine));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Append new lines from WebSocket
  useEffect(() => {
    if (newLines === prevNewLines.current) return;
    prevNewLines.current = newLines;
    if (newLines.length === 0) return;
    setLines(prev => [...prev, ...newLines.map(parseLine)]);
  }, [newLines]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    if (!atBottom && autoScrollRef.current) {
      autoScrollRef.current = false;
      setAutoScroll(false);
    } else if (atBottom && !autoScrollRef.current) {
      autoScrollRef.current = true;
      setAutoScroll(true);
    }
  }, []);

  const resumeScroll = useCallback(() => {
    autoScrollRef.current = true;
    setAutoScroll(true);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="log-panel">
      <div className="log-panel-header">
        <span className="log-panel-title">Live Logs</span>
        {loading && <span className="log-loading">Loading…</span>}
        <span className="log-line-count">{lines.length} lines</span>
      </div>

      <div className="log-scroll" ref={scrollRef} onScroll={handleScroll}>
        {lines.map((line, i) => {
          if (line.isSeparator) {
            return <div key={i} className="log-separator" />;
          }
          return (
            <div key={i} className="log-line" style={{ color: levelColor(line.level) }}>
              {line.timestamp && (
                <span className="log-ts">{line.timestamp.replace('T', ' ').replace('Z', '')}</span>
              )}
              {line.component && (
                <span className="log-component">{line.component}</span>
              )}
              <span className="log-message">{line.message || line.raw}</span>
            </div>
          );
        })}
      </div>

      {!autoScroll && (
        <button className="log-resume-btn" onClick={resumeScroll}>
          ↓ Resume auto-scroll
        </button>
      )}
    </div>
  );
}
