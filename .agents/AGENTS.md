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
