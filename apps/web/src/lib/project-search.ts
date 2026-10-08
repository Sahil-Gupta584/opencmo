export interface ProjectSearch {
  projectId?: string
}

/**
 * Shared search validator for the dashboard routes.
 *
 * The active project lives in the URL (`/dashboard/inbounds?projectId=<id>`) so
 * that switching projects is reactive and the selection survives reloads and
 * shared links. A missing/non-string value yields `undefined`, which callers
 * treat as "use the user's first project".
 */
export function validateProjectSearch(search: Record<string, unknown>): ProjectSearch {
  const projectId = search.projectId
  return {
    projectId: typeof projectId === 'string' && projectId.length > 0 ? projectId : undefined,
  }
}