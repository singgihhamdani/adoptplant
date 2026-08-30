'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePlots } from '@/hooks/use-plots'
import { useSpecies, useCreateSpecies, useCreatePlantingEvent } from '@/hooks/use-interventions'
import type { SpeciesCategory } from '@/lib/supabase/types'
import {
  Sprout,
  Calendar,
  Save,
  Plus,
  AlertCircle,
  Trees,
} from 'lucide-react'

export interface NewPlantingModalProps {
  isOpen: boolean
  onClose: () => void
  defaultPlotId?: string
}

export function NewPlantingModal({
  isOpen,
  onClose,
  defaultPlotId,
}: NewPlantingModalProps) {
  const { data: plots = [] } = usePlots()
  const { data: speciesList = [] } = useSpecies()
  const createPlantingMutation = useCreatePlantingEvent()
  const createSpeciesMutation = useCreateSpecies()

  const [plotId, setPlotId] = useState(defaultPlotId || '')
  const [speciesId, setSpeciesId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [quantity, setQuantity] = useState<number | ''>(100)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Sub-form to add new species
  const [isAddingNewSpecies, setIsAddingNewSpecies] = useState(false)
  const [newCommonName, setNewCommonName] = useState('')
  const [newScientificName, setNewScientificName] = useState('')
  const [newCategory, setNewCategory] = useState<SpeciesCategory>('TREE')

  React.useEffect(() => {
    if (defaultPlotId) setPlotId(defaultPlotId)
  }, [defaultPlotId])

  const handleAddNewSpecies = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommonName.trim()) return

    try {
      const created = await createSpeciesMutation.mutateAsync({
        common_name: newCommonName.trim(),
        scientific_name: newScientificName.trim() || null,
        category: newCategory,
        native: true,
      })

      setSpeciesId(created.id)
      setIsAddingNewSpecies(false)
      setNewCommonName('')
      setNewScientificName('')
    } catch (err: any) {
      console.error('Add species error:', err)
      setError(err?.message || 'Gagal menambahkan spesies baru.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!plotId) {
      setError('Harap pilih plot target penanaman.')
      return
    }

    if (!speciesId) {
      setError('Harap pilih spesies bibit yang ditanam.')
      return
    }

    if (!quantity || Number(quantity) <= 0) {
      setError('Harap masukkan jumlah bibit yang ditanam.')
      return
    }

    try {
      await createPlantingMutation.mutateAsync({
        plot_id: plotId,
        species_id: speciesId,
        date,
        quantity: Number(quantity),
        notes: notes.trim() || null,
      })

      // Reset & Close
      setNotes('')
      onClose()
    } catch (err: any) {
      console.error('Create planting error:', err)
      setError(err?.message || 'Gagal menyimpan penanaman bibit.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Event Penanaman Bibit (Planting)">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-at-risk-bg)',
              border: '1px solid var(--status-at-risk)',
              color: 'var(--status-at-risk)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Plot Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Plot Lahan Sasaran *
          </label>
          <select
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              background: '#ffffff',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="">-- Pilih Plot --</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.project ? `(${p.project.name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Species Selector & Quick Add */}
        <div>
          <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Spesies / Jenis Tanaman *
            </label>
            <button
              type="button"
              onClick={() => setIsAddingNewSpecies(!isAddingNewSpecies)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-700)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Plus size={13} />
              <span>{isAddingNewSpecies ? 'Batal Tambah' : 'Tambah Spesies Baru'}</span>
            </button>
          </div>

          {!isAddingNewSpecies ? (
            <select
              value={speciesId}
              onChange={(e) => setSpeciesId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: '#ffffff',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="">-- Pilih Spesies Tanaman --</option>
              {speciesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.common_name} {s.scientific_name ? `(${s.scientific_name})` : ''} - {s.category}
                </option>
              ))}
            </select>
          ) : (
            /* Sub-Form Add New Species */
            <div
              style={{
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <Input
                label="Nama Lokal Spesies *"
                placeholder="Misal: Mahoni, Sengon, Bakau Minyak"
                value={newCommonName}
                onChange={(e) => setNewCommonName(e.target.value)}
                required
              />
              <Input
                label="Nama Ilmiah (Latin)"
                placeholder="Misal: Swietenia macrophylla"
                value={newScientificName}
                onChange={(e) => setNewScientificName(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddNewSpecies}
                isLoading={createSpeciesMutation.isPending}
                icon={<Plus size={14} />}
              >
                Simpan & Pilih Spesies Ini
              </Button>
            </div>
          )}
        </div>

        {/* Date & Quantity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            type="date"
            label="Tanggal Penanaman"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            type="number"
            label="Jumlah Bibit Ditanam (Batang) *"
            placeholder="Misal: 250"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
            min={1}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Catatan Event Penanaman
          </label>
          <textarea
            rows={2}
            placeholder="Informasi asal bibit, mitra penanam, pola jarak tanam..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              background: '#ffffff',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createPlantingMutation.isPending}
            icon={<Save size={16} />}
          >
            Simpan Event Penanaman
          </Button>
        </div>
      </form>
    </Modal>
  )
}
