import { createClient } from '@/lib/supabase/client'
import {
  db,
  type OfflineMonitoring,
  type OfflinePhoto,
  type SyncQueueItem,
} from './db'
import { getCachedPlot } from './cache-manager'

export interface SaveOfflinePayload {
  plot_id: string
  date: string
  coordinates: [number, number] // [lng, lat]
  gps_accuracy_m?: number
  healthy_count: number
  stressed_count: number
  dead_count: number
  missing_count: number
  avg_height_cm?: number | null
  avg_diameter_cm?: number | null
  canopy_cover_pct?: number | null
  notes?: string | null
  photos?: {
    file: File
    caption?: string
    file_size_bytes?: number
  }[]
}

/**
 * Save field monitoring data and photo blobs to IndexedDB
 */
export async function saveMonitoringOffline(
  payload: SaveOfflinePayload,
  observer?: { id: string; name?: string }
): Promise<string> {
  const monitoringId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Calculate survival rate
  const h = payload.healthy_count || 0
  const s = payload.stressed_count || 0
  const d = payload.dead_count || 0
  const m = payload.missing_count || 0
  const totalObserved = h + s + d + m
  const survivalRate = totalObserved > 0 ? Math.round((h / totalObserved) * 100) : null

  // Fetch cached plot info if available for nicer offline display
  const cachedPlot = await getCachedPlot(payload.plot_id)

  const offlineMonitoring: OfflineMonitoring = {
    id: monitoringId,
    plot_id: payload.plot_id,
    plot_name: cachedPlot?.name || 'Plot Lahan',
    project_name: cachedPlot?.project_name,
    date: payload.date,
    coordinates: payload.coordinates,
    gps_accuracy_m: payload.gps_accuracy_m || 10.0,
    healthy_count: h,
    stressed_count: s,
    dead_count: d,
    missing_count: m,
    survival_rate: survivalRate,
    avg_height_cm: payload.avg_height_cm || null,
    avg_diameter_cm: payload.avg_diameter_cm || null,
    canopy_cover_pct: payload.canopy_cover_pct || null,
    notes: payload.notes || null,
    observer_id: observer?.id || 'offline_user',
    observer_name: observer?.name || 'Petugas Lapangan',
    sync_status: 'PENDING',
    photo_count: payload.photos?.length || 0,
    created_at: now,
  }

  // Save monitoring record
  await db.offlineMonitorings.put(offlineMonitoring)

  // Save photos as blobs
  if (payload.photos && payload.photos.length > 0) {
    const photoRecords: OfflinePhoto[] = payload.photos.map((p) => ({
      id: crypto.randomUUID(),
      monitoring_id: monitoringId,
      blob: p.file,
      file_name: p.file.name,
      file_type: p.file.type || 'image/jpeg',
      file_size_bytes: p.file_size_bytes || p.file.size,
      caption: p.caption || null,
      created_at: now,
    }))

    await db.offlinePhotos.bulkPut(photoRecords)
  }

  // Add to sync queue
  const queueItem: SyncQueueItem = {
    id: crypto.randomUUID(),
    entity_type: 'FIELD_MONITORING',
    entity_id: monitoringId,
    status: 'PENDING',
    retry_count: 0,
    created_at: now,
    updated_at: now,
  }
  await db.syncQueue.put(queueItem)

  return monitoringId
}

/**
 * Get count of monitorings awaiting sync
 */
export async function getOfflinePendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0
  try {
    return await db.offlineMonitorings
      .where('sync_status')
      .anyOf(['PENDING', 'FAILED'])
      .count()
  } catch (err) {
    console.warn('Failed to count offline monitorings:', err)
    return 0
  }
}

/**
 * Get all pending/failed offline monitorings
 */
export async function getPendingOfflineMonitorings(): Promise<OfflineMonitoring[]> {
  if (typeof window === 'undefined') return []
  try {
    return await db.offlineMonitorings
      .where('sync_status')
      .anyOf(['PENDING', 'FAILED', 'SYNCING'])
      .reverse()
      .sortBy('created_at')
  } catch (err) {
    console.warn('Failed to fetch offline monitorings:', err)
    return []
  }
}

/**
 * Delete an offline monitoring and its photos
 */
export async function deleteOfflineMonitoring(id: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await db.offlineMonitorings.delete(id)
    await db.offlinePhotos.where('monitoring_id').equals(id).delete()
    await db.syncQueue.where('entity_id').equals(id).delete()
  } catch (err) {
    console.error(`Failed to delete offline monitoring ${id}:`, err)
  }
}

/**
 * Sync pending offline monitorings to Supabase
 */
export async function syncPendingMonitorings(): Promise<{
  success: number
  failed: number
  errors: string[]
}> {
  if (typeof window === 'undefined') {
    return { success: 0, failed: 0, errors: ['Not in browser environment'] }
  }

  if (!navigator.onLine) {
    return { success: 0, failed: 0, errors: ['Koneksi internet tidak tersedia'] }
  }

  const pendingList = await db.offlineMonitorings
    .where('sync_status')
    .anyOf(['PENDING', 'FAILED'])
    .toArray()

  if (pendingList.length === 0) {
    return { success: 0, failed: 0, errors: [] }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let successCount = 0
  let failedCount = 0
  const errors: string[] = []

  for (const item of pendingList) {
    try {
      // Mark as syncing
      await db.offlineMonitorings.update(item.id, { sync_status: 'SYNCING' })

      // 1. Insert or Upsert Field Monitoring Row
      const geomGeoJSON = {
        type: 'Point',
        coordinates: item.coordinates,
      }

      const observerId = user?.id || item.observer_id

      const { data: monitoring, error: monitoringError } = await supabase
        .from('field_monitorings')
        .upsert(
          {
            id: item.id,
            plot_id: item.plot_id,
            date: item.date,
            geom: geomGeoJSON,
            gps_accuracy_m: item.gps_accuracy_m,
            healthy_count: item.healthy_count,
            stressed_count: item.stressed_count,
            dead_count: item.dead_count,
            missing_count: item.missing_count,
            avg_height_cm: item.avg_height_cm,
            avg_diameter_cm: item.avg_diameter_cm,
            canopy_cover_pct: item.canopy_cover_pct,
            notes: item.notes,
            observer_id: observerId,
            sync_status: 'SYNCED',
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single()

      if (monitoringError) throw monitoringError

      // 2. Upload pending photos
      const photos = await db.offlinePhotos.where('monitoring_id').equals(item.id).toArray()

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        const ext = p.file_name.split('.').pop() || 'jpg'
        const filePath = `monitoring/${item.id}/${Date.now()}_${i}.${ext}`

        try {
          const { error: uploadError } = await supabase.storage
            .from('monitoring-photos')
            .upload(filePath, p.blob, {
              cacheControl: '3600',
              upsert: true,
              contentType: p.file_type,
            })

          let photoUrl = filePath
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('monitoring-photos')
              .getPublicUrl(filePath)
            photoUrl = publicUrlData.publicUrl
          }

          // Insert photo record
          await supabase.from('photos').insert({
            id: p.id,
            monitoring_id: item.id,
            url: photoUrl,
            caption: p.caption,
            taken_at: p.created_at,
            exif_lat: item.coordinates[1],
            exif_lon: item.coordinates[0],
            file_size_bytes: p.file_size_bytes,
          } as any)

          // Remove photo blob from local DB once uploaded
          await db.offlinePhotos.delete(p.id)
        } catch (photoErr) {
          console.warn(`Failed to upload photo ${p.id}:`, photoErr)
        }
      }

      // 3. Mark monitoring as SYNCED
      await db.offlineMonitorings.update(item.id, {
        sync_status: 'SYNCED',
        sync_error: null,
      })

      // Remove from syncQueue
      await db.syncQueue.where('entity_id').equals(item.id).delete()

      // Also clean up synced monitoring record from local DB after brief delay or keep for history
      await db.offlineMonitorings.delete(item.id)

      successCount++
    } catch (err: any) {
      console.error(`Sync error for monitoring ${item.id}:`, err)
      failedCount++
      const msg = err?.message || 'Gagal menyinkronkan data'
      errors.push(msg)

      await db.offlineMonitorings.update(item.id, {
        sync_status: 'FAILED',
        sync_error: msg,
      })

      // Update sync queue retry count
      const q = await db.syncQueue.where('entity_id').equals(item.id).first()
      if (q) {
        await db.syncQueue.update(q.id, {
          status: 'FAILED',
          retry_count: q.retry_count + 1,
          last_error: msg,
          updated_at: new Date().toISOString(),
        })
      }
    }
  }

  return { success: successCount, failed: failedCount, errors }
}
