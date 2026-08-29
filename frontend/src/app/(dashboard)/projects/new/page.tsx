'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateProject } from '@/hooks/use-projects'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, AlertCircle, Trees, Shield, Eye } from 'lucide-react'
import type { ProjectStatus, ProjectVisibility } from '@/lib/supabase/types'

export default function NewProjectPage() {
  const router = useRouter()
  const createProjectMutation = useCreateProject()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [locationName, setLocationName] = useState('')
  const [province, setProvince] = useState('Jawa Tengah')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [targetAreaHa, setTargetAreaHa] = useState<string>('')
  const [targetPlants, setTargetPlants] = useState<string>('')
  const [status, setStatus] = useState<ProjectStatus>('PLANNING')
  const [visibility, setVisibility] = useState<ProjectVisibility>('PRIVATE')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const project = await createProjectMutation.mutateAsync({
        name,
        description: description || null,
        location_name: locationName,
        province,
        start_date: startDate,
        target_area_ha: targetAreaHa ? parseFloat(targetAreaHa) : null,
        target_plants: targetPlants ? parseInt(targetPlants, 10) : null,
        status,
        visibility,
      })

      router.push(`/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message || 'Gagal membuat proyek. Pastikan Anda sudah login.')
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back Link */}
      <div>
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
      </div>

      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Buat Proyek Rehabilitasi Baru</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Inisialisasi program rehabilitasi, target area, dan parameter awal.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.875rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--status-at-risk-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--status-at-risk)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Nama Proyek Rehabilitasi *"
            placeholder="Contoh: Rehabilitasi DAS Serayu Hulu Blok A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="input-group">
            <label className="input-label">Deskripsi Program & Tujuan</label>
            <textarea
              className="input-control"
              rows={3}
              placeholder="Jelaskan latar belakang degradasi, tujuan pemulihan ekosistem, dan rencana intervensi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <Input
              label="Nama Lokasi / Kawasan *"
              placeholder="Contoh: Lereng Gn. Slamet / Hutan Lindung"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
            />

            <div className="input-group">
              <label className="input-label">Provinsi *</label>
              <input
                type="text"
                className="input-control"
                placeholder="Contoh: Jawa Tengah"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input
              label="Tanggal Mulai Pelaksanaan *"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />

            <Input
              label="Target Luas Area (Ha)"
              type="number"
              step="0.01"
              placeholder="Contoh: 15.5"
              value={targetAreaHa}
              onChange={(e) => setTargetAreaHa(e.target.value)}
            />

            <Input
              label="Target Jumlah Pohon (Batang)"
              type="number"
              placeholder="Contoh: 5000"
              value={targetPlants}
              onChange={(e) => setTargetPlants(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Status Proyek</label>
              <select
                className="input-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                <option value="PLANNING">Perencanaan (Planning)</option>
                <option value="ACTIVE">Aktif Berjalan (Active)</option>
                <option value="COMPLETED">Selesai (Completed)</option>
                <option value="SUSPENDED">Ditangguhkan (Suspended)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Visibilitas Akses</label>
              <select
                className="input-control"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
              >
                <option value="PRIVATE">🔒 Private (Hanya anggota tim & petugas)</option>
                <option value="PUBLIC">🌐 Public (Bisa dilihat publik & calon adopter)</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <Link href="/projects">
              <Button type="button" variant="secondary">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={createProjectMutation.isPending}
            >
              Simpan & Buat Proyek
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
