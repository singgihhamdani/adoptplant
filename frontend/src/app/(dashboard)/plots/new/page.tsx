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
import { inspectSpatialPoint, type SpatialInspectionResult } from '@/lib/map/spatial-inspector'
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
  ShieldCheck,
  AlertTriangle,
  Waves,
  History,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react'

const PlotMapDrawer = dynamic(
  () => import('@/components/map/plot-map-drawer').then((mod) => mod.PlotMapDrawer),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '500px',
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
        Memuat GIS Polygon Drawer & Layer Spasial...
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
  const [spatialInspection, setSpatialInspection] = useState<SpatialInspectionResult | null>(null)
  const [isCopiedContext, setIsCopiedContext] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const paramLat = searchParams.get('lat')
  const paramLng = searchParams.get('lng')
  const paramRegion = searchParams.get('region')

  const targetBeaconCoords: [number, number] | null =
    paramLat && paramLng ? [parseFloat(paramLng), parseFloat(paramLat)] : null

  // Update projectId if preselectedProjectId changes
  React.useEffect(() => {
    if (preselectedProjectId && !projectId) {
      setProjectId(preselectedProjectId)
    }
  }, [preselectedProjectId])

  // Run initial spatial inspection & suggest name if navigated with coordinates
  React.useEffect(() => {
    if (targetBeaconCoords) {
      inspectSpatialPoint(targetBeaconCoords[0], targetBeaconCoords[1]).then((res) => {
        setSpatialInspection(res)
        if (!name && res?.desa) {
          setName(`Plot ${res.desa} - ${res.polaRuang || 'Blok Pemulihan'}`)
        }
      })
    }
  }, [paramLat, paramLng])

  const handlePolygonChange = (
    geojson: any,
    areaM2: number,
    inspection?: SpatialInspectionResult | null
  ) => {
    setPolygonGeoJSON(geojson)
    setCalculatedAreaM2(areaM2)
    if (inspection) {
      setSpatialInspection(inspection)
    }
  }

  // Helper to copy contextual insights to baseline description
  const handleApplyContextToDescription = () => {
    if (!spatialInspection) return

    const lines: string[] = []
    if (spatialInspection.desa && spatialInspection.kecamatan) {
      lines.push(`Terletak di Desa ${spatialInspection.desa}, Kecamatan ${spatialInspection.kecamatan}, Kabupaten Banjarnegara.`)
    }
    if (spatialInspection.polaRuang) {
      lines.push(`Zonasi Tata Ruang (RTRW): Kawasan ${spatialInspection.polaRuang}.`)
    }
    if (spatialInspection.longsor) {
      lines.push(
        `Karakteristik Risiko Bencana: Kerawanan tanah longsor kelas "${spatialInspection.longsor.kelas}" dengan estimasi dampak perlindungan ${spatialInspection.longsor.jiwaTerpapar.toLocaleString('id-ID')} jiwa penduduk.`
      )
    }
    if (spatialInspection.riwayatTerdekat) {
      lines.push(
        `Catatan Historis BPBD Terdekat: ${spatialInspection.riwayatTerdekat.title} di ${spatialInspection.riwayatTerdekat.lokasi} (~${spatialInspection.riwayatTerdekat.jarakMeter}m dari plot).`
      )
    }

    const contextText = lines.join(' ')
    setBaselineDescription((prev) => (prev ? `${prev}\n\n${contextText}` : contextText))
    setIsCopiedContext(true)
    setTimeout(() => setIsCopiedContext(false), 2500)
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

    if (spatialInspection && !spatialInspection.isInsideBanjarnegara) {
      setFormError(
        '🚫 Penanaman Dilarang di Luar Wilayah: Poligon yang Anda gambar berada di luar batas administrasi Kabupaten Banjarnegara. Program pilot REHABTRACK saat ini difokuskan khusus untuk 20 Kecamatan di Kabupaten Banjarnegara.'
      )
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

      {/* Page Title & Target Beacon Info */}
      <div>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
          Pendaftaran Plot Rehabilitasi Baru
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          Definisikan unit batas poligon spasial dan periksa otomatis zonasi pola ruang, kerawanan bencana, serta dampak perlindungan penduduk (Eco-DRR).
        </p>

        {targetBeaconCoords && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.55rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#065f46',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="radar-beacon-dot" style={{ width: '11px', height: '11px' }} />
              <span>
                <strong>Target Terpilih dari Peta:</strong>{' '}
                {paramRegion ? decodeURIComponent(paramRegion) : `Koordinat Lat: ${paramLat}, Lng: ${paramLng}`}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
              🎯 Radar Beacon Aktif di Peta
            </span>
          </div>
        )}
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

      {/* Main Grid: Form Inputs (Left) + Polygon Map & Eco-DRR Analysis (Right) */}
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
            <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Deskripsi Kondisi Baseline Lahan
              </label>

              {spatialInspection && (
                <button
                  type="button"
                  onClick={handleApplyContextToDescription}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.72rem',
                    color: 'var(--primary-700)',
                    background: 'var(--primary-50)',
                    border: '1px solid var(--primary-200)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {isCopiedContext ? <Check size={12} /> : <Copy size={12} />}
                  {isCopiedContext ? 'Insight Diterapkan!' : '+ Terapkan Insight Spasial'}
                </button>
              )}
            </div>
            <textarea
              rows={4}
              placeholder="Jelaskan kondisi awal tanah, vegetasi eksisting, riwayat degradasi lahan, atau klik '+ Terapkan Insight Spasial' di atas..."
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
                lineHeight: 1.5,
              }}
            />
          </div>
        </Card>

        {/* Right Column: Spatial Polygon Drawer & Live Eco-DRR Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Spatial Drawer Map */}
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
              targetBeacon={targetBeaconCoords}
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
                  Poligon valid terdeteksi ({polygonGeoJSON.coordinates[0].length - 1} koordinat sudut). PostGIS trigger akan mengindeks batas poligon.
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
                  Silakan klik di atas peta untuk menggambar minimal 3 titik sudut batas plot lahan. Aktifkan menu <strong>Layer Peta & Analisis</strong> untuk melihat zonasi.
                </span>
              </div>
            )}
          </Card>

          {/* Live Contextual Inspection & Eco-DRR Impact Card */}
          {spatialInspection && (
            <Card
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderColor: '#cbd5e1',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {spatialInspection.isInsideBanjarnegara ? (
                    <ShieldCheck size={18} style={{ color: 'var(--primary-600)' }} />
                  ) : (
                    <ShieldAlert size={18} style={{ color: '#dc2626' }} />
                  )}
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Hasil Analisis Kontekstual & Estimasi Dampak Eco-DRR
                  </h4>
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: spatialInspection.isInsideBanjarnegara ? '#059669' : '#dc2626',
                    background: spatialInspection.isInsideBanjarnegara ? '#ecfdf5' : '#fef2f2',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${spatialInspection.isInsideBanjarnegara ? '#a7f3d0' : '#fecaca'}`,
                  }}
                >
                  {spatialInspection.isInsideBanjarnegara ? '✅ Valid Banjarnegara' : '🚫 Di Luar Wilayah'}
                </span>
              </div>

              {/* Boundary Guard Alert Banner */}
              {!spatialInspection.isInsideBanjarnegara && (
                <div
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <ShieldAlert size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>
                      🚫 Peringatan Batas Wilayah: Di Luar Kabupaten Banjarnegara
                    </strong>
                    <span>
                      Koordinat poligon tidak berada di dalam 278 Desa Kabupaten Banjarnegara. Pendaftaran plot rehabilitasi di luar wilayah Banjarnegara dilarang pada fase pilot ini.
                    </span>
                  </div>
                </div>
              )}

              {/* Administrasi & Pola Ruang Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {/* Wilayah Administrasi */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                    Wilayah Administrasi
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                    {spatialInspection.desa ? `Desa ${spatialInspection.desa}` : 'Wilayah Banjarnegara'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {spatialInspection.kecamatan ? `Kec. ${spatialInspection.kecamatan}` : 'Kab. Banjarnegara'}
                  </span>
                </div>

                {/* Zonasi Pola Ruang (RTRW) */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                    Pola Ruang (RTRW Resmi)
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: '#15803d', display: 'block' }}>
                    {spatialInspection.polaRuang || 'Non-Kawasan Hutan / Terbuka'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Kesesuaian: Sesuai Fungsi Konservasi & Restorasi
                  </span>
                </div>
              </div>

              {/* Dasimetrik Hazard & Exposed Population Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Longsor */}
                <div
                  style={{
                    background:
                      spatialInspection.longsor?.kelas === 'Tinggi'
                        ? '#fef2f2'
                        : spatialInspection.longsor?.kelas === 'Sedang'
                        ? '#fffbeb'
                        : '#f0fdf4',
                    border:
                      spatialInspection.longsor?.kelas === 'Tinggi'
                        ? '1px solid #fecaca'
                        : spatialInspection.longsor?.kelas === 'Sedang'
                        ? '1px solid #fde68a'
                        : '1px solid #bbf7d0',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '2px' }}>
                    <AlertTriangle
                      size={14}
                      style={{
                        color:
                          spatialInspection.longsor?.kelas === 'Tinggi'
                            ? '#dc2626'
                            : spatialInspection.longsor?.kelas === 'Sedang'
                            ? '#d97706'
                            : '#16a34a',
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Bahaya Longsor
                    </span>
                  </div>
                  <strong
                    style={{
                      fontSize: '0.9rem',
                      display: 'block',
                      color:
                        spatialInspection.longsor?.kelas === 'Tinggi'
                          ? '#991b1b'
                          : spatialInspection.longsor?.kelas === 'Sedang'
                          ? '#92400e'
                          : '#166534',
                    }}
                  >
                    Kelas: {spatialInspection.longsor?.kelas || 'Aman / Rendah'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    👥 Estimasi Terlindungi: <strong>{spatialInspection.longsor?.jiwaTerpapar ? spatialInspection.longsor.jiwaTerpapar.toLocaleString('id-ID') : '0'} Jiwa</strong>
                  </span>
                </div>

                {/* Banjir */}
                <div
                  style={{
                    background: spatialInspection.banjir ? '#eff6ff' : '#f8fafc',
                    border: spatialInspection.banjir ? '1px solid #bfdbfe' : '1px solid var(--border-subtle)',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '2px' }}>
                    <Waves size={14} style={{ color: spatialInspection.banjir ? '#2563eb' : '#64748b' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Bahaya Banjir
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.9rem', display: 'block', color: spatialInspection.banjir ? '#1d4ed8' : '#475569' }}>
                    Kelas: {spatialInspection.banjir?.kelas || 'Aman (Non-Genangan)'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    👥 Estimasi Terlindungi: <strong>{spatialInspection.banjir?.jiwaTerpapar ? spatialInspection.banjir.jiwaTerpapar.toLocaleString('id-ID') : '0'} Jiwa</strong>
                  </span>
                </div>
              </div>

              {/* Riwayat Longsor Terdekat BPBD */}
              {spatialInspection.riwayatTerdekat && (
                <div
                  style={{
                    background: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#7e22ce', fontSize: '0.72rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <History size={13} />
                      Riwayat Bencana BPBD Terdekat
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9333ea', background: '#f3e8ff', padding: '1px 5px', borderRadius: '3px' }}>
                      ~{spatialInspection.riwayatTerdekat.jarakMeter.toLocaleString('id-ID')} meter dari plot
                    </span>
                  </div>
                  <div style={{ color: '#334155', fontSize: '0.8rem' }}>
                    {spatialInspection.riwayatTerdekat.title} &bull; {spatialInspection.riwayatTerdekat.lokasi} ({spatialInspection.riwayatTerdekat.waktu})
                  </div>
                </div>
              )}
            </Card>
          )}
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
