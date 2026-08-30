'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePlots } from '@/hooks/use-plots'
import { useProjects } from '@/hooks/use-projects'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  REHABILITATION_TYPE_LABELS,
  MONITORING_STATUS_CONFIG,
} from '@/lib/constants'
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Trees,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
} from 'lucide-react'

const PlotMapView = dynamic(
  () => import('@/components/map/plot-map-view').then((mod) => mod.PlotMapView),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '560px',
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

export default function PlotsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  const { data: projects = [] } = useProjects()
  const {
    data: plots = [],
    isLoading,
    error,
  } = usePlots({
    projectId: selectedProjectId || undefined,
    status: selectedStatus || undefined,
    search: searchQuery || undefined,
  })

  // Stats calculation
  const totalPlots = plots.length
  const totalAreaM2 = plots.reduce((acc, p) => acc + (Number(p.area_m2) || 0), 0)
  const totalAreaHa = (totalAreaM2 / 10000).toFixed(2)
  const recoveringCount = plots.filter((p) => p.monitoring_status === 'RECOVERING').length
  const monitoringCount = plots.filter((p) => p.monitoring_status === 'MONITORING').length
  const atRiskCount = plots.filter((p) => p.monitoring_status === 'AT_RISK').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Main Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-100)',
                color: 'var(--primary-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={20} />
            </span>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
              Plot Rehabilitasi Lahan
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px' }}>
            Unit spasial pemantauan poligon, tutupan kanopi vegetasi, dan rekam jejak pemulihan temporal.
          </p>
        </div>

        <div style={{ flexShrink: 0 }}>
          <Link href="/plots/new">
            <Button variant="primary" icon={<Plus size={16} />}>
              Tambah Plot Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Total Plot</span>
            <MapPin size={16} style={{ color: 'var(--primary-600)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {totalPlots}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit poligon aktif</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Total Luas Area</span>
            <Layers size={16} style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {totalAreaHa} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Ha</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cakupan intervensi</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--status-recovering)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Pulih (Recovering)</span>
            <CheckCircle2 size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--status-recovering)', margin: '0.25rem 0' }}>
            {recoveringCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progres pemulihan tinggi</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--status-monitoring)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Pemantauan</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--status-monitoring)', margin: '0.25rem 0' }}>
            {monitoringCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dalam observasi rutin</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--status-at-risk)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Berisiko (At Risk)</span>
            <AlertTriangle size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--status-at-risk)', margin: '0.25rem 0' }}>
            {atRiskCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Perlu tindakan penyulaman</span>
        </Card>
      </div>

      {/* Filter & View Switcher Bar */}
      <Card style={{ padding: '0.875rem 1.25rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Cari nama plot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>

            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="">Semua Proyek ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="">Semua Status</option>
              <option value="RECOVERING">Pulih (Recovering)</option>
              <option value="MONITORING">Pemantauan (Monitoring)</option>
              <option value="AT_RISK">Berisiko (At Risk)</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                color: viewMode === 'grid' ? 'var(--primary-700)' : 'var(--text-muted)',
                boxShadow: viewMode === 'grid' ? 'var(--shadow-xs)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              <LayoutGrid size={14} />
              <span>Daftar Kartu</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'map' ? '#ffffff' : 'transparent',
                color: viewMode === 'map' ? 'var(--primary-700)' : 'var(--text-muted)',
                boxShadow: viewMode === 'map' ? 'var(--shadow-xs)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              <MapIcon size={14} />
              <span>Peta Spasial</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border-subtle)',
              borderTopColor: 'var(--primary-500)',
              borderRadius: '50%',
              margin: '0 auto 1rem auto',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Memuat daftar plot rehabilitasi...
        </div>
      ) : plots.length === 0 ? (
        <EmptyState
          title="Tidak Ada Plot yang Ditemukan"
          description="Belum ada data plot terdaftar atau tidak ada hasil yang sesuai dengan filter pencarian."
          action={
            <Link href="/plots/new">
              <Button variant="primary" icon={<Plus size={16} />}>
                Tambah Plot Pertama
              </Button>
            </Link>
          }
        />
      ) : viewMode === 'map' ? (
        /* MAP VIEW */
        <Card style={{ padding: '0.5rem', background: '#ffffff', overflow: 'hidden' }}>
          <PlotMapView plots={plots as any} height="620px" />
        </Card>
      ) : (
        /* GRID CARDS VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {plots.map((plot) => {
            const areaHa = ((Number(plot.area_m2) || 0) / 10000).toFixed(2)
            const monitoringCount = plot.monitorings?.[0]?.count || 0

            return (
              <Card
                key={plot.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                }}
              >
                <div>
                  {/* Top Row: Status Badge & Area */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                    <StatusBadge status={plot.monitoring_status} />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--primary-50)',
                        color: 'var(--primary-800)',
                        border: '1px solid var(--primary-200)',
                      }}
                    >
                      {areaHa} Ha
                    </span>
                  </div>

                  {/* Plot Name */}
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    <Link
                      href={`/plots/${plot.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                      className="hover-underline"
                    >
                      {plot.name}
                    </Link>
                  </h3>

                  {/* Project Context */}
                  {plot.project && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <Trees size={14} style={{ color: 'var(--primary-600)' }} />
                      <span>{plot.project.name} &bull; {plot.project.location_name}</span>
                    </div>
                  )}

                  {/* Rehab Type Badge */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--primary-700)',
                        background: 'var(--primary-50)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      {REHABILITATION_TYPE_LABELS[plot.rehabilitation_type] || plot.rehabilitation_type}
                    </span>
                  </div>

                  {/* Baseline / Description */}
                  {plot.baseline_description && (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {plot.baseline_description}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{monitoringCount} data pemantauan</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Link href={`/plots/${plot.id}`}>
                      <Button variant="secondary" size="sm">
                        Detail
                      </Button>
                    </Link>
                    <Link href={`/monitoring/new?plotId=${plot.id}`}>
                      <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                        Monitoring
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
