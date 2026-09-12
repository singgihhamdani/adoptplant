'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database, Project, Plot } from '@/lib/supabase/types'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export interface ProjectWithStats extends Project {
  plots?: { count: number }[]
  members?: { count: number }[]
}

export interface ProjectDetailWithRelations extends Project {
  plots?: Plot[]
  members?: {
    id: string
    role: string
    joined_at: string
    user?: {
      id: string
      name: string
      email: string
      avatar_url: string | null
    }
  }[]
}

import { cacheProjects, getCachedProjects } from '@/lib/offline/cache-manager'

export function useProjects() {
  const supabase = createClient()

  return useQuery<ProjectWithStats[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const cached = await getCachedProjects()
        return (cached as unknown as ProjectWithStats[]) || []
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            plots:plots(count),
            members:project_members(count)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        const results = (data as unknown as ProjectWithStats[]) || []
        cacheProjects(results).catch(() => {})
        return results
      } catch (err) {
        const cached = await getCachedProjects()
        if (cached && cached.length > 0) {
          return cached as unknown as ProjectWithStats[]
        }
        throw err
      }
    },
  })
}

export function useProject(id: string) {
  const supabase = createClient()

  return useQuery<ProjectDetailWithRelations | null>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          plots:plots(*),
          members:project_members(
            id,
            role,
            joined_at,
            user:users(id, name, email, avatar_url)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return (data as unknown as ProjectDetailWithRelations) || null
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (newProject: Omit<ProjectInsert, 'manager_id'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Pengguna belum terotentikasi')

      // 1. Insert Project
      const insertPayload: ProjectInsert = {
        ...newProject,
        manager_id: user.id,
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(insertPayload as any)
        .select()
        .single()

      if (projectError) throw projectError

      // 2. Auto-add Creator as MANAGER in project_members
      const { error: memberError } = await supabase.from('project_members').insert({
        project_id: (project as any).id,
        user_id: user.id,
        role: 'MANAGER',
      } as any)

      if (memberError) {
        console.warn('Failed to auto-assign project member:', memberError)
      }

      return project as unknown as Project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProjectUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Project
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
