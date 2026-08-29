'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useProject } from '@/hooks/use-projects'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { REHABILITATION_TYPE_LABELS } from '@/lib/constants'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Layers,
  Users,
  Plus,
  TreePine,
  Shield,
  Eye,
  Activity,
  UserPlus,
} from 'lucide-react'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params?.id as string
  const { data: project, isLoading, error } = useProject(projectId)
  const [activeTab, setActiveTab] = useState<'overview' | 'plots' | 'members' | 'timeline'>('overview')

  if (isLoading) {
    return (
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
        Memuat data proyek...
      </div>
    )
  }

  if (error || !project) {
    return (
      <Card style={{ borderColor: 'var(--status-at-risk)', background: 'var(--status-at-risk-bg)' }}>
        <h3 style={{ color: 'var(--status-at-risk)', marginBottom: '0.5rem' }}>Proyek Tidak Ditemukan</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Proyek mungkin telah dihapus atau Anda belum memiliki izin akses untuk proyek ini.
        </p>
        <Link href="/projects">
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={16} />}>
            Kembali ke Daftar Proyek
          </Button>
        </Link>
      </Card>
    )
  }

  const plots = project.plots || []
  const members = project.members || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Link & Quick Actions */}
      <div className="flex-between">
        <Link
          href="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Proyek
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href={`/projects/${projectId}/plots/new`}>
            <Button variant="primary" size="sm" icon={<Plus size={16} />}>
              Tambah Plot Lahan
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Banner Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(17, 24, 39, 0.85) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Badge
            variant={
              project.status === 'ACTIVE'
                ? 'success'
                : project.status === 'PLANNING'
                ? 'warning'
                : 'default'
            }
          >
            {project.status}
          </Badge>
          <Badge variant="default">
            {project.visibility === 'PUBLIC' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} /> Publik
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={12} /> Privat
              </span>
            )}
          </Badge>
        </div>

        <h1 style={{ fontSize: '1.65rem', marginBottom: '0.5rem', color: '#ffffff' }}>
          {project.name}
        </h1>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={16} style={{ color: 'var(--primary-400)' }} />
            <span>{project.location_name}, {project.province}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} />
            <span>Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={16} />
            <span>{plots.length} Plot Dimonitor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={16} />
            <span>{members.length} Petugas/Anggota</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.25rem',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--primary-500)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--primary-400)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Ringkasan (Overview)
        </button>

        <button
          onClick={() => setActiveTab('plots')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'plots' ? '2px solid var(--primary-500)' : '2px solid transparent',
            color: activeTab === 'plots' ? 'var(--primary-400)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Plot Lahan ({plots.length})
        </button>

        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'members' ? '2px solid var(--primary-500)' : '2px solid transparent',
            color: activeTab === 'members' ? 'var(--primary-400)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Tim & Petugas ({members.length})
        </button>
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Card>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Luas</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>
                {project.target_area_ha || 0} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ha</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rencana pemulihan</span>
            </Card>

            <Card>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Tanaman</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>
                {(project.target_plants || 0).toLocaleString('id-ID')} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>btg</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total bibit ditargetkan</span>
            </Card>

            <Card>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Jumlah Plot</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>
                {plots.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Polygon koordinat aktif</span>
            </Card>
          </div>

          {/* Description */}
          {project.description && (
            <Card>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Deskripsi & Rencana Restorasi</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                {project.description}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Tab Content: PLOTS */}
      {activeTab === 'plots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1.1rem' }}>Plot Terdaftar di Proyek Ini</h3>
            <Link href={`/projects/${projectId}/plots/new`}>
              <Button variant="primary" size="sm" icon={<Plus size={16} />}>
                Tambah Plot Polygon
              </Button>
            </Link>
          </div>

          {plots.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {plots.map((plot: any) => (
                <Card key={plot.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <StatusBadge status={plot.monitoring_status} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {((plot.area_m2 || 0) / 10000).toFixed(2)} Ha
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                      <Link href={`/plots/${plot.id}`} style={{ color: 'inherit' }}>
                        {plot.name}
                      </Link>
                    </h4>

                    <span style={{ fontSize: '0.8rem', color: 'var(--primary-400)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>
                      {REHABILITATION_TYPE_LABELS[plot.rehabilitation_type] || plot.rehabilitation_type}
                    </span>

                    {plot.baseline_description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {plot.baseline_description}
                      </p>
                    )}
                  </div>

                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                    <Link href={`/plots/${plot.id}`}>
                      <Button variant="secondary" size="sm">
                        Detail Plot
                      </Button>
                    </Link>
                    <Link href={`/monitoring/new?plotId=${plot.id}`}>
                      <Button variant="primary" size="sm">
                        Input Monitoring
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum Ada Plot Lahan"
              description="Plot adalah unit geografis polygon yang dipantau time series dan monitoring lapangannya."
              action={
                <Link href={`/projects/${projectId}/plots/new`}>
                  <Button variant="primary" icon={<Plus size={16} />}>
                    Gambar Plot Pertama
                  </Button>
                </Link>
              }
            />
          )}
        </div>
      )}

      {/* Tab Content: MEMBERS */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1.1rem' }}>Anggota Tim & Petugas Lapangan</h3>
            <Button variant="secondary" size="sm" icon={<UserPlus size={16} />}>
              Undang Anggota
            </Button>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama Anggota</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Peran (Role)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tanggal Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      {m.user?.name || 'Petugas'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <Badge variant={m.role === 'MANAGER' ? 'success' : m.role === 'FIELD_OFFICER' ? 'info' : 'default'}>
                        {m.role}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {m.user?.email || '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(m.joined_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}
