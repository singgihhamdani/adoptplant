'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database, Intervention, PlantingEvent, Species, InterventionType } from '@/lib/supabase/types'

type InterventionInsert = Database['public']['Tables']['interventions']['Insert']
type PlantingEventInsert = Database['public']['Tables']['planting_events']['Insert']
type SpeciesInsert = Database['public']['Tables']['species']['Insert']

export interface InterventionWithRelations extends Intervention {
  plot?: {
    id: string
    name: string
    rehabilitation_type: string
    project?: {
      id: string
      name: string
      location_name: string
    }
  }
  created_by_user?: {
    id: string
    name: string
    email: string
  }
}

export interface PlantingWithRelations extends PlantingEvent {
  plot?: {
    id: string
    name: string
    rehabilitation_type: string
    project?: {
      id: string
      name: string
      location_name: string
    }
  }
  species?: Species
}

export interface TimelineEventItem {
  id: string
  category: 'PLANTING' | 'INTERVENTION' | 'MONITORING'
  date: string
  title: string
  description?: string | null
  plotId?: string
  plotName?: string
  projectId?: string
  projectName?: string
  locationName?: string
  userName?: string
  interventionType?: InterventionType
  quantity?: number | null
  speciesName?: string
  scientificName?: string | null
  survivalRate?: number | null
  healthyCount?: number
  stressedCount?: number
  deadCount?: number
  photos?: { id: string; url: string; caption?: string | null }[]
}

export interface TimelineFilters {
  category?: string
  projectId?: string
  plotId?: string
  search?: string
}

// 1. Hook for Species Catalog
export function useSpecies() {
  const supabase = createClient()

  return useQuery<Species[]>({
    queryKey: ['species'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .order('common_name', { ascending: true })

      if (error) throw error
      return (data as unknown as Species[]) || []
    },
  })
}

// Hook to create a new Species
export function useCreateSpecies() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (newSpecies: SpeciesInsert) => {
      const { data, error } = await supabase
        .from('species')
        .insert(newSpecies as any)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Species
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['species'] })
    },
  })
}

// 2. Hook for Interventions
export function useInterventions(plotId?: string) {
  const supabase = createClient()

  return useQuery<InterventionWithRelations[]>({
    queryKey: ['interventions', plotId],
    queryFn: async () => {
      let query = supabase
        .from('interventions')
        .select(`
          *,
          plot:plots(id, name, rehabilitation_type, project:projects(id, name, location_name)),
          created_by_user:users(id, name, email)
        `)
        .order('date', { ascending: false })

      if (plotId) {
        query = query.eq('plot_id', plotId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as unknown as InterventionWithRelations[]) || []
    },
  })
}

// Hook to create an Intervention
export function useCreateIntervention() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (payload: Omit<InterventionInsert, 'created_by'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Anda harus login untuk mencatat intervensi.')

      const { data, error } = await supabase
        .from('interventions')
        .insert({
          ...payload,
          created_by: user.id,
        } as any)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Intervention
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['plot', variables.plot_id] })
    },
  })
}

// 3. Hook for Planting Events
export function usePlantingEvents(plotId?: string) {
  const supabase = createClient()

  return useQuery<PlantingWithRelations[]>({
    queryKey: ['planting_events', plotId],
    queryFn: async () => {
      let query = supabase
        .from('planting_events')
        .select(`
          *,
          plot:plots(id, name, rehabilitation_type, project:projects(id, name, location_name)),
          species:species(*)
        `)
        .order('date', { ascending: false })

      if (plotId) {
        query = query.eq('plot_id', plotId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as unknown as PlantingWithRelations[]) || []
    },
  })
}

// Hook to create a Planting Event
export function useCreatePlantingEvent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (payload: PlantingEventInsert) => {
      const { data, error } = await supabase
        .from('planting_events')
        .insert(payload as any)
        .select()
        .single()

      if (error) throw error
      return data as unknown as PlantingEvent
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planting_events'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['plot', variables.plot_id] })
    },
  })
}

// 4. Hook for Unified Timeline Feed
export function useTimelineFeed(filters?: TimelineFilters) {
  const supabase = createClient()

  return useQuery<TimelineEventItem[]>({
    queryKey: ['timeline', filters],
    queryFn: async () => {
      // 1. Fetch Planting Events
      let plantingQuery = supabase
        .from('planting_events')
        .select(`
          *,
          plot:plots(id, name, project:projects(id, name, location_name)),
          species:species(common_name, scientific_name)
        `)
        .order('date', { ascending: false })

      if (filters?.plotId) plantingQuery = plantingQuery.eq('plot_id', filters.plotId)

      // 2. Fetch Interventions
      let interventionQuery = supabase
        .from('interventions')
        .select(`
          *,
          plot:plots(id, name, project:projects(id, name, location_name)),
          created_by_user:users(id, name)
        `)
        .order('date', { ascending: false })

      if (filters?.plotId) interventionQuery = interventionQuery.eq('plot_id', filters.plotId)

      // 3. Fetch Field Monitorings
      let monitoringQuery = supabase
        .from('field_monitorings')
        .select(`
          *,
          plot:plots(id, name, project:projects(id, name, location_name)),
          observer:users(id, name),
          photos:photos(id, url, caption)
        `)
        .order('date', { ascending: false })

      if (filters?.plotId) monitoringQuery = monitoringQuery.eq('plot_id', filters.plotId)

      const [plantingsRes, interventionsRes, monitoringsRes] = await Promise.all([
        plantingQuery,
        interventionQuery,
        monitoringQuery,
      ])

      const items: TimelineEventItem[] = []

      // Map Planting Events
      if (plantingsRes.data) {
        plantingsRes.data.forEach((p: any) => {
          items.push({
            id: `planting-${p.id}`,
            category: 'PLANTING',
            date: p.date,
            title: `Penanaman Bibit: ${p.species?.common_name || 'Tanaman'}`,
            description: p.notes,
            plotId: p.plot?.id,
            plotName: p.plot?.name,
            projectId: p.plot?.project?.id,
            projectName: p.plot?.project?.name,
            locationName: p.plot?.project?.location_name,
            speciesName: p.species?.common_name,
            scientificName: p.species?.scientific_name,
            quantity: p.quantity,
          })
        })
      }

      // Map Interventions
      if (interventionsRes.data) {
        interventionsRes.data.forEach((i: any) => {
          items.push({
            id: `intervention-${i.id}`,
            category: 'INTERVENTION',
            date: i.date,
            title: `Tindakan Intervensi: ${i.type}`,
            description: i.description,
            plotId: i.plot?.id,
            plotName: i.plot?.name,
            projectId: i.plot?.project?.id,
            projectName: i.plot?.project?.name,
            locationName: i.plot?.project?.location_name,
            userName: i.created_by_user?.name,
            interventionType: i.type,
            quantity: i.quantity,
          })
        })
      }

      // Map Monitorings
      if (monitoringsRes.data) {
        monitoringsRes.data.forEach((m: any) => {
          const rate = m.survival_rate !== null ? Math.round(Number(m.survival_rate)) : null
          items.push({
            id: `monitoring-${m.id}`,
            category: 'MONITORING',
            date: m.date,
            title: `Field Monitoring: Kelangsungan Hidup ${rate !== null ? `${rate}%` : '-'}`,
            description: m.notes,
            plotId: m.plot?.id,
            plotName: m.plot?.name,
            projectId: m.plot?.project?.id,
            projectName: m.plot?.project?.name,
            locationName: m.plot?.project?.location_name,
            userName: m.observer?.name,
            survivalRate: rate,
            healthyCount: m.healthy_count,
            stressedCount: m.stressed_count,
            deadCount: m.dead_count,
            photos: m.photos || [],
          })
        })
      }

      // Sort descending by date
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      let filtered = items

      // Category filter
      if (filters?.category && filters.category !== 'ALL') {
        filtered = filtered.filter((item) => item.category === filters.category)
      }

      // Project filter
      if (filters?.projectId) {
        filtered = filtered.filter((item) => item.projectId === filters.projectId)
      }

      // Search filter
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.plotName?.toLowerCase().includes(q) ||
            item.userName?.toLowerCase().includes(q)
        )
      }

      return filtered
    },
  })
}
