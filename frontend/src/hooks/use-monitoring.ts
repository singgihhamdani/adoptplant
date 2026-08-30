'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database, FieldMonitoring, Photo, Plot, Project } from '@/lib/supabase/types'

type FieldMonitoringInsert = Database['public']['Tables']['field_monitorings']['Insert']
type FieldMonitoringUpdate = Database['public']['Tables']['field_monitorings']['Update']

export interface MonitoringWithRelations extends FieldMonitoring {
  plot?: {
    id: string
    name: string
    rehabilitation_type: string
    area_m2: number
    geom?: any
    project?: {
      id: string
      name: string
      location_name: string
      province: string
    }
  }
  observer?: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  }
  photos?: Photo[]
}

export interface MonitoringFilters {
  plotId?: string
  projectId?: string
  search?: string
}

export interface CreateMonitoringPayload {
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

export function useMonitorings(filters?: MonitoringFilters) {
  const supabase = createClient()

  return useQuery<MonitoringWithRelations[]>({
    queryKey: ['monitorings', filters],
    queryFn: async () => {
      let query = supabase
        .from('field_monitorings')
        .select(`
          *,
          plot:plots(
            id,
            name,
            rehabilitation_type,
            area_m2,
            project:projects(id, name, location_name, province)
          ),
          observer:users(id, name, email, avatar_url),
          photos:photos(*)
        `)
        .order('date', { ascending: false })

      if (filters?.plotId) {
        query = query.eq('plot_id', filters.plotId)
      }

      const { data, error } = await query

      if (error) throw error

      let results = (data as unknown as MonitoringWithRelations[]) || []

      // Client-side filter for projectId if requested
      if (filters?.projectId) {
        results = results.filter((m) => m.plot?.project?.id === filters.projectId)
      }

      // Filter by search query (plot name / observer name / notes)
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        results = results.filter(
          (m) =>
            m.plot?.name?.toLowerCase().includes(q) ||
            m.observer?.name?.toLowerCase().includes(q) ||
            m.notes?.toLowerCase().includes(q)
        )
      }

      return results
    },
  })
}

export function useMonitoring(id: string) {
  const supabase = createClient()

  return useQuery<MonitoringWithRelations | null>({
    queryKey: ['monitoring', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('field_monitorings')
        .select(`
          *,
          plot:plots(
            id,
            name,
            rehabilitation_type,
            area_m2,
            geom,
            baseline_date,
            monitoring_status,
            project:projects(id, name, location_name, province, start_date)
          ),
          observer:users(id, name, email, avatar_url),
          photos:photos(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return (data as unknown as MonitoringWithRelations) || null
    },
    enabled: !!id,
  })
}

export function useCreateMonitoring() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (payload: CreateMonitoringPayload) => {
      // 1. Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Anda harus login untuk menginput data monitoring lapangan.')

      // 2. Format PostGIS GeoJSON Point geometry
      const geomGeoJSON = {
        type: 'Point',
        coordinates: payload.coordinates, // [lng, lat]
      }

      const monitoringInsertData: any = {
        plot_id: payload.plot_id,
        date: payload.date,
        geom: geomGeoJSON,
        gps_accuracy_m: payload.gps_accuracy_m || 10.0,
        healthy_count: payload.healthy_count,
        stressed_count: payload.stressed_count,
        dead_count: payload.dead_count,
        missing_count: payload.missing_count,
        avg_height_cm: payload.avg_height_cm || null,
        avg_diameter_cm: payload.avg_diameter_cm || null,
        canopy_cover_pct: payload.canopy_cover_pct || null,
        notes: payload.notes || null,
        observer_id: user.id,
        sync_status: 'SYNCED',
        synced_at: new Date().toISOString(),
      }

      // 3. Insert Field Monitoring Row
      const { data: monitoring, error: monitoringError } = await supabase
        .from('field_monitorings')
        .insert(monitoringInsertData)
        .select()
        .single()

      if (monitoringError) throw monitoringError

      const monitoringId = (monitoring as any).id

      // 4. Upload Photos to Supabase Storage & Insert into photos table
      if (payload.photos && payload.photos.length > 0) {
        for (let i = 0; i < payload.photos.length; i++) {
          const photoItem = payload.photos[i]
          const file = photoItem.file
          const fileExt = file.name.split('.').pop() || 'jpg'
          const filePath = `monitoring/${monitoringId}/${Date.now()}_${i}.${fileExt}`

          try {
            // Upload to Supabase Storage bucket 'monitoring-photos'
            const { error: uploadError } = await supabase.storage
              .from('monitoring-photos')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
              })

            let photoUrl = filePath
            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                .from('monitoring-photos')
                .getPublicUrl(filePath)
              photoUrl = publicUrlData.publicUrl
            } else {
              console.warn('Storage upload error, fallback stored path:', uploadError)
            }

            // Insert row into photos table
            await supabase.from('photos').insert({
              monitoring_id: monitoringId,
              url: photoUrl,
              caption: photoItem.caption || null,
              taken_at: new Date().toISOString(),
              exif_lat: payload.coordinates[1],
              exif_lon: payload.coordinates[0],
              file_size_bytes: photoItem.file_size_bytes || file.size,
            } as any)
          } catch (photoErr) {
            console.error('Failed to process photo upload:', photoErr)
          }
        }
      }

      return monitoring as unknown as FieldMonitoring
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['monitorings'] })
      queryClient.invalidateQueries({ queryKey: ['plots'] })
      queryClient.invalidateQueries({ queryKey: ['plot', variables.plot_id] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}

export function useDeleteMonitoring() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('field_monitorings').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitorings'] })
      queryClient.invalidateQueries({ queryKey: ['plots'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })
}
