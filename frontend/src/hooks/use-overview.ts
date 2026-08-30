'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Plot, Project, FieldMonitoring } from '@/lib/supabase/types'

export interface SystemOverviewStats {
  total_projects: number
  total_plots: number
  total_area_ha: number
  total_planted: number
  total_monitorings: number
  avg_survival_rate: number | null
  plots_recovering: number
  plots_monitoring: number
  plots_at_risk: number
}

export interface OverviewData {
  stats: SystemOverviewStats
  plots: Plot[]
  recentProjects: Project[]
  recentMonitorings: any[]
}

export function useSystemOverview() {
  const supabase = createClient()

  return useQuery<OverviewData>({
    queryKey: ['overview'],
    queryFn: async () => {
      // 1. Fetch plots, projects, plantings, and monitorings in parallel
      const [plotsRes, projectsRes, plantingsRes, monitoringsRes] = await Promise.all([
        supabase.from('plots').select(`
          *,
          project:projects(id, name, location_name)
        `),
        supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('planting_events').select('quantity'),
        supabase
          .from('field_monitorings')
          .select(`
            *,
            plot:plots(id, name, project:projects(id, name)),
            observer:users(id, name),
            photos:photos(id, url)
          `)
          .order('date', { ascending: false })
          .limit(5),
      ])

      const plots = (plotsRes.data as unknown as Plot[]) || []
      const projects = (projectsRes.data as unknown as Project[]) || []
      const plantings = plantingsRes.data || []
      const recentMonitorings = monitoringsRes.data || []

      // 2. Try calling RPC get_system_overview
      let stats: SystemOverviewStats = {
        total_projects: projects.length,
        total_plots: plots.length,
        total_area_ha: 0,
        total_planted: 0,
        total_monitorings: recentMonitorings.length,
        avg_survival_rate: null,
        plots_recovering: 0,
        plots_monitoring: 0,
        plots_at_risk: 0,
      }

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_system_overview')
        if (!rpcError && rpcData) {
          const parsed = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData
          stats = {
            total_projects: Number(parsed.total_projects) || 0,
            total_plots: Number(parsed.total_plots) || 0,
            total_area_ha: Number(parsed.total_area_ha) || 0,
            total_planted: Number(parsed.total_planted) || 0,
            total_monitorings: Number(parsed.total_monitorings) || 0,
            avg_survival_rate: parsed.avg_survival_rate !== null ? Number(parsed.avg_survival_rate) : null,
            plots_recovering: Number(parsed.plots_recovering) || 0,
            plots_monitoring: Number(parsed.plots_monitoring) || 0,
            plots_at_risk: Number(parsed.plots_at_risk) || 0,
          }
        } else {
          throw new Error('RPC fallback needed')
        }
      } catch {
        // Client-side aggregation fallback
        const totalAreaM2 = plots.reduce((acc, p) => acc + (Number(p.area_m2) || 0), 0)
        const totalPlanted = plantings.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0)
        const recovering = plots.filter((p) => p.monitoring_status === 'RECOVERING').length
        const monitoring = plots.filter((p) => p.monitoring_status === 'MONITORING').length
        const atRisk = plots.filter((p) => p.monitoring_status === 'AT_RISK').length

        const validRates = recentMonitorings
          .filter((m: any) => m.survival_rate !== null && m.survival_rate !== undefined)
          .map((m: any) => Number(m.survival_rate))

        const avgRate =
          validRates.length > 0
            ? Math.round(validRates.reduce((a: number, b: number) => a + b, 0) / validRates.length)
            : null

        stats = {
          total_projects: projects.length,
          total_plots: plots.length,
          total_area_ha: Number((totalAreaM2 / 10000).toFixed(2)),
          total_planted: totalPlanted,
          total_monitorings: recentMonitorings.length,
          avg_survival_rate: avgRate,
          plots_recovering: recovering,
          plots_monitoring: monitoring,
          plots_at_risk: atRisk,
        }
      }

      return {
        stats,
        plots,
        recentProjects: projects,
        recentMonitorings,
      }
    },
    staleTime: 30000,
  })
}
