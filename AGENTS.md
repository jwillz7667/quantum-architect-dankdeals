# Repository Guidelines

DankDeals pairs a Vite-powered React frontend with Supabase services. Use this guide to align contributions and keep deployments smooth.

## Project Structure & Module Organization

The customer app lives in `src`, with `components/` for composable UI, `pages/` for route-level screens, and `context/`, `hooks/`, `services/`, `lib/` providing shared state, data access, and utilities (imported via the `@` alias). API integrations and server middleware reside in `server/` and `api/`. Supabase schemas and seeds sit in `supabase/migrations/`. Public assets belong in `public/`, while automation and CI helpers are under `scripts/` and `docs/`. E2E specs live in `tests/e2e/`; Vitest unit scaffolding stays in `src/__tests__/`.

## Build, Test, and Development Commands

- `npm run dev` starts the Vite dev server with hot reload and Supabase env vars from `.env.local`.
- `npm run build` generates the sitemap then produces the production bundle in `dist/`.
- `npm run lint` runs the monorepo ESLint config; fix issues or document intentional exceptions.
- `npm run type-check` runs `tsc --noEmit` to guard TypeScript contracts.
- `npm run test:unit` / `npm run test:integration` execute Vitest suites; prefer `:integration` for flows crossing hooks, services, and routers.
- `npm run test:e2e` launches Playwright specs in `tests/e2e`; add `--project=chromium` during local smoke runs.

## Coding Style & Naming Conventions

Prettier governs formatting (`tabWidth: 2`, `singleQuote: true`, `printWidth: 100`) and should be run via `npm run format`. Use Tailwind utility ordering as produced by `prettier-plugin-tailwindcss`. Keep React components and TypeScript types in PascalCase, hooks prefixed with `use`, and files co-located with their feature. Favor functional components, React Query for data fetching, and `@/lib` helpers for shared logic. Keep environment-specific values in `.env.local` and document new keys in `README.md`.

## Testing Guidelines

Write unit files as `*.test.ts(x)` alongside the code, and integration specs as `*.integration.test.ts(x)` spanning multiple modules. Leverage Testing Library queries (`screen.findBy...`) to keep tests resilient. Vitest collects coverage via the V8 reporter—ensure new code does not reduce coverage in the text summary. For critical customer journeys, add Playwright specs under `tests/e2e` and flag smoke cases with `@smoke`. When touching Supabase logic, include SQL fixtures or mocks in `src/test/`.

## Commit & Pull Request Guidelines

Use concise, imperative subjects (`fix: handle OAuth refresh`, `chore: update sitemap assets`) consistent with recent history. Group related changes per commit, and mention migrations or schema updates explicitly. Pull requests need a clear summary, a testing checklist (commands run, browsers checked), links to Supabase dashboards or issues, and screenshots/gifs for UI changes. Note any feature flags or environment toggles so reviewers can reproduce the change confidently.
