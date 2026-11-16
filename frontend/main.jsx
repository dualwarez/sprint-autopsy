window.__errs=[];
window.addEventListener('error', e => { const r=document.getElementById('root'); if(r) r.innerHTML += '<pre style="color:red">ERR: '+String(e.message)+'</pre>'; });
window.addEventListener('unhandledrejection', e => { const r=document.getElementById('root'); if(r) r.innerHTML += '<pre style="color:red">REJ: '+String(e.reason).slice(0,300)+'</pre>'; });
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { view, invoke } from '@forge/bridge';

const Stat = ({ label, value, tone }) => (
  <div style={{ flex: 1, background: '#f4f5f7', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
    <div style={{ fontSize: 26, fontWeight: 700, color: tone || '#172b4d' }}>{value}</div>
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
        const pk = ctx?.project?.key || ctx?.extension?.project?.key || ctx?.local?.project?.key || ctx?.context?.project?.key;
        const res = await invoke('fetchSprintData', { projectKey: pk, ctxKeys: Object.keys(ctx||{}) });
        if (res && res.ok) setData(res);
        else setError((res && res.error) || 'Unknown error');
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#6b778c' }}>Running autopsy…</div>;
  if (error) return (
    <div style={{ padding: 40 }}>
      <h3 style={{ color: '#bf2600' }}>⚠️ Could not analyze</h3>
      <p style={{ color: '#6b778c' }}>{error}</p>
    </div>
  );

  const { sprint, stats, issues } = data;
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', color: '#172b4d' }}>
      <h2>{sprint.name} — autopsy</h2>
      <p style={{ color: '#6b778c' }}>Board: {sprint.board} · Committed {stats.points.committed} pts · Delivered {stats.points.delivered} pts</p>
      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <Stat label="Committed pts" value={stats.points.committed} />
        <Stat label="Delivered pts" value={stats.points.delivered} tone="#00875a" />
        <Stat label="Spilled" value={stats.spilledCount + ' (' + stats.spilloverRate + '%)'} tone={stats.spilloverRate > 25 ? '#bf2600' : '#ff991f'} />
        <Stat label="Bugs" value={stats.bugCount} tone="#bf2600" />
        <Stat label="Ghosts" value={stats.ghosts.length || 0} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #dfe1e6' }}>
            <th style={{ padding: 8 }}>Key</th><th style={{ padding: 8 }}>Summary</th><th style={{ padding: 8 }}>Type</th><th style={{ padding: 8 }}>Status</th><th style={{ padding: 8 }}>Assignee</th><th style={{ padding: 8 }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {issues.map(i => (
            <tr key={i.key} style={{ borderBottom: '1px solid #ebecf0', background: i.resolved ? 'transparent' : '#fffbf0' }}>
              <td style={{ padding: 8, fontWeight: 700 }}>{i.key}</td>
              <td style={{ padding: 8 }}>{i.summary}</td>
              <td style={{ padding: 8 }}>{i.type}</td>
              <td style={{ padding: 8, color: i.resolved ? '#00875a' : '#ff991f' }}>{i.status}</td>
              <td style={{ padding: 8 }}>{i.assignee}</td>
              <td style={{ padding: 8 }}>{i.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

createRoot(document.getElementById('root')).render(<App />);
