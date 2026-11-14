# 🧟 Sprint Autopsy — AI retro-report generator for Jira

A Forge app + Rovo agent that analyzes completed Jira sprints and writes a brutally
honest but fair retrospective: velocity trend, spillover patterns, bug hotspots,
ghost tickets, estimate accuracy, and three concrete process fixes.

**Codegeist 2026 entry** — Apps for Software Teams + Best Agents (Rovo) + Best MCP bonus.

## Structure
- `manifest.yml` — Forge modules (jira:projectPage, rovo:agent, functions)
- `src/resolver/index.js` — Jira Agile REST: sprint issues, computed autopsy stats
- `src/frontend/index.jsx` — UI Kit React dashboard

## Deploy
```bash
forge login
forge deploy
forge install
```
