# Project Rules: Zero-Cost Job Hunt Agent

## Database & Authentication Ownership
- **Database Entity Ownership:** All job application data, scores, and AI reasoning are exclusively owned and managed by **Supabase Postgres**. Google Sheets and MongoDB are strictly NOT used.
- **Authentication Pattern:** The Next.js dashboard relies solely on **Supabase Auth** (Email/Password). Do not use NextAuth, Clerk, or custom JWTs.
- **RLS & Security:** The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the frontend. All frontend operations must respect Supabase Row Level Security (RLS) policies.

## Shared Types Package (@job-hunt/types)
- **Compilation Requirement:** Whenever you modify the shared types package (e.g., `packages/types/index.ts`), you MUST run the TypeScript compiler (`npx tsc`) inside the `packages/types` directory to regenerate `index.js`. Failing to do so will cause runtime validation errors (e.g., Zod schema sync failures) because the compiled JavaScript will be out of sync with the TypeScript definitions.
