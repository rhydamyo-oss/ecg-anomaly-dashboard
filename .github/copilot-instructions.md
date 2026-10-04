<!-- Auto-created by assistant: concise, actionable guidance for AI coding agents -->
# Copilot / AI Agent Instructions — ECG Anomaly Dashboard

Purpose
- Help AI agents become productive quickly in this repo: an ultra-lightweight static dashboard that simulates ECG signals, highlights anomalies, and optionally posts data to a backend.

Big picture
- This is a frontend-first static site. The visible app loads `index.html` which expects a built ES module at `src/main.js`.
- Core responsibilities:
  - `src/file2.ts` — `ECGEngine` simulation (signal generator, anomaly injection).
  - `src/file3.js` — `ApiService` that posts JSON to `http://localhost:8000/api/v1/predict-ecg` (optional backend integration).
  - `src/file4.ts` — UI glue: chart rendering, stream control, thresholding, table updates.

Entry points & workflow
- Runtime entry: open `index.html` in a browser. It loads `src/main.js` as an ES module.
- Source is in TypeScript (`.ts`) but the shipped entry is `src/main.js` — there is no checked-in build artifact here. Agents should either:
  - Rebuild a `src/main.js` bundle from the TS sources (recommended for testing changes), or
  - Edit JS files directly (quick prototyping), but keep module/filename imports consistent.

Suggested local dev commands (discoverable but not enforced):
- Quick static server (serves built/checked-in files):
  - `python -m http.server 8000` (from repo root) — then open `http://localhost:8000`.
- Build a single-module `src/main.js` from TS sources (example using `esbuild`):
  - `npx esbuild src/file4.ts --bundle --outfile=src/main.js --format=esm --sourcemap` (adjust entry if `main` is different).
  - Or compile with `tsc` if a `tsconfig.json` is added.

Key patterns & conventions
- Minimal dependencies: UI uses CDN-served Tailwind, Chart.js, and Lucide icons; avoid adding heavy framework code.
- Signals: `ECGEngine.generateSample()` returns `{ time, observed, reconstructed, error }`. UI logic treats `error` as the reconstruction MSE and compares to a UI-controlled `threshold` (slider in `index.html`).
- Anomaly injection: call `engine.triggerAnomaly()` to simulate a transient anomaly window; this is used by the "Trigger Anomaly" button.
- Data flow: engine → buffer → Chart.js datasets; when `error > threshold` the UI sets `ANOMALY DETECTED` and highlights the overlay dataset.

Integration points
- Backend: `src/file3.js` exports `ApiService.BACKEND_URL`. POST body shape:
  { patient_id, lead, raw_signals }
- Agents changing API calls must preserve this JSON shape and gracefully fallback when the backend is unreachable (current code returns `null` on fetch failure).

Files to check when making changes
- UI & interactions: [src/file4.ts](../src/file4.ts)
- Signal simulation: [src/file2.ts](../src/file2.ts)
- Backend client: [src/file3.js](../src/file3.js)
- Page shell: [index.html](../index.html)

Testing & debugging tips
- Use the browser DevTools console to monitor `mseDisplay`, `statusBadge`, and to call `engine.triggerAnomaly()` manually.
- If the page shows nothing, ensure `src/main.js` exists and is a valid ES module (check the console for import/404 errors).

What not to assume
- There is no server-side code in this repo. The backend URL in `ApiService` is an integration hint only — it may not be running locally.
- No test harness or CI config found; do not search for unit tests unless added later.

If you modify imports or filenames
- Keep `index.html`'s `type="module"` expectation in mind. Either update `index.html` to point to your built file or output a `src/main.js` that re-exports your new entry.

If you want me to iterate
- Tell me whether you prefer: (A) add a simple `package.json` + `esbuild` dev script, or (B) keep repo minimal and edit JS directly. I can implement either.
