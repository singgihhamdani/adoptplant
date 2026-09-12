'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database, Plot, Project, FieldMonitoring } from '@/lib/supabase/types'

type PlotInsert = Database['public']['Tables']['plots']['Insert']
type PlotUpdate = Database['public']['Tables']['plots']['Update']

export interface PlotWithProject extends Plot {
  project?: {
    id: string
    name: string
    location_name: string
    province: string
  }
  monitorings?: { count: number }[]
  latest_monitoring?: FieldMonitoring[]
}

import { cachePlots, getCachedPlots, getCachedPlot } from '@/lib/offline/cache-manager'

export interface PlotFilters {
  projectId?: string
  status?: string
  search?: string
}

export function usePlots(filters?: PlotFilters) {
  const supabase = createClient()

  return useQuery<PlotWithProject[]>({
    queryKey: ['plots', filters],
    queryFn: async () => {
      // If offline, directly return cached plots
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const cached = await getCachedPlots(filters?.projectId)
        return (cached as unknown as PlotWithProject[]) || []
      }

      try {
        let query = supabase
          .from('plots')
          .select(`
            *,
            project:projects(id, name, location_name, province),
            monitorings:field_monitorings(count)
          `)
          .order('created_at', { ascending: false })

        if (filters?.projectId) {
          query = query.eq('project_id', filters.projectId)
        }

        if (filters?.status) {
          query = query.eq('monitoring_status', filters.status as any)
        }

        if (filters?.search) {
          query = query.ilike('name', `%${filters.search}%`)
        }

        const { data, error } = await query

        if (error) throw error

        const results = (data as unknown as PlotWithProject[]) || []
        // Cache fetched plots in IndexedDB asynchronously
        cachePlots(results).catch(() => {})

        return results
      } catch (err) {
        // Fallback to offline cache on network error
        const cached = await getCachedPlots(filters?.projectId)
        if (cached && cached.length > 0) {
          return cached as unknown as PlotWithProject[]
        }
        throw err
      }
    },
  })
}

export function usePlot(id: string) {
  const supabase = createClient()

  return useQuery<PlotWithProject | null>({
    queryKey: ['plot', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('plots')
        .select(`
          *,
          project:projects(id, name, location_name, province, start_date),
          field_monitorings:field_monitorings(
            id,
            date,
            survival_rate,
            healthy_count,
            stressed_count,
            dead_count,
            missing_count,
            avg_height_cm,
            canopy_cover_pct,
            observer:users(id, name)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return (data as unknown as PlotWithProject) || null
    },
    enabled: !!id,
  })
}

export function useCreatePlot() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (newPlot: PlotInsert) => {
      const { data, error } = await supabase
        .from('plots')
        .insert(newPlot as any)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Plot
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plots'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] })
      }
    },
  })
}

export function useUpdatePlot() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: PlotUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('plots')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Plot
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plots'] })
      queryClient.invalidateQueries({ queryKey: ['plot', variables.id] })
    },
  })
}

export function useDeletePlot() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plots').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
