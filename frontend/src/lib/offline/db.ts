import Dexie, { type Table } from 'dexie'

export interface OfflineMonitoring {
  id: string
  plot_id: string
  plot_name?: string
  project_name?: string
  date: string
  coordinates: [number, number] // [lng, lat]
  gps_accuracy_m: number
  healthy_count: number
  stressed_count: number
  dead_count: number
  missing_count: number
  survival_rate: number | null
  avg_height_cm: number | null
  avg_diameter_cm: number | null
  canopy_cover_pct: number | null
  notes: string | null
  observer_id: string
  observer_name?: string
  sync_status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'
  sync_error?: string | null
  photo_count: number
  created_at: string
}

export interface OfflinePhoto {
  id: string
  monitoring_id: string
  blob: Blob
  file_name: string
  file_type: string
  file_size_bytes: number
  caption?: string | null
  created_at: string
}

export interface CachedPlot {
  id: string
  project_id: string
  name: string
  rehabilitation_type: string
  area_m2: number
  geom?: any
  monitoring_status: string
  project_name?: string
  updated_at: string
}

export interface CachedProject {
  id: string
  name: string
  location_name: string
  province: string
  status: string
  updated_at: string
}

export interface CachedSpecies {
  id: string
  common_name: string
  scientific_name: string | null
  category: string
}

export interface SyncQueueItem {
  id: string
  entity_type: 'FIELD_MONITORING'
  entity_id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  retry_count: number
  last_error?: string | null
  created_at: string
  updated_at: string
}

export class RehabtrackDatabase extends Dexie {
  offlineMonitorings!: Table<OfflineMonitoring, string>
  offlinePhotos!: Table<OfflinePhoto, string>
  cachedPlots!: Table<CachedPlot, string>
  cachedProjects!: Table<CachedProject, string>
  cachedSpecies!: Table<CachedSpecies, string>
  syncQueue!: Table<SyncQueueItem, string>

  constructor() {
    super('rehabtrack_offline_db')
    this.version(1).stores({
      offlineMonitorings: 'id, plot_id, date, sync_status, created_at',
      offlinePhotos: 'id, monitoring_id, created_at',
      cachedPlots: 'id, project_id, name',
      cachedProjects: 'id, name',
      cachedSpecies: 'id, common_name',
      syncQueue: 'id, entity_type, entity_id, status, retry_count, created_at',
    })
  }
}

// Singleton instance for client-side use
export const db = new RehabtrackDatabase()
