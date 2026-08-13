OpenCMO Workspace Rules

Modular Code Structure & File Size Limits
- Keep files focused, concise, and under 500 lines. Do NOT allow any single file to exceed 500 lines. Modularize code into clean, single-responsibility files.
- Extract Sub-Components & Utilities: If a component or route file grows large or approaches ~300-400 lines, extract page-specific sub-components, helper utilities, or schemas into dedicated modular sub-files (e.g., src/components/, src/lib/, or src/orpc/).
- TanStack Router Modularization: Use directory-based nested routes (e.g. src/routes/_protected/dashboard.tsx as parent layout and src/routes/_protected/dashboard.index.tsx for index view). Never create single dot-nested route files (e.g. settings.dashboard.tsx or dashboard.settings.tsx).
- Route Tree Generation: Never edit src/routeTree.gen.ts manually. Run npm run generate-routes after adding, renaming, or deleting routes.

Auth in Protected Routes
- Under _protected pages, do NOT call authClient.useSession() or getSession(). The user object is already provided in the page context by _protected.tsx. Access it via const { user } = Route.useRouteContext().

Form Validation & Environment Variables
- Zod Form Validation: Any feature using more than 2 inputs must use react-hook-form with a proper Zod schema resolver (@hookform/resolvers/zod). Infer types using z.infer<typeof schema>.
- Environment Variables: Import env from #/env - never use process.env directly.
- Import Aliases: Prefer #/ for all internal imports (e.g. import { prisma } from '#/db').

Database Migrations Policy
- NEVER use prisma db push or npx prisma db push for schema changes.
- ALL schema changes MUST go through a named Prisma migration: npm run db:migrate -- --name <descriptive-change-name>.
- After modifying prisma/schema.prisma, ALWAYS run:
  1. npm run db:generate
  2. npm run db:migrate -- --name <descriptive-change-name>
- Do NOT bypass migration history.
