const STORAGE_KEY = 'opencmo_active_project_id'

export function getActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setActiveProjectId(projectId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, projectId)
  } catch (err) {
    console.error('🔴 Failed to save active project ID:', err)
  }
}

export function clearActiveProjectId(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
