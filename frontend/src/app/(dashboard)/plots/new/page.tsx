'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useProjects } from '@/hooks/use-projects'
import { useCreatePlot } from '@/hooks/use-plots'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { REHABILITATION_TYPE_LABELS } from '@/lib/constants'
import {
  ArrowLeft,
  MapPin,
  Trees,
  Calendar,
  Layers,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'

const PlotMapDrawer = dynamic(
  () => import('@/components/map/plot-map-drawer').then((mod) => mod.PlotMapDrawer),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '480px',
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
        Memuat GIS Polygon Drawer...
      </div>
    ),
  }
)

function PlotCreateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProjectId = searchParams.get('projectId') || ''

  const { data: projects = [], isLoading: isLoadingProjects } = useProjects()
  const createPlotMutation = useCreatePlot()

  // Form State
  const [projectId, setProjectId] = useState(preselectedProjectId)
  const [name, setName] = useState('')
  const [rehabilitationType, setRehabilitationType] = useState('REFORESTATION')
  const [baselineDate, setBaselineDate] = useState(new Date().toISOString().split('T')[0])
  const [baselineDescription, setBaselineDescription] = useState('')
  const [targetPlants, setTargetPlants] = useState<number | ''>('')
  const [polygonGeoJSON, setPolygonGeoJSON] = useState<any>(null)
  const [calculatedAreaM2, setCalculatedAreaM2] = useState<number>(0)
  const [formError, setFormError] = useState<string | null>(null)

  // Update projectId if preselectedProjectId changes
  React.useEffect(() => {
    if (preselectedProjectId && !projectId) {
      setProjectId(preselectedProjectId)
    }
  }, [preselectedProjectId])

  const handlePolygonChange = (geojson: any, areaM2: number) => {
    setPolygonGeoJSON(geojson)
    setCalculatedAreaM2(areaM2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!projectId) {
      setFormError('Harap pilih Proyek Rehabilitasi.')
      return
    }

    if (!name.trim()) {
      setFormError('Harap isi Nama Plot.')
      return
    }

    if (!polygonGeoJSON || !polygonGeoJSON.coordinates || polygonGeoJSON.coordinates[0].length < 4) {
      setFormError('Harap gambar poligon batas plot di peta minimal 3 titik koordinat.')
      return
    }

    try {
      const payload: any = {
        project_id: projectId,
        name: name.trim(),
        geom: polygonGeoJSON,
        area_m2: calculatedAreaM2,
        rehabilitation_type: rehabilitationType,
        baseline_date: baselineDate,
        baseline_description: baselineDescription.trim() || null,
        target_plants: targetPlants ? Number(targetPlants) : null,
        monitoring_status: 'MONITORING',
        adoptable: false,
      }

      const created = await createPlotMutation.mutateAsync(payload)
      router.push(`/plots/${created.id}`)
    } catch (err: any) {
      console.error('Create plot error:', err)
      setFormError(err?.message || 'Gagal menyimpan plot. Periksa koneksi dan izin Anda.')
    }
  }

  const areaHa = (calculatedAreaM2 / 10000).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div className="flex-between">
        <Link
          href="/plots"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Plot
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/plots">
            <Button variant="secondary" type="button">
              Batal
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            isLoading={createPlotMutation.isPending}
            icon={<Save size={16} />}
          >
            Simpan Plot & Poligon
          </Button>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
          Pendaftaran Plot Rehabilitasi Baru
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          Definisikan unit batas poligon spasial dan data baseline untuk pemantauan lapangan & analisis satelit.
        </p>
      </div>

      {/* Error Alert */}
      {formError && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-at-risk-bg)',
            border: '1px solid var(--status-at-risk)',
            color: 'var(--status-at-risk)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Grid: Form Inputs (Left) + Polygon Map (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Metadata & Baseline Form */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
            1. Informasi Plot & Proyek
          </h3>

          {/* Project Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
              }}
            >
              Pilih Proyek Induk <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={isLoadingProjects}
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
              <option value="">-- Pilih Proyek Terdaftar --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location_name})
                </option>
              ))}
            </select>
          </div>

          {/* Plot Name */}
          <Input
            label="Nama Plot Lahan"
            placeholder="Contoh: Plot 01 - Blok Hulu Sungai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            helperText="Gunakan penamaan yang spesifik dan mudah diidentifikasi di lapangan."
          />

          {/* Rehabilitation Type */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
              }}
            >
              Jenis Intervensi Rehabilitasi <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <select
              value={rehabilitationType}
              onChange={(e) => setRehabilitationType(e.target.value)}
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
              {Object.entries(REHABILITATION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Baseline Date & Target Plants */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              type="date"
              label="Tanggal Baseline"
              value={baselineDate}
              onChange={(e) => setBaselineDate(e.target.value)}
              required
              helperText="Tanggal inisiasi/survei awal plot."
            />

            <Input
              type="number"
              label="Target Pohon (Batang)"
              placeholder="Contoh: 500"
              value={targetPlants}
              onChange={(e) => setTargetPlants(e.target.value ? Number(e.target.value) : '')}
              min={1}
              helperText="Estimasi daya tampung bibit."
            />
          </div>

          {/* Baseline Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
              }}
            >
              Deskripsi Kondisi Baseline Lahan
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan kondisi awal tanah, vegetasi eksisting, riwayat degradasi lahan..."
              value={baselineDescription}
              onChange={(e) => setBaselineDescription(e.target.value)}
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
        </Card>

        {/* Right Column: Spatial Polygon Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-between">
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                2. Gambar Batas Poligon Spasial
              </h3>

              {polygonGeoJSON && calculatedAreaM2 > 0 && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--primary-800)',
                    background: 'var(--primary-50)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--primary-200)',
                  }}
                >
                  Luas Terhitung: {areaHa} Ha
                </span>
              )}
            </div>

            <PlotMapDrawer
              height="460px"
              onPolygonChange={handlePolygonChange}
            />

            {polygonGeoJSON ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  Poligon valid terdeteksi ({polygonGeoJSON.coordinates[0].length - 1} koordinat titik sudut). PostGIS trigger akan menyimpan batas secara otomatis.
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  color: '#b45309',
                  fontSize: '0.8rem',
                }}
              >
                <Info size={16} />
                <span>
                  Silakan klik di atas peta untuk menggambar minimal 3 titik sudut batas plot lahan.
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </form>
  )
}

export default function NewPlotPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Memuat form...</div>}>
      <PlotCreateForm />
    </Suspense>
  )
}
