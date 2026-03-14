import { useState, useCallback } from 'react';
import { ProjectSummary, WsMessage } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { StatsBar } from './components/StatsBar';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectDetail } from './components/ProjectDetail';

export default function App() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selected, setSelected] = useState<ProjectSummary | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const handleMessage = useCallback((msg: WsMessage) => {
    setWsConnected(true);
    if (msg.type === 'snapshot' && msg.projects) {
      setProjects(msg.projects);
    } else if (msg.type === 'project_updated' && msg.project) {
      setProjects(prev => {
        const idx = prev.findIndex(p => p.name === msg.project!.name);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = msg.project!;
          return next;
        }
        return [...prev, msg.project!];
      });
      // Update selected project if it's the one being updated
      setSelected(prev =>
        prev && msg.project && prev.name === msg.project.name ? msg.project : prev
      );
    }
  }, []);

  useWebSocket(handleMessage);

  return (
    <div className="app">
      <StatsBar projects={projects} wsConnected={wsConnected} />
      <KanbanBoard projects={projects} onSelectProject={setSelected} />
      {selected && (
        <ProjectDetail project={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
