// Sprint Autopsy — resolver: fetch sprint data from Jira REST via @forge/api
import api, { route } from '@forge/api';

const clamp = (n, def) => (Number.isFinite(n) ? n : def);

export async function fetchSprintData(payload) {
  const projectKey = (payload && payload.projectKey) || 'SPD';
  try {
    // 1) find boards for the project
    const boardsRes = await api.asApp().requestJira(
      route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`,
      { headers: { Accept: 'application/json' } }
    );
    const boards = (await boardsRes.json()).values || [];
    if (!boards.length) return { ok: false, error: `No boards found for project ${projectKey}` };

    // 2) latest closed sprint from the first scrum board
    let sprint = null;
    for (const board of boards) {
      const sprintsRes = await api.asApp().requestJira(
        route`/rest/agile/1.0/board/${board.id}/sprint?state=closed&maxResults=1`,
        { headers: { Accept: 'application/json' } }
      );
      const sprints = (await sprintsRes.json()).values || [];
      if (sprints.length) { sprint = sprints[0]; sprint.boardName = board.name; break; }
    }
    if (!sprint) return { ok: false, error: 'No closed sprints found on this project' };

    // 3) issues in that sprint
    const issuesRes = await api.asApp().requestJira(
      route`/rest/agile/1.0/board/${sprint.originBoardId || boards[0].id}/sprint/${sprint.id}/issue?maxResults=100&fields=summary,status,assignee,issuetype,priority,created,resolutiondate,customfield_10016`,
      { headers: { Accept: 'application/json' } }
    );
    const issuesData = await issuesRes.json();
    const issues = (issuesData.issues || []).map(i => ({
      key: i.key,
      summary: i.fields.summary,
      type: i.fields.issuetype?.name || 'Task',
      status: i.fields.status?.name || '',
      assignee: i.fields.assignee?.displayName || 'Unassigned',
      points: clamp(i.fields.customfield_10016, 0),
      resolved: !!i.fields.resolutiondate,
    }));

    // 4) compute autopsy stats
    const done = issues.filter(i => i.resolved);
    const spilled = issues.filter(i => !i.resolved);
    const bugs = issues.filter(i => i.type.toLowerCase() === 'bug');
    const bugHotspots = {};
    bugs.forEach(b => { bugHotspots[b.assignee] = (bugHotspots[b.assignee] || 0) + 1; });
    const points = {
      committed: issues.reduce((s, i) => s + i.points, 0),
      delivered: done.reduce((s, i) => s + i.points, 0),
    };
    const ghosts = issues.filter(i => i.status === 'To Do' && !i.assignee);

    return {
      ok: true,
      sprint: { name: sprint.name, board: sprint.boardName, start: sprint.startDate, end: sprint.endDate },
      stats: {
        total: issues.length,
        doneCount: done.length,
        spilledCount: spilled.length,
        spilloverRate: issues.length ? Math.round((spilled.length / issues.length) * 100) : 0,
        bugCount: bugs.length,
        bugHotspots,
        points,
        ghosts: ghosts.map(g => g.key),
      },
      issues,
    };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}
