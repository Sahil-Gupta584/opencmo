Agent Instructions

When confused - ASK, don't guess

- If anything is ambiguous, contradictory, or you're not confident about the right approach - STOP and ask the user instead of implementing a random solution.
- Never fall into a rabbit hole. If a task turns out to be larger, riskier, or more uncertain than expected, surface it and ask before proceeding.
- Do not invent requirements, schemas, or behavior that the user hasn't specified. Confirm assumptions first.

Verification discipline

- Do NOT run typecheck, lint, or build commands unnecessarily.
- Only run typecheck/build/lint when a change is substantial (cross-file refactors, new packages, schema changes, dependency changes, or when a specific error is being investigated).
- For small, isolated edits (single file, low-risk changes), skip full verification and just report the change. Dev servers (HMR) will surface errors automatically.
- When verification IS needed, prefer the narrowest check for the scope of the change (e.g. check-types on one workspace, not a full root build).
- Typecheck only the modified files, never the whole project: use the per-workspace tsconfig.target.json pattern (extends the workspace tsconfig, include only the touched files + the relevant generated file). Example (apps/web):
  npx tsc --noEmit -p tsconfig.target.json
  tsconfig.target.json is reusable - edit its include to point at whatever files changed. The root tsconfig.target.json must not be committed/used for full checks.
- Don't add a check-types script to package.json that typechecks the whole app - keep it file-scoped via the target config.

Environment

- Monorepo (npm workspaces): apps/api (Express, sole API server on port 5001), apps/web (TanStack Start, port 3000), packages/* shared.
- Root .env is the single env source; both apps load it via dotenv -e ../../.env. Never read env directly in app code - import from #/env (web) or use process.env in apps/api.
- Web is the "web" workspace; npm run dev at root runs both web + api.

Web app ("web") - stack & conventions

Full-stack web app built with TanStack Start (React SSR, React 19), TypeScript throughout, npm.

- Framework: TanStack Start (Vite + React 19); Router is TanStack Router, file-based at apps/web/src/routes/. Never edit src/routeTree.gen.ts manually - run npm run generate-routes after adding/renaming routes.
- Server API: oRPC with Zod validation (/api/rpc/* for RPC, /api/* for OpenAPI), served by apps/api (Express) on port 5001.
- Database: Prisma 7 with @prisma/adapter-pg against PostgreSQL. Client at apps/web/src/generated/prisma.
- Auth: better-auth (magic link + Google OAuth). Client instance: #/lib/auth-client; server instance: #/lib/auth.
- Payments: Dodo Payments (hosted checkout redirect + webhook signature verification).
- UI & Styling: HeroUI (@heroui/react) + Tailwind CSS v4. Icons: react-icons/ri.
- Forms: react-hook-form + @hookform/resolvers/zod.

Import aliases (web)

Both #/* and @/* resolve to ./src/*. Prefer #/ for all internal imports:
  import { prisma } from '#/db'
  import { env } from '#/env'

Key conventions

1. Routing structure: Never create single dot-nested route files (e.g. settings.dashboard.tsx). Use flat directory-based nested routes under folders instead (e.g. src/routes/_protected/settings.tsx).
2. Auth in protected routes: Under _protected pages, do NOT call authClient.useSession() or getSession(). The user object is already provided by _protected.tsx - access it via const { user } = Route.useRouteContext().
3. Forms: Any feature with more than 2 input fields must use react-hook-form with a Zod schema resolver (@hookform/resolvers/zod). Place the Zod schema at the top of the file and infer types via z.infer<typeof schema>.
4. Env variables: Import env from #/env - never use process.env directly in web code.
5. UI Components: Check apps/web/src/components/ first for wrappers (Input, Select, Textarea). If a wrapper exists for a component, always import it from #/components/* - never import that component directly from @heroui/react. Only import directly from @heroui/react when no wrapper exists (e.g. Button, Card, Chip, Spinner). All form-control wrappers default labelPlacement to "outside" so labels render above the field.
6. Route file modularization: Keep route files focused and concise; don't crowd a single file with multiple inline sub-components. If a route file exceeds ~500 lines, convert it to a folder (e.g. dashboard.tsx → dashboard/index.tsx) and extract sub-components/utilities into a local subfolder (e.g. dashboard/-components/button.tsx).
7. Error handling & Promise safety: Always wrap async promises, external API calls, and JSON parsing in try/catch. Log errors with detailed diagnostic context (e.g. console.error('🔴 Operation failed:', err, 'Context:', contextData)). Never swallow errors silently.
8. Types - prefer Prisma types, never invent your own: @repo/database re-exports the Prisma-generated model types and enums from packages/database/src/index.ts (Project, ProjectSubreddit, RedditThread, ContentDraft, etc.). Whenever you touch or need a type for a DB-backed entity, use the Prisma type from @repo/database (e.g. import { Project, ProjectSubreddit } from '@repo/database') instead of hand-writing a duplicate interface. Do NOT create custom types for data that already has a Prisma model. If a Prisma type is missing/unsuitable, that's a signal to update the schema - don't work around it with a local type.
9. DB access lives behind oRPC routes - never import prisma in a client file: The prisma client must ONLY be imported in server-side code (apps/api, backend oRPC handlers, server-only route files). Never import prisma in .tsx components, client-only hooks, or client utilities. All data mutations/queries from the browser go through oRPC routes (@/lib/orpc, /api/rpc/*) served by apps/api - don't add new direct prisma calls in web. Use @repo/database (packages/database) for server-side prisma; don't duplicate the client or read DATABASE_URL ad hoc.

Commands (web)

- npm run dev - development server (port 3000)
- npm run generate-routes - regenerate TanStack Router route tree
- npm run db:generate - regenerate Prisma client
- npm run db:migrate - create and apply a named migration (ONLY way to change DB schema)
- npm run build - production build
- npm run lint / npm run check - linter / typecheck

Database migration policy

- NEVER use db push for schema changes - it bypasses migration history and is forbidden.
- ALL schema changes MUST go through a named Prisma migration: npm run db:migrate -- --name <descriptive-change-name>.
- After every schema change: run npm run db:generate first, then the named migration command.
- Existing baseline migration at prisma/migrations/20260804000000_baseline must never be reset, deleted, or modified.
- Before any destructive operation (prisma migrate reset, db push --force-reset), STOP and get explicit user approval.
