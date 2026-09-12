'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePlots, usePlot } from '@/hooks/use-plots'
import { useProjects } from '@/hooks/use-projects'
import { useCreateMonitoringOfflineAware, type CreateMonitoringPayload } from '@/hooks/use-monitoring'
import { PhotoUploader, type UploadedPhotoItem } from '@/components/monitoring/photo-uploader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ClipboardCheck,
  MapPin,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  Trees,
  Info,
  WifiOff,
} from 'lucide-react'

const GPSPicker = dynamic(
  () => import('@/components/monitoring/gps-picker').then((mod) => mod.GPSPicker),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '0.85rem',
        }}
      >
        Memuat GPS Locator Map...
      </div>
    ),
  }
)

function MonitoringCreateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPlotId = searchParams.get('plotId') || ''

  const { data: plots = [], isLoading: isLoadingPlots } = usePlots()
  const [selectedPlotId, setSelectedPlotId] = useState(preselectedPlotId)
  const { data: selectedPlot } = usePlot(selectedPlotId)
  const createMonitoringMutation = useCreateMonitoringOfflineAware()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(10.0)

  // Tree Counts
  const [healthyCount, setHealthyCount] = useState<number | ''>(0)
  const [stressedCount, setStressedCount] = useState<number | ''>(0)
  const [deadCount, setDeadCount] = useState<number | ''>(0)
  const [missingCount, setMissingCount] = useState<number | ''>(0)

  // Growth Metrics
  const [avgHeight, setAvgHeight] = useState<number | ''>('')
  const [avgDiameter, setAvgDiameter] = useState<number | ''>('')
  const [canopyCover, setCanopyCover] = useState<number | ''>('')

  // Notes & Photos
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<UploadedPhotoItem[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (preselectedPlotId && !selectedPlotId) {
      setSelectedPlotId(preselectedPlotId)
    }
  }, [preselectedPlotId])

  // Live Survival Rate Calculation
  const h = Number(healthyCount) || 0
  const s = Number(stressedCount) || 0
  const d = Number(deadCount) || 0
  const m = Number(missingCount) || 0
  const totalObserved = h + s + d + m

  const liveSurvivalRate =
    totalObserved > 0 ? Math.round((h / totalObserved) * 100) : null

  const [spatialInspection, setSpatialInspection] = useState<any>(null)

  const handleCoordinatesChange = (
    coords: [number, number],
    accuracyM: number,
    inspection?: any
  ) => {
    setCoordinates(coords)
    setGpsAccuracy(accuracyM)
    if (inspection) {
      setSpatialInspection(inspection)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedPlotId) {
      setFormError('Harap pilih Plot Lahan yang dipantau.')
      return
    }

    if (!coordinates) {
      setFormError('Harap tentukan titik koordinat GPS pengamatan lapangan (klik peta atau tombol GPS).')
      return
    }

    if (totalObserved === 0) {
      setFormError('Harap masukkan minimal 1 jumlah pohon yang diamati.')
      return
    }

    if (photos.length === 0) {
      setFormError('Minimal 1 foto dokumentasi lapangan wajib diunggah.')
      return
    }

    try {
      const payload: CreateMonitoringPayload = {
        plot_id: selectedPlotId,
        date: date,
        coordinates: coordinates,
        gps_accuracy_m: gpsAccuracy,
        healthy_count: h,
        stressed_count: s,
        dead_count: d,
        missing_count: m,
        avg_height_cm: avgHeight !== '' ? Number(avgHeight) : null,
        avg_diameter_cm: avgDiameter !== '' ? Number(avgDiameter) : null,
        canopy_cover_pct: canopyCover !== '' ? Number(canopyCover) : null,
        notes: notes.trim() || null,
        photos: photos.map((p) => ({
          file: p.file,
          caption: p.caption,
          file_size_bytes: p.compressedSizeBytes,
        })),
      }

      const res = await createMonitoringMutation.mutateAsync(payload)
      if (res.isOffline) {
        router.push('/monitoring?offlineSaved=1')
      } else {
        router.push(`/plots/${selectedPlotId}`)
      }
    } catch (err: any) {
      console.error('Submit monitoring error:', err)
      setFormError(err?.message || 'Gagal menyimpan data monitoring. Silakan coba lagi.')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
          }}
        >
          <WifiOff size={18} style={{ color: '#d97706', flexShrink: 0 }} />
          <div>
            <strong>Mode Lapangan Offline Aktif:</strong> Perangkat tidak terhubung ke internet.
            Laporan monitoring dan foto akan disimpan secara aman di memori perangkat (IndexedDB) dan siap disinkronkan saat kembali online.
          </div>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex-between">
        <Link
          href="/monitoring"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Monitoring
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/monitoring">
            <Button variant="secondary" type="button">
              Batal
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            isLoading={createMonitoringMutation.isPending}
            icon={<Save size={16} />}
          >
            Simpan Laporan Monitoring
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
          Input Field Monitoring Lapangan
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          Dokumentasikan kondisi kesehatan bibit, koordinat GPS pengamatan, dan foto terkompresi otomatis.
        </p>
      </div>

      {/* Form Error Alert */}
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

      {/* Main Grid: Form Inputs & Map */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Plot, Date, Counts & Growth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: Plot & Date */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
              1. Lokasi Plot & Tanggal Pemantauan
            </h3>

            {/* Plot Selection */}
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
                Pilih Plot Dimonitor <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <select
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                disabled={isLoadingPlots}
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
                <option value="">-- Pilih Plot Lapangan --</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.project ? `(${p.project.name})` : ''} - {((Number(p.area_m2) || 0) / 10000).toFixed(2)} Ha
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <Input
              type="date"
              label="Tanggal Pengamatan Lapangan"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Card>

          {/* Section 2: Tree Condition Counts & Live Survival Rate */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-between">
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                2. Jumlah Pohon & Kondisi Bibit
              </h3>

              {liveSurvivalRate !== null && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.3rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: liveSurvivalRate >= 70 ? 'var(--status-recovering-bg)' : 'var(--status-at-risk-bg)',
                    color: liveSurvivalRate >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)',
                    border: `1px solid ${liveSurvivalRate >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)'}`,
                  }}
                >
                  <TrendingUp size={14} />
                  <span>Survival Rate: {liveSurvivalRate}%</span>
                </div>
              )}
            </div>

            {/* Counter Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#16a34a', marginBottom: '0.35rem' }}>
                  Pohon Sehat (Healthy) *
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={healthyCount}
                  onChange={(e) => setHealthyCount(e.target.value !== '' ? Math.max(0, Number(e.target.value)) : '')}
                  min={0}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#ea580c', marginBottom: '0.35rem' }}>
                  Pohon Stres / Sakit (Stressed) *
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={stressedCount}
                  onChange={(e) => setStressedCount(e.target.value !== '' ? Math.max(0, Number(e.target.value)) : '')}
                  min={0}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.35rem' }}>
                  Pohon Mati (Dead) *
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={deadCount}
                  onChange={(e) => setDeadCount(e.target.value !== '' ? Math.max(0, Number(e.target.value)) : '')}
                  min={0}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                  Pohon Hilang (Missing) *
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={missingCount}
                  onChange={(e) => setMissingCount(e.target.value !== '' ? Math.max(0, Number(e.target.value)) : '')}
                  min={0}
                  required
                />
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Bibit Diamati: <strong>{totalObserved} batang</strong>
            </div>
          </Card>

          {/* Section 3: Growth Metrics (Optional) */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
              3. Metrik Pertumbuhan & Vegetasi (Opsional)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <Input
                type="number"
                label="Rata-rata Tinggi (cm)"
                placeholder="Contoh: 120"
                value={avgHeight}
                onChange={(e) => setAvgHeight(e.target.value ? Number(e.target.value) : '')}
                min={0}
                step="0.1"
              />

              <Input
                type="number"
                label="Diameter Batang (cm)"
                placeholder="Contoh: 4.5"
                value={avgDiameter}
                onChange={(e) => setAvgDiameter(e.target.value ? Number(e.target.value) : '')}
                min={0}
                step="0.1"
              />

              <Input
                type="number"
                label="Tutupan Kanopi (%)"
                placeholder="Contoh: 45"
                value={canopyCover}
                onChange={(e) => setCanopyCover(e.target.value ? Number(e.target.value) : '')}
                min={0}
                max={100}
              />
            </div>

            {/* Notes */}
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
                Catatan Petugas Lapangan
              </label>
              <textarea
                rows={3}
                placeholder="Catatan mengenai serangan hama gulma, kelembaban tanah, cuaca, atau rekomendasi intervensi penyulaman..."
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
          </Card>
        </div>

        {/* Right Column: GPS Map Picker & Photo Uploader */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* GPS Picker Card */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-between">
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                4. Titik Koordinat GPS Pengamatan
              </h3>
              {coordinates && (
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                  &check; GPS Terpilih
                </span>
              )}
            </div>

            <GPSPicker
              coordinates={coordinates}
              onCoordinatesChange={handleCoordinatesChange}
              plotPolygon={selectedPlot?.geom}
              plotName={selectedPlot?.name}
              height="280px"
            />
          </Card>

          {/* Photo Uploader Card with Compression */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                5. Foto Dokumentasi Lapangan (Terkompresi Otomatis)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Upload 1 s/d 10 foto. Foto akan otomatis dikompresi di browser ke ukuran &le; 800 KB sebelum diupload.
              </p>
            </div>

            <PhotoUploader
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={10}
            />
          </Card>
        </div>
      </div>
    </form>
  )
}

export default function NewMonitoringPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Memuat form...</div>}>
      <MonitoringCreateForm />
    </Suspense>
  )
}
