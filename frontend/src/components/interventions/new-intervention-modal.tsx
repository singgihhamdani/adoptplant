'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePlots } from '@/hooks/use-plots'
import { useCreateIntervention } from '@/hooks/use-interventions'
import { INTERVENTION_TYPE_LABELS } from '@/lib/constants'
import type { InterventionType } from '@/lib/supabase/types'
import {
  Wrench,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export interface NewInterventionModalProps {
  isOpen: boolean
  onClose: () => void
  defaultPlotId?: string
}

export function NewInterventionModal({
  isOpen,
  onClose,
  defaultPlotId,
}: NewInterventionModalProps) {
  const { data: plots = [] } = usePlots()
  const createInterventionMutation = useCreateIntervention()

  const [plotId, setPlotId] = useState(defaultPlotId || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<InterventionType>('MAINTENANCE')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Sync defaultPlotId
  React.useEffect(() => {
    if (defaultPlotId) setPlotId(defaultPlotId)
  }, [defaultPlotId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!plotId) {
      setError('Harap pilih plot target intervensi.')
      return
    }

    if (!description.trim()) {
      setError('Harap isi deskripsi tindakan intervensi.')
      return
    }

    try {
      await createInterventionMutation.mutateAsync({
        plot_id: plotId,
        date,
        type,
        quantity: quantity !== '' ? Number(quantity) : null,
        description: description.trim(),
        photo_url: null,
      })

      // Reset & Close
      setDescription('')
      setQuantity('')
      onClose()
    } catch (err: any) {
      console.error('Create intervention error:', err)
      setError(err?.message || 'Gagal mencatat intervensi. Silakan coba lagi.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Tindakan Intervensi Lahan">
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

        {/* Date & Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            type="date"
            label="Tanggal Pelaksanaan"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Jenis Intervensi *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InterventionType)}
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
              {Object.entries(INTERVENTION_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity (Optional) */}
        <Input
          type="number"
          label="Jumlah / Kuantitas Bibit / Material (Opsional)"
          placeholder="Misal: 50 bibit penyulaman atau 20 kg pupuk"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
          min={1}
        />

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Deskripsi & Rincian Aksi Lapangan *
          </label>
          <textarea
            rows={3}
            placeholder="Jelaskan detail tindakan: pembersihan gulma, penggantian bibit kering, takaran pemupukan..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            isLoading={createInterventionMutation.isPending}
            icon={<Save size={16} />}
          >
            Simpan Tindakan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
