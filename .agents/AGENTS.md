# Project Rules: Zero-Cost Job Hunt Agent

## Database & Authentication Ownership

- **Database Entity Ownership:** All job application data, scores, and AI reasoning are exclusively owned and managed by **Supabase Postgres**. Google Sheets and MongoDB are strictly NOT used.
- **Authentication Pattern:** The Next.js dashboard relies solely on **Supabase Auth** (Email/Password). Do not use NextAuth, Clerk, or custom JWTs.
- **RLS & Security:** The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the frontend. All frontend operations must respect Supabase Row Level Security (RLS) policies.

## Shared Types Package (@job-hunt/types)

- **Compilation Requirement:** Whenever you modify the shared types package (e.g., `packages/types/index.ts`), you MUST run the TypeScript compiler (`pnpm run typecheck`) to verify.

## Monorepo Governance

- **Package Manager:** The project strictly uses `pnpm`. Do NOT use `npm install` or `yarn`.
- **Unified Configurations:** All new apps and packages MUST extend `@job-hunt/eslint-config` and `@job-hunt/typescript-config` instead of defining custom linting/compilation rules locally.

## Dashboard Frontend Architecture

- **Feature-Based Architecture:** The project uses a feature-based architecture (e.g., `apps/dashboard/src/features/jobs/`). Data logic (services) and components should be grouped by feature rather than split into top-level `src/services/` and `src/components/` directories.
- **Data Layer Isolation:** Never write database queries (Supabase) or external API calls directly inside Next.js components or `app/actions.ts`. All data access logic MUST be placed in dedicated service files within their respective feature directories (e.g., `apps/dashboard/src/features/jobs/services/`).
- **Component Modularization:** Avoid large "fat components". Break UI elements down into modular, reusable components inside their respective feature directories (e.g., `apps/dashboard/src/features/jobs/components/`). The main router files should primarily serve as state managers and layout composers.
- **Rendering & Performance:** Strictly adhere to Next.js best practices for Server and Client Components. Dynamically import (`next/dynamic` with `ssr: false`) heavy client-only listeners or components to minimize the initial server payload. Use `Promise.all` for concurrent data fetching on the server.
- **Styling Constraints:** The project strictly uses pure Vanilla CSS and CSS Modules. Do NOT install or use Tailwind CSS. Rely on the existing globals and design tokens for UI consistency.

## Git & Version Control

- **No Hook Bypassing:** STRICTLY PROHIBITED to use `--no-verify` when committing or pushing. If a pre-commit hook (like husky or lint-staged) fails, you MUST fix the underlying linting or formatting issue before attempting to commit again.
- **Lint & Type Safety First:** Before committing or pushing to GitHub, you MUST properly fix all type check and lint errors (e.g., using proper interfaces or explicitly typed objects instead of `any`, `// eslint-disable-next-line` where strictly necessary, and renaming unused variables with an underscore `_name`). Do not just ignore them.

## AI Model & Quota Management

- **Primary vs Fallback:** The `tailor-resume` API strictly uses `gemini-2.5-flash` as the primary model. However, because `gemini-2.5-flash` has a highly restricted free-tier quota (20 Requests Per Day), you MUST always maintain a fallback block in the `catch` statement.
- **Valid Fallback Model:** The designated fallback model is `gemma-4-31b-it`. This is a valid, active model in Google AI Studio with a significantly higher daily quota limit (1,500 RPD). Do NOT remove `gemma-4-31b-it` under the assumption that it is a hallucinated or invalid model name.
