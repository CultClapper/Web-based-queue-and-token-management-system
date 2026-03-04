# Performance Analysis — ServSync

**Date:** 2026-03-03

## Summary

This document guides how to measure, record, and improve performance for the ServSync project (frontend + backend). It contains reproducible profiling commands, places to record observed metrics, prioritized recommendations, and next steps to reduce latency, CPU, memory and bundle size.

## Scope

- Backend: `backend/` (Node.js server)
- Frontend: `frontend/` (Vite + React)

## Environment

- OS: Windows (developer environment)
- Node.js: (record your version here)
- Browser: Chrome/Edge (for frontend profiling)

## Tools & Resources

- Node profiling: `clinic` (flame/doctor), `0x`, `node --inspect`/DevTools
- Frontend profiling: Chrome DevTools Performance, Lighthouse, `source-map-explorer` or `webpack-bundle-analyzer` (or equivalent for Vite)
- Load testing: `wrk`, `autocannon`, `k6`
- Monitoring: Prometheus/Grafana, NewRelic, Sentry

## How to reproduce — Backend

1. Install dev tools (one-time):

```bash
cd backend
npm install --save-dev clinic  # or install globally
```

2. Start app under Clinic (example):

```bash
cd backend
npx clinic flame -- node server.js
# exercise the app (run requests) then stop the run to generate report
```

3. Or run Node inspector for flame/profile capture:

```bash
cd backend
node --inspect-brk server.js
# open chrome://inspect and record CPU profile in DevTools
```

4. Run targeted load tests (example using `autocannon`):

```bash
npx autocannon -c 50 -d 30 http://localhost:3000/api/schedules
```

Record: requests/sec, p50/p90/p99 latencies, CPU, RSS memory.

## How to reproduce — Frontend

1. Start dev server and open site in Chrome:

```bash
cd frontend
npm install
npm run dev
```

2. Use Chrome DevTools → Performance to record page load and interaction traces. Capture:
- First Contentful Paint (FCP), Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Main-thread blocking time, scripting time

3. Run Lighthouse audit (in DevTools or CLI):

```bash
npm install -g lighthouse
npx lighthouse http://localhost:5173 --view
```

4. Analyze bundle sizes (after production build):

```bash
cd frontend
npm run build
npx source-map-explorer dist/assets/*.js
```

Record: total bundle size, largest modules, unused code.

## What to measure (Suggested metrics)

- Backend: throughput (RPS), latency percentiles (p50/p90/p99), CPU %, memory RSS/heap, GC pause times, DB query durations, error rates
- Frontend: bundle size, TTFB, FCP, LCP, TTI, main-thread blocking, long tasks
- Infrastructure: container CPU/memory, DB CPU/IO, network latency

## Findings Template (fill per test)

- Test name: 
- Date/time:
- Environment (dev/prod/staging):
- Command(s) used:
- Observed throughput / latency:
- CPU / memory (host and process):
- Hotspots (backend stack traces or flamegraph):
- Frontend heavy modules / components:
- Notes / immediate next action:

## Common Bottlenecks & Quick Fixes

- Slow DB queries: add indexing, optimize queries, add query caching (Redis)
- High CPU on Node: avoid synchronous/blocking code, move heavy CPU work to background jobs or workers
- Memory leaks: inspect heap snapshots (`node --inspect`), fix retained closures or caches
- Large frontend bundles: enable route-based code-splitting, remove/replace heavy dependencies, tree-shake
- Expensive React renders: memoize components, use `React.memo`, use proper keys, avoid expensive calculations in render

## Prioritized Action Plan

1. Identify and fix slow DB queries used on critical endpoints. (High impact)
2. Introduce request-level tracing / APM on backend (e.g., OpenTelemetry/NewRelic). (Visibility)
3. Production build + bundle analysis; split large bundles and lazy-load. (Frontend perf)
4. Add basic Grafana dashboards for CPU/memory/latency. (Monitoring)
5. Add automated Lighthouse checks in CI (Lighthouse CI). (Prevention)

## Monitoring & Alerts

- Track: p95 response time, error rate, CPU% > 80%, memory growth trend
- Suggested alerts: sustained p95 > 500ms, error rate > 1% (or baseline + delta), memory leak pattern (monotonic rise)

## Relevant source files to inspect

- Backend entry: [backend/server.js](backend/server.js)
- Backend routes: [backend/src/routes/schedules.js](backend/src/routes/schedules.js)
- Frontend entry: [frontend/src/main.jsx](frontend/src/main.jsx)
- Frontend top-level UI: [frontend/src/App.jsx](frontend/src/App.jsx)

## Appendix — Commands reference

- Run backend locally:

```bash
cd backend
npm install
npm start
```

- Run frontend locally:

```bash
cd frontend
npm install
npm run dev
```

- Run production frontend build and analyze:

```bash
cd frontend
npm run build
npx source-map-explorer dist/assets/*.js
```

## Notes & Next Steps

- Use the Findings Template above to record each profiling session. Attach flamegraphs/screenshots to this file (or store in a `performance/` folder) for historical comparison.
- If you want, I can run an initial profiling pass (backend flamegraph + Lighthouse) and populate this document with concrete findings. Reply with permission to run profiling commands locally or share logs.
