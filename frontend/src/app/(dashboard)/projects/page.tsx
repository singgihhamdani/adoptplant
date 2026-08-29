'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useProjects } from '@/hooks/use-projects'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Trees,
  Plus,
  Search,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield,
  Eye,
} from 'lucide-react'

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const filteredProjects = projects?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.province.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Daftar Proyek Rehabilitasi</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Kelola seluruh program rehabilitasi, plot polygon, dan penugasan tim lapangan.
          </p>
        </div>

        <Link href="/projects/new">
          <Button variant="primary" icon={<Plus size={16} />}>
            Tambah Proyek Baru
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--bg-surface)',
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Cari berdasarkan nama proyek, lokasi, atau provinsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-control"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-control"
            style={{ width: 'auto', padding: '0.5rem 0.875rem' }}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif (Active)</option>
            <option value="PLANNING">Perencanaan (Planning)</option>
            <option value="COMPLETED">Selesai (Completed)</option>
            <option value="SUSPENDED">Ditangguhkan</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
          Memuat proyek dari Supabase...
        </div>
      ) : error ? (
        <Card style={{ borderColor: 'var(--status-at-risk)', background: 'var(--status-at-risk-bg)' }}>
          <p style={{ color: 'var(--status-at-risk)', margin: 0 }}>
            Gagal memuat proyek. Pastikan skrip SQL di Supabase sudah dijalankan.
          </p>
        </Card>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredProjects.map((project) => {
            const plotCount = project.plots?.[0]?.count || 0
            const memberCount = project.members?.[0]?.count || 0

            return (
              <Card
                key={project.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                      <Badge variant="default" style={{ fontSize: '0.7rem' }}>
                        {project.visibility === 'PUBLIC' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Eye size={10} /> Public
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <Shield size={10} /> Private
                          </span>
                        )}
                      </Badge>
                    </div>

                    <Link href={`/projects/${project.id}`} style={{ color: 'var(--text-muted)' }}>
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>
                    <Link href={`/projects/${project.id}`} style={{ color: 'inherit' }}>
                      {project.name}
                    </Link>
                  </h3>

                  {project.description && (
                    <p
                      style={{
                        fontSize: '0.825rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {project.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} style={{ color: 'var(--primary-400)' }} />
                      <span>
                        {project.location_name}, {project.province}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} />
                      <span>Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Stats */}
                <div
                  style={{
                    paddingTop: '0.875rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{plotCount}</strong> Plot
                    </span>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{project.target_area_ha || 0}</strong> Ha
                    </span>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{memberCount}</strong> Anggota
                    </span>
                  </div>

                  <Link href={`/projects/${project.id}`}>
                    <Button variant="secondary" size="sm">
                      Lihat Detail
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum Ada Proyek Rehabilitasi"
          description="Buat proyek rehabilitasi pertama Anda untuk mulai mendokumentasikan plot dan monitoring kondisi lahan."
          action={
            <Link href="/projects/new">
              <Button variant="primary" icon={<Plus size={16} />}>
                Buat Proyek Pertama
              </Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
