# Copilot / AI Agent Instructions — Constructive Designs Marketplace

This project is a Vite + React + TypeScript frontend with a small `server/` Express payment component and a SQL-first Supabase backend. Use this file as a quick on-ramp for coding agents.

- **Root README:** Read `README.md` at the repo root first — it documents architecture, DB setup, and deployment order.
- **Key files to open:** `package.json`, `server/package.json`, `src/main.tsx`, `src/App.tsx`, `public/terms.html`, `public/privacy.html`, and `**/*.sql` files at the project root (Supabase schema & functions).

- **Development commands (frontend):**
  - `npm install` — install dependencies
  - `npm run dev` — start Vite dev server (default 5173)
  - `npm run build` — build (runs `typecheck` first)
  - `npm run build:prod` — lint, typecheck, then build
  - `npm run preview` — preview production build

- **Payment server:** `cd server` then `npm run dev` (watch) or `npm start` to run Express for Stripe webhooks/endpoints.

- **Type checking & linting:** Run `npm run typecheck` and `npm run lint` before producing PRs. The build pipeline expects `tsc --noEmit -p tsconfig.app.json` to pass.

- **Production build nuance:** The `copy-legal` script copies `public/terms.html` and `public/privacy.html` into `dist/` after build — preserve those files and do not remove the script when modifying build steps.

- **Environment variables:** Frontend expects `VITE_` prefixed variables. Typical keys:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_NAME`, `VITE_APP_VERSION` (optional)
  - For AI features: `GEMINI_API_KEY` (see `CDI Gemini Image Editor` README)

- **Database-first approach:** Many features live in SQL files (schema, functions, RLS). To change behavior that affects data integrity, update the relevant `*.sql` file and coordinate with the DB admin to run them in Supabase SQL editor in the order described in `README.md`.

- **Realtime & auth:** The app uses Supabase Auth + realtime subscriptions — prefer adding serverless endpoints only when the action cannot be done from the frontend (e.g., signing webhooks, secure server-side operations).

- **AI & external services:** The code integrates with Google Gemini / GenAI packages (`@google/genai`, `@google-cloud/vertexai`) and `openai` in some places. Do NOT commit API keys; use environment variables and follow `README.md` for where keys are required.

- **Where to add new backend code:** Put lightweight HTTP handlers in `server/`. For DB migration or logic, prefer adding/updating `*.sql` files and share deployment instructions in the PR description.

- **Testing & CI:** There is no `test` script in `package.json` by default — check for `/.github/workflows` before adding CI changes. Run `npm run typecheck` and `npm run lint` locally as minimum verification.

- **PR guidance for AI agents:**
  - Keep changes small and focused.
  - Run typecheck & lint locally; include commands run in PR description.
  - If changing SQL, include an ordered list of SQL files to run and the expected effect on data.
  - If changing build scripts, ensure `copy-legal` step still runs or explain why it was changed.

- **Common pitfalls to avoid:**
  - Committing secrets or `VITE_` keys into source control.
  - Modifying DB behavior without updating SQL files or migration notes.
  - Removing `public/terms.html` or `public/privacy.html` (they are copied into production via `copy-legal`).

- **Quick file examples:**
  - Use `package.json` to learn available scripts and versioned dependencies.
  - Look at `server/index.js` (or `server/*.js`) for Stripe webhook and payment logic.
  - Search `supabase` and `sql` in the repo to find DB functions used by the frontend.

If you want a per-project Copilot file (for `home-reno-vision-pro` or `CDI Gemini Image Editor`) I can add those too. When in doubt: read the `README.md` for the specific project, then run `npm run typecheck` and `npm run dev`.

---
If anything here is unclear or you'd like me to add per-project instructions, tell me which project to target next.
