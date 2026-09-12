import { db, type CachedPlot, type CachedProject, type CachedSpecies } from './db'

/**
 * Cache plots in IndexedDB for offline reference
 */
export async function cachePlots(plots: any[]): Promise<void> {
  if (typeof window === 'undefined' || !plots || plots.length === 0) return

  try {
    const cachedItems: CachedPlot[] = plots.map((p) => ({
      id: p.id,
      project_id: p.project_id,
      name: p.name,
      rehabilitation_type: p.rehabilitation_type,
      area_m2: p.area_m2,
      geom: p.geom,
      monitoring_status: p.monitoring_status,
      project_name: p.project?.name,
      updated_at: new Date().toISOString(),
    }))

    await db.cachedPlots.bulkPut(cachedItems)
  } catch (err) {
    console.warn('Failed to cache plots to IndexedDB:', err)
  }
}

/**
 * Cache projects in IndexedDB for offline reference
 */
export async function cacheProjects(projects: any[]): Promise<void> {
  if (typeof window === 'undefined' || !projects || projects.length === 0) return

  try {
    const cachedItems: CachedProject[] = projects.map((p) => ({
      id: p.id,
      name: p.name,
      location_name: p.location_name,
      province: p.province,
      status: p.status,
      updated_at: new Date().toISOString(),
    }))

    await db.cachedProjects.bulkPut(cachedItems)
  } catch (err) {
    console.warn('Failed to cache projects to IndexedDB:', err)
  }
}

/**
 * Cache species in IndexedDB for offline reference
 */
export async function cacheSpecies(species: any[]): Promise<void> {
  if (typeof window === 'undefined' || !species || species.length === 0) return

  try {
    const cachedItems: CachedSpecies[] = species.map((s) => ({
      id: s.id,
      common_name: s.common_name,
      scientific_name: s.scientific_name || null,
      category: s.category,
    }))

    await db.cachedSpecies.bulkPut(cachedItems)
  } catch (err) {
    console.warn('Failed to cache species to IndexedDB:', err)
  }
}

/**
 * Retrieve cached plots from IndexedDB
 */
export async function getCachedPlots(projectId?: string): Promise<CachedPlot[]> {
  if (typeof window === 'undefined') return []

  try {
    if (projectId) {
      return await db.cachedPlots.where('project_id').equals(projectId).toArray()
    }
    return await db.cachedPlots.toArray()
  } catch (err) {
    console.warn('Failed to read cached plots:', err)
    return []
  }
}

/**
 * Retrieve single cached plot by ID
 */
export async function getCachedPlot(plotId: string): Promise<CachedPlot | null> {
  if (typeof window === 'undefined' || !plotId) return null

  try {
    const plot = await db.cachedPlots.get(plotId)
    return plot || null
  } catch (err) {
    console.warn(`Failed to read cached plot ${plotId}:`, err)
    return null
  }
}

/**
 * Retrieve cached projects from IndexedDB
 */
export async function getCachedProjects(): Promise<CachedProject[]> {
  if (typeof window === 'undefined') return []

  try {
    return await db.cachedProjects.toArray()
  } catch (err) {
    console.warn('Failed to read cached projects:', err)
    return []
  }
}
