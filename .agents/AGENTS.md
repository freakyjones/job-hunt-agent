# Project Rules: Zero-Cost Job Hunt Agent

## Database & Authentication Ownership

- **Database Entity Ownership:** All job application data, scores, and AI reasoning are exclusively owned and managed by **Supabase Postgres**. Google Sheets and MongoDB are strictly NOT used.
- **Authentication Pattern:** The Next.js dashboard relies solely on **Supabase Auth** (Email/Password). Do not use NextAuth, Clerk, or custom JWTs.
- **RLS & Security:** The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the frontend. All frontend operations must respect Supabase Row Level Security (RLS) policies.
- **Middleware Cookie Preservation:** When modifying or returning a custom `NextResponse` (such as a `NextResponse.redirect` or `NextResponse.json` for 401 API errors) inside Next.js middleware, you must copy over all cookies set on the initial `supabaseResponse` (e.g., using `supabaseResponse.cookies.getAll().forEach(...)`). Otherwise, refreshed auth session cookies will be discarded.

## Shared Types Package (@job-hunt/types)

- **Compilation Requirement:** Whenever you modify the shared types package (e.g., `packages/types/index.ts`), you MUST run the TypeScript compiler (`pnpm run typecheck`) to verify.

## Monorepo Governance

- **Package Manager:** The project strictly uses `pnpm`. Do NOT use `npm install` or `yarn`.
- **Unified Configurations:** All new apps and packages MUST extend `@job-hunt/eslint-config` and `@job-hunt/typescript-config` instead of defining custom linting/compilation rules locally.

## Dashboard Frontend Architecture

- **Feature-Based Architecture:** The project uses a feature-based architecture (e.g., `apps/dashboard/src/features/jobs/`). Data logic (services) and components should be grouped by feature rather than split into top-level `src/services/` and `src/components/` directories.
- **Data Layer Isolation:** Never write database queries (Supabase) or external API calls directly inside Next.js components or `app/actions.ts`. All data access logic MUST be placed in dedicated service files within their respective feature directories (e.g., `apps/dashboard/src/features/jobs/services/`).
- **Component Modularization:** Avoid large "fat components". Break UI elements down into modular, reusable, and **highly decoupled** components inside their respective feature directories (e.g., `apps/dashboard/src/features/jobs/components/`). The main router files should primarily serve as state managers and layout composers. **All components MUST be built for scalability and isolation.**
- **Rendering & Performance:** Strictly adhere to Next.js best practices for Server and Client Components. Dynamically import (`next/dynamic` with `ssr: false`) heavy client-only listeners or components to minimize the initial server payload. Use `Promise.all` for concurrent data fetching on the server.
- **Styling Constraints:** The project strictly uses pure Vanilla CSS and CSS Modules. Do NOT install or use Tailwind CSS. Rely on the existing globals and design tokens for UI consistency. **MUST NOT use inline CSS (e.g., `style={{...}}`) under any circumstances; always use external CSS Modules or global classes.**
- **Font Optimization:** Always use Next.js's optimized `next/font` loader inside `layout.tsx` to pre-load fonts and expose them as CSS variables. DO NOT load fonts via CSS `@import` statements (e.g., `@import 'geist/font/...'`), as they block rendering and trigger sequential chained requests, degrading Largest Contentful Paint (LCP) scores.

## Git & Version Control

- **No Hook Bypassing:** STRICTLY PROHIBITED to use `--no-verify` when committing or pushing. If a pre-commit hook (like husky or lint-staged) fails, you MUST fix the underlying linting or formatting issue before attempting to commit again.
- **Lint & Type Safety First:** Before committing or pushing to GitHub, you MUST properly fix all type check and lint errors (e.g., using proper interfaces or explicitly typed objects instead of `any`, and renaming unused variables with an underscore `_name`).
- **CRITICAL LINTING INVARIANT**: NEVER use `// eslint-disable-next-line` to bypass or silence architectural linting rules, especially React Hook lifecycle warnings (e.g., `set-state-in-effect`, `exhaustive-deps`). You MUST refactor the code to solve the underlying state or lifecycle flaw (e.g., using derived state during render instead of cascading effects). Do not just ignore or silence errors.

## AI Model & Quota Management

- **Primary vs Fallback:** The `tailor-resume` API strictly uses `gemini-2.5-flash` as the primary model. However, because `gemini-2.5-flash` has a highly restricted free-tier quota (20 Requests Per Day), you MUST always maintain a fallback block in the `catch` statement.
- **Valid Fallback Model:** The designated fallback model is `gemma-4-31b-it`. This is a valid, active model in Google AI Studio with a significantly higher daily quota limit (1,500 RPD). Do NOT remove `gemma-4-31b-it` under the assumption that it is a hallucinated or invalid model name.
- **Robust JSON Parsing:** When consuming structured JSON from LLM responses, always use a robust parsing utility that handles common syntax quirks: (1) strip markdown block wrappers (e.g., ` ```json `), and (2) sanitize and escape raw newlines/carriage returns that are inside double-quoted string values before calling `JSON.parse()`.

## Architecture & Resilience Guidelines

- **Frontend Server Components (Next.js):** Never `throw` errors inside data-fetching services (e.g., Supabase queries). Always return a Result object (e.g., `{ data, error }`), wrap the query in an exponential backoff retry loop, and use React `<Suspense>` boundaries to gracefully degrade the UI on network failures.
- **Automated Browser Management:** All Playwright and Puppeteer workflows must strictly wrap browser/context instantiation in a `try...finally { await context.close(); }` block to prevent zombie processes and memory leaks on GitHub Actions runners.
- **Data Deduplication:** Strictly rely on Database-level constraints (e.g., `UNIQUE(url)`) paired with `upsert` queries for deduplication. Never manage deduplication state via in-memory hashing or arrays.
- **Scraping Strategy:** Always prioritize intercepting background network APIs (e.g., `page.on('response')` to catch JSON/GraphQL) before falling back to DOM parsing (CSS selectors).
- **Error Catching Safety:** Never log raw error objects (e.g., `console.error(e)`) in `catch` blocks, as they pollute CI/CD logs with massive stack traces (e.g., from Playwright or APIs). Always safely extract the message: `console.error(e instanceof Error ? e.message : e)`.

## Testing Guidelines

- **UI Component Testing (Next.js 15+):** When testing React Server Components or `useOptimistic` hooks in a `jsdom` environment with Vitest, you must natively mock `useOptimistic` to behave as standard `useState` dispatch to simulate state transitions correctly. Always mock browser APIs (e.g. `URL.createObjectURL`) when testing client-side blob downloads.
- **End-to-End Testing (Playwright):** Always run Playwright tests against a production build (`next build && next start`). Disable parallel execution (`workers: 1`) to guarantee deterministic database state using the local Supabase emulator.
- **E2E Testing Invariants (Next.js & Supabase):** (1) For Next.js streaming (Suspense) pages, use explicit visibility checks with extended timeouts (`toBeVisible({ timeout: 15000 })`) instead of `networkidle` (which hangs due to Realtime WebSockets/telemetry). (2) Set custom E2E ports via `process.env.PORT = '3001'` in Playwright config to avoid CLI argument parsing bugs in OS shells. (3) Ensure E2E database seeds match valid schema tables (e.g., `base_resumes` vs `resumes`) and provide all non-nullable columns lacking database-level defaults (e.g. `id`).
- **Git Hooks:** Fast incremental testing must be maintained via `vitest related --run` inside the `lint-staged` hook to validate only changed files without slowing down commits.
- **Playwright Alert Selectors:** Next.js automatically injects a hidden announcer element `<div role="alert" id="__next-route-announcer__">` into the DOM. When writing Playwright tests that look for user-facing alert elements (`role="alert"`), always filter the locator using specific text (e.g., `.filter({ hasText: '...' })`) or class names to prevent strict-mode multiple element matches.
- **E2E Environment Fallbacks:** Ensure that `playwright.config.ts` has safe local emulator fallbacks (`http://127.0.0.1:54321` URL, static anon/service role keys) to prevent tests from accidentally hitting production or failing in CI due to missing environment variables.

## Security & Vulnerability Analysis

- **XSS False Positives:** Next.js and React natively escape standard string interpolations (e.g. `{job.description}`). Do NOT flag missing sanitization as an XSS vulnerability unless the code explicitly utilizes `dangerouslySetInnerHTML`.
- **Credential Leaks:** If you spot sensitive files (e.g., `google-credentials.json`) on disk, do NOT immediately flag a P0 source control leak. You MUST verify if the file is actively tracked by git (via `git ls-files`) or if it is safely ignored in `.gitignore` first.

## Agent Telemetry & Observability

- **No Error Masking:** When writing or modifying Playwright automation scripts (like auto-appliers) or AI evaluators, NEVER mask failures (e.g. `return success || true`). Autonomous agents rely entirely on accurate telemetry; masking failures poisons the data pipeline.

## GitHub Actions Integration

- **Workflow Dispatch Inputs:** Whenever a Next.js Server Action or frontend client manually triggers a GitHub Action workflow via the GitHub REST API (e.g., sending a payload with `command`, `user_id`), you MUST ensure that the target `.github/workflows/*.yml` file explicitly defines every parameter in the `inputs` section under the `workflow_dispatch` trigger. Unmapped inputs will cause a 422 API error.
- **Node Version Consistency:** When creating or modifying GitHub Action workflows (`.github/workflows/`), always ensure the `actions/setup-node` version exactly matches the stable Node version used across the rest of the monorepo (e.g., Node 22). Do not rely on default boilerplate versions.

## Exams & Background Jobs

- **Exam Status Lifecycle (CRITICAL):** When a background worker or Edge Function generates a new exam, the `exams.status` MUST remain `'PENDING'`. Never automatically mark an exam as `'COMPLETED'` upon creation. Doing so breaks the Next.js frontend flow and prematurely reveals the correct answers in the UI. Only user-driven frontend actions (e.g., `submitExamAction`) may transition an exam to `'COMPLETED'`.
- **LLM Output Validation:** When parsing structured JSON outputs from AI models (e.g., exam questions) inside background jobs, you must validate that the array is non-empty before performing database inserts. If the array is empty or invalid, throw an error to fail the job rather than letting it complete silently.

## TypeScript Strictness (No Explicit Any)

Never use `any` or implicitly untyped empty arrays (e.g., `const items = []`). Always explicitly define the type (e.g., `const items: string[] = []`) or create interfaces to prevent `@typescript-eslint/no-explicit-any` and `TS7034` CI failures.

## Cognitive Complexity Limit (SonarCloud)

Keep function cognitive complexity strictly below 15 (SonarCloud standard). If a function or Next.js action grows beyond this limit, you must extract chunks of logic into smaller, well-named helper functions or dedicated feature services (e.g., `features/<name>/services/`).

## Secure Randomness

Always use `crypto.getRandomValues()` (Web Crypto API or `node:crypto`) instead of `Math.random()` when generating random values, tokens, or handling any form of "industry-grade" randomness.

## Top-Level Await (ESM)

When writing or modifying ES Modules (e.g., `.mjs` files), utilize native top-level `await` instead of wrapping logic in async IIFEs (`async function run() { ... } run();`).

## Database Migration & Namespace Integrity

- **Prevent Naming Collisions:** Always verify if an ENUM type, table, or relation name already exists across historical migration files before defining it in a new migration. This prevents `relation already exists` duplicate SQL errors during `supabase db reset` or `push`.
- **Descriptive ENUM Naming:** Never use overly generic names for Postgres ENUM types (e.g., `job_status` or `status`). Always prefix them with their specific table or feature context (e.g., `exam_generation_job_status`) to prevent global namespace collisions.

## Strict Linting & Type Invariants

To ensure the CI pipeline (`pnpm run lint` and `pnpm run typecheck`) passes without immediate failure, you must adhere to these strict invariants:

- **No `require()` Imports**: Never use `require()` (e.g., `require('node:child_process')`). Always use dynamic `await import()` in Edge/Node environments.
- **Console Methods**: `console.log` is strictly forbidden by the `no-console` rule. You may only use `console.info`, `console.warn`, or `console.error`.
- **Catch Block Variables**: If you do not use the error variable in a `catch` block, it must be prefixed with an underscore (e.g., `catch (_e)`) to satisfy the `@typescript-eslint/no-unused-vars` regex `/^_/u`.
- **Type Guarding `unknown`**: When using `instanceof` on an error object (like `result.error instanceof Error`), you must cast it to `unknown` first if it comes from an untyped or loose source (e.g., `(result.error as unknown) instanceof Error`) to prevent `TS2358`.
- **JSX Escaping**: Always escape apostrophes and quotes in React JSX (e.g., use `&apos;` instead of `'`).
