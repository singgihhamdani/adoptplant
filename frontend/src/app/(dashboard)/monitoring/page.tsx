'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useMonitorings } from '@/hooks/use-monitoring'
import { useProjects } from '@/hooks/use-projects'
import { usePlots } from '@/hooks/use-plots'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  ClipboardCheck,
  Plus,
  Search,
  MapPin,
  Calendar,
  Image as ImageIcon,
  User,
  Trees,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react'

export default function MonitoringListPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedPlotId, setSelectedPlotId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const { data: projects = [] } = useProjects()
  const { data: plots = [] } = usePlots({ projectId: selectedProjectId || undefined })
  const {
    data: monitorings = [],
    isLoading,
    error,
  } = useMonitorings({
    projectId: selectedProjectId || undefined,
    plotId: selectedPlotId || undefined,
    search: searchQuery || undefined,
  })

  // Aggregate Stats
  const totalMonitorings = monitorings.length
  const totalPhotos = monitorings.reduce((acc, m) => acc + (m.photos?.length || 0), 0)
  const validRates = monitorings
    .filter((m) => m.survival_rate !== null && m.survival_rate !== undefined)
    .map((m) => Number(m.survival_rate))

  const avgSurvivalRate =
    validRates.length > 0
      ? Math.round(validRates.reduce((a, b) => a + b, 0) / validRates.length)
      : null

  const totalHealthy = monitorings.reduce((acc, m) => acc + (m.healthy_count || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex-between">
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
              <ClipboardCheck size={20} />
            </span>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
              Field Monitoring Lapangan
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px' }}>
            Bukti empiris langsung (<em>field evidence</em>): pencatatan kondisi bibit, tingkat kelangsungan hidup, dan foto geotagged.
          </p>
        </div>

        <Link href="/monitoring/new">
          <Button variant="primary" icon={<Plus size={16} />}>
            Input Monitoring Baru
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Total Pengamatan</span>
            <ClipboardCheck size={16} style={{ color: 'var(--primary-600)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {totalMonitorings}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Laporan lapangan masuk</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--status-recovering)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Rata-rata Kelangsungan Hidup</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: (avgSurvivalRate || 0) >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)', margin: '0.25rem 0' }}>
            {avgSurvivalRate !== null ? `${avgSurvivalRate}%` : '-'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Survival rate gabungan</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--accent-indigo)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Foto Dokumentasi</span>
            <ImageIcon size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {totalPhotos}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Foto lapangan terkompresi</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--primary-700)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Pohon Sehat Terverifikasi</span>
            <Trees size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-700)', margin: '0.25rem 0' }}>
            {totalHealthy.toLocaleString('id-ID')} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>btg</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kondisi sehat</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search */}
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
              placeholder="Cari plot, nama observer, atau catatan..."
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
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setSelectedPlotId('')
            }}
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

          {/* Plot Filter */}
          <select
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
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
            <option value="">Semua Plot ({plots.length})</option>
            {plots.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Monitoring Records Feed */}
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
          Memuat data riwayat pemantauan lapangan...
        </div>
      ) : monitorings.length === 0 ? (
        <EmptyState
          title="Belum Ada Catatan Monitoring Lapangan"
          description="Lakukan pencatatan monitoring lapangan pertama dengan menghitung pohon sehat/sakit dan mengunggah foto geotagged."
          action={
            <Link href="/monitoring/new">
              <Button variant="primary" icon={<Plus size={16} />}>
                Input Data Monitoring Pertama
              </Button>
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {monitorings.map((m) => {
            const survivalPct =
              m.survival_rate !== null && m.survival_rate !== undefined
                ? Math.round(Number(m.survival_rate))
                : null
            const totalTrees = m.healthy_count + m.stressed_count + m.dead_count + m.missing_count
            const photosCount = m.photos?.length || 0

            return (
              <Card
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.25rem',
                }}
              >
                {/* Top Row: Plot & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
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
                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(m.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>

                      {m.plot?.project && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          &bull; {m.plot.project.name}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>
                      <Link href={`/monitoring/${m.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {m.plot?.name || 'Plot Lapangan'}
                      </Link>
                    </h3>
                  </div>

                  {/* Survival Rate Badge */}
                  {survivalPct !== null && (
                    <div
                      style={{
                        textAlign: 'right',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: survivalPct >= 70 ? 'var(--status-recovering-bg)' : 'var(--status-at-risk-bg)',
                        border: `1px solid ${survivalPct >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)'}`,
                      }}
                    >
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                        Survival Rate
                      </span>
                      <strong style={{ fontSize: '1.25rem', color: survivalPct >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)' }}>
                        {survivalPct}%
                      </strong>
                    </div>
                  )}
                </div>

                {/* Tree Counts & Growth Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem',
                    background: 'var(--bg-surface-subtle)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Bibit Sehat</span>
                    <strong style={{ color: '#16a34a', fontSize: '1rem' }}>{m.healthy_count} btg</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Stres / Sakit</span>
                    <strong style={{ color: '#ea580c', fontSize: '1rem' }}>{m.stressed_count} btg</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Mati</span>
                    <strong style={{ color: '#dc2626', fontSize: '1rem' }}>{m.dead_count} btg</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Hilang</span>
                    <strong style={{ color: '#64748b', fontSize: '1rem' }}>{m.missing_count} btg</strong>
                  </div>

                  {m.avg_height_cm && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Rata-rata Tinggi</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{m.avg_height_cm} cm</strong>
                    </div>
                  )}

                  {m.canopy_cover_pct && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Tutupan Kanopi</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{m.canopy_cover_pct}%</strong>
                    </div>
                  )}
                </div>

                {/* Notes if available */}
                {m.notes && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    <strong>Catatan Petugas:</strong> {m.notes}
                  </p>
                )}

                {/* Photo Previews */}
                {photosCount > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    {m.photos?.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        style={{
                          width: '80px',
                          height: '60px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#0f172a',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={p.url}
                          alt={p.caption || 'Foto monitoring'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                    {photosCount > 4 && (
                      <div
                        style={{
                          width: '80px',
                          height: '60px',
                          borderRadius: '6px',
                          background: 'var(--bg-surface-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        +{photosCount - 4} foto
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: Observer & Action */}
                <div
                  style={{
                    paddingTop: '0.625rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={14} />
                    <span>Petugas: <strong>{m.observer?.name || 'Petugas Lapangan'}</strong></span>
                  </div>

                  <Link href={`/monitoring/${m.id}`}>
                    <Button variant="secondary" size="sm" icon={<ArrowUpRight size={13} />}>
                      Buka Detail Laporan
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
