'use client'

import React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSystemOverview } from '@/hooks/use-overview'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, Badge } from '@/components/ui/badge'
import {
  Trees,
  MapPin,
  Sprout,
  Activity,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react'
import { exportPlotsToCSV } from '@/lib/csv-export'

const PlotMapView = dynamic(
  () => import('@/components/map/plot-map-view').then((mod) => mod.PlotMapView),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '0.875rem',
        }}
      >
        Memuat Peta Spasial Plot...
      </div>
    ),
  }
)

export default function OverviewPage() {
  const { data, isLoading, error } = useSystemOverview()

  const stats = data?.stats || {
    total_projects: 0,
    total_plots: 0,
    total_area_ha: 0,
    total_planted: 0,
    total_monitorings: 0,
    avg_survival_rate: null,
    plots_recovering: 0,
    plots_monitoring: 0,
    plots_at_risk: 0,
  }

  const plots = data?.plots || []
  const recentProjects = data?.recentProjects || []
  const recentMonitorings = data?.recentMonitorings || []

  // Percentage calculations for status bar
  const totalPlotsCount = stats.total_plots || 1
  const recoveringPct = Math.round((stats.plots_recovering / totalPlotsCount) * 100)
  const monitoringPct = Math.round((stats.plots_monitoring / totalPlotsCount) * 100)
  const atRiskPct = Math.round((stats.plots_at_risk / totalPlotsCount) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
          borderColor: 'var(--primary-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-700)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <ShieldCheck size={16} />
            <span>Sistem Monitoring Lahan Berkelanjutan &bull; Core Engine</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            Dashboard Pemantauan & Evaluasi Pemulihan Lahan
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px' }}>
            Dari aksi penanaman menuju bukti pemulihan (<em>evidence of recovery</em>). Pantau kondisi plot secara spasial, survival rate berkala, dan rekam jejak intervensi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={15} />}
            onClick={() => exportPlotsToCSV(plots)}
            disabled={plots.length === 0}
            title="Unduh ringkasan data seluruh plot lahan dalam format CSV"
          >
            Ekspor Plot CSV
          </Button>
          <Link href="/projects/new">
            <Button variant="secondary" size="sm" icon={<Plus size={15} />}>
              Proyek Baru
            </Button>
          </Link>
          <Link href="/plots/new">
            <Button variant="secondary" size="sm" icon={<MapPin size={15} />}>
              Plot Baru
            </Button>
          </Link>
          <Link href="/monitoring/new">
            <Button variant="primary" size="sm" icon={<ClipboardCheck size={15} />}>
              Input Monitoring
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Total Projects */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Proyek
            </span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
              <Trees size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            {stats.total_projects}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {stats.total_projects > 0 ? `${stats.total_projects} program rehabilitasi aktif` : 'Belum ada proyek dibuat'}
          </span>
        </Card>

        {/* Total Area */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Luas Restorasi
            </span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-cyan)' }}>
              <MapPin size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            {stats.total_area_ha} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Ha</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Terbagi dalam {stats.total_plots} poligon plot
          </span>
        </Card>

        {/* Total Planted */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Bibit Tertanam
            </span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--accent-amber)' }}>
              <Sprout size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            {stats.total_planted.toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Bibit tertanam terdata
          </span>
        </Card>

        {/* Average Survival Rate */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Rata-rata Survival Rate
            </span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--status-recovering-bg)', color: 'var(--status-recovering)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.25rem',
              color: stats.avg_survival_rate !== null && stats.avg_survival_rate >= 70 ? 'var(--status-recovering)' : 'var(--text-primary)',
            }}
          >
            {stats.avg_survival_rate !== null ? `${stats.avg_survival_rate}%` : '-'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dari {stats.total_monitorings} laporan pengamatan
          </span>
        </Card>
      </div>

      {/* Spatial Map (Map First Principle) */}
      <Card style={{ padding: '1rem', background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-100)', color: 'var(--primary-800)' }}>
              <MapPin size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
                Peta Sebaran Plot Rehabilitasi
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Visualisasi spasial batas poligon plot aktif dengan indikator warna status pemulihan.
              </p>
            </div>
          </div>

          <Link
            href="/map"
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'var(--primary-50)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--primary-200)',
              textDecoration: 'none',
            }}
          >
            <span>Buka Peta Spasial Lengkap</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <PlotMapView plots={plots as any} height="420px" />
      </Card>

      {/* Status Breakdown & Recent Activity Feed */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Status Distribution */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
            Distribusi Status Pemulihan Plot
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Recovering */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--status-recovering)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-recovering)' }} />
                  Pulih (Recovering)
                </span>
                <span>{stats.plots_recovering} Plot ({stats.total_plots > 0 ? recoveringPct : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${stats.total_plots > 0 ? recoveringPct : 0}%`, height: '100%', background: 'var(--status-recovering)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

            {/* Monitoring */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--status-monitoring)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-monitoring)' }} />
                  Pemantauan (Monitoring)
                </span>
                <span>{stats.plots_monitoring} Plot ({stats.total_plots > 0 ? monitoringPct : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${stats.total_plots > 0 ? monitoringPct : 0}%`, height: '100%', background: 'var(--status-monitoring)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

            {/* At Risk */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--status-at-risk)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-at-risk)' }} />
                  Berisiko (At Risk)
                </span>
                <span>{stats.plots_at_risk} Plot ({stats.total_plots > 0 ? atRiskPct : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${stats.total_plots > 0 ? atRiskPct : 0}%`, height: '100%', background: 'var(--status-at-risk)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Status dievaluasi dari gabungan data survival rate pemantauan lapangan dan penginderaan jauh.
          </div>
        </Card>

        {/* Recent Monitoring Reports */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
              Laporan Pemantauan Terkini
            </h3>
            <Link href="/monitoring" style={{ fontSize: '0.78rem', color: 'var(--primary-700)', fontWeight: 600 }}>
              Semua Laporan &rarr;
            </Link>
          </div>

          {recentMonitorings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentMonitorings.map((m: any) => {
                const rate = m.survival_rate !== null ? Math.round(Number(m.survival_rate)) : null

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                        <Link href={`/monitoring/${m.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {m.plot?.name || 'Plot Lapangan'}
                        </Link>
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(m.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })} &bull; {m.observer?.name || 'Petugas'}
                      </span>
                    </div>

                    {rate !== null && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: rate >= 70 ? 'var(--status-recovering-bg)' : 'var(--status-at-risk-bg)',
                          color: rate >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)',
                          border: `1px solid ${rate >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)'}`,
                        }}
                      >
                        {rate}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Belum ada data pemantauan lapangan yang masuk.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
