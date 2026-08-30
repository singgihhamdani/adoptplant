'use client'

import React, { useState } from 'react'
import { useTimelineFeed } from '@/hooks/use-interventions'
import { useProjects } from '@/hooks/use-projects'
import { usePlots } from '@/hooks/use-plots'
import { TimelineItem } from '@/components/timeline/timeline-item'
import { NewInterventionModal } from '@/components/interventions/new-intervention-modal'
import { NewPlantingModal } from '@/components/interventions/new-planting-modal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  History,
  Sprout,
  Wrench,
  ClipboardCheck,
  Search,
  Plus,
  Filter,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'

export default function TimelinePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedPlotId, setSelectedPlotId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false)
  const [isPlantingModalOpen, setIsPlantingModalOpen] = useState(false)

  const { data: projects = [] } = useProjects()
  const { data: plots = [] } = usePlots({ projectId: selectedProjectId || undefined })
  const {
    data: timelineItems = [],
    isLoading,
    error,
  } = useTimelineFeed({
    category: selectedCategory,
    projectId: selectedProjectId || undefined,
    plotId: selectedPlotId || undefined,
    search: searchQuery || undefined,
  })

  // Aggregate Stats
  const totalEvents = timelineItems.length
  const plantingCount = timelineItems.filter((i) => i.category === 'PLANTING').length
  const interventionCount = timelineItems.filter((i) => i.category === 'INTERVENTION').length
  const monitoringCount = timelineItems.filter((i) => i.category === 'MONITORING').length

  const categories = [
    { id: 'ALL', label: 'Semua Aktivitas', count: totalEvents },
    { id: 'PLANTING', label: 'Penanaman Bibit', count: plantingCount },
    { id: 'INTERVENTION', label: 'Intervensi Lahan', count: interventionCount },
    { id: 'MONITORING', label: 'Field Monitoring', count: monitoringCount },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Quick Action Buttons */}
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
              <History size={20} />
            </span>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
              Timeline & Rekam Jejak Aksi
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px' }}>
            Lini masa kronologis terpadu dari penanaman awal, pemeliharaan lanjutan, hingga bukti pemantauan lapangan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
          <Button
            variant="secondary"
            onClick={() => setIsPlantingModalOpen(true)}
            icon={<Sprout size={16} />}
          >
            Catat Penanaman
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsInterventionModalOpen(true)}
            icon={<Plus size={16} />}
          >
            Catat Intervensi
          </Button>
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
            <span>Total Jejak Aksi</span>
            <History size={16} style={{ color: 'var(--primary-600)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
            {totalEvents}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aktivitas terarsip</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Event Penanaman</span>
            <Sprout size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', margin: '0.25rem 0' }}>
            {plantingCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bibit awal tertanam</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#d97706', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Intervensi Lahan</span>
            <Wrench size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706', margin: '0.25rem 0' }}>
            {interventionCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Penyulaman & perawatan</span>
        </Card>

        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4338ca', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Field Monitoring</span>
            <ClipboardCheck size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4338ca', margin: '0.25rem 0' }}>
            {monitoringCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bukti observasi pohon</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Category Tabs / Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.4rem 0.875rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: isActive ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                    backgroundColor: isActive ? 'var(--primary-50)' : '#ffffff',
                    color: isActive ? 'var(--primary-800)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {cat.label} ({cat.count})
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                placeholder="Cari aktivitas, plot, atau pelaksana..."
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
        </div>
      </Card>

      {/* Main Timeline Stream */}
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
          Memuat rekam jejak linimasa...
        </div>
      ) : timelineItems.length === 0 ? (
        <EmptyState
          title="Belum Ada Rekam Jejak Aktivitas"
          description="Catat penanaman bibit pertama atau intervensi pemeliharaan lahan untuk memulai linimasa proyek."
          action={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setIsPlantingModalOpen(true)} icon={<Sprout size={16} />}>
                Catat Penanaman
              </Button>
              <Button variant="primary" onClick={() => setIsInterventionModalOpen(true)} icon={<Plus size={16} />}>
                Catat Intervensi
              </Button>
            </div>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0' }}>
          {timelineItems.map((item, index) => (
            <TimelineItem
              key={item.id}
              item={item}
              isLast={index === timelineItems.length - 1}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <NewInterventionModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        defaultPlotId={selectedPlotId}
      />

      <NewPlantingModal
        isOpen={isPlantingModalOpen}
        onClose={() => setIsPlantingModalOpen(false)}
        defaultPlotId={selectedPlotId}
      />
    </div>
  )
}
