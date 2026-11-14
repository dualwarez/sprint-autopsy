// Sprint Autopsy — UI Kit frontend
import React, { useEffect, useState } from 'react';
import { view, invoke } from '@forge/bridge';
import {
  Text, Strong, Button, Spinner, DynamicTable, SectionMessage,
} from '@forge/react';

const Stat = ({ label, value, tone }) => (
  <div style={{ flex: 1, background: '#f4f5f7', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
    <div style={{ fontSize: 28, fontWeight: 700, color: tone || '#172b4d' }}>{value}</div>
    <div style={{ fontSize: 12, color: '#6b778c' }}>{label}</div>
  </div>
);

const App = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ctx = await view.getContext();
        const projectKey = (ctx && ctx.project && ctx.project.key) || 'DEM';
        const res = await invoke('fetchSprintData', { projectKey });
        if (res.ok) setData(res);
        else setError(res.error);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner size="large" />;
  if (error) return <SectionMessage appearance="warning" title="Could not analyze">{error}</SectionMessage>;

  const { sprint, stats } = data;
  const rows = data.issues.map(i => ({
    key: i.key,
    cells: [
      { key: i.key, content: i.key },
      { content: i.summary },
      { content: i.type },
      { content: i.status },
      { content: i.assignee },
      { content: String(i.points) },
    ],
  }));

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>🧟 Sprint Autopsy</h1>
      <p><Strong>{sprint.name}</Strong> · board: {sprint.board}</p>
      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <Stat label="Issues" value={stats.total} />
        <Stat label="Done" value={stats.doneCount} tone="#2e9e5b" />
        <Stat label="Spilled over" value={stats.spilledCount} tone="#d64a3a" />
        <Stat label="Spillover rate" value={`${stats.spilloverRate}%`} tone={stats.spilloverRate > 30 ? '#d64a3a' : '#2e9e5b'} />
        <Stat label="Bugs" value={stats.bugCount} tone="#d67a3a" />
      </div>
      <h3>Points</h3>
      <p>Committed: <Strong>{stats.points.committed}</Strong> · Delivered: <Strong>{stats.points.delivered}</Strong></p>
      {stats.ghosts.length > 0 && (
        <SectionMessage appearance="info" title="Ghost tickets (created, never worked)">
          {stats.ghosts.join(', ')}
        </SectionMessage>
      )}
      <h3>All issues</h3>
      <DynamicTable rows={rows} head={{ cells: [
        { key: 'key', content: 'Key' }, { key: 'summary', content: 'Summary' },
        { key: 'type', content: 'Type' }, { key: 'status', content: 'Status' },
        { key: 'assignee', content: 'Assignee' }, { key: 'points', content: 'Pts' },
      ] }} />
    </div>
  );
};

export default App;
