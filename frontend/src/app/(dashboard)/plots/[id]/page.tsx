'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePlot } from '@/hooks/use-plots'
import { useInterventions, usePlantingEvents } from '@/hooks/use-interventions'
import { NewInterventionModal } from '@/components/interventions/new-intervention-modal'
import { NewPlantingModal } from '@/components/interventions/new-planting-modal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  REHABILITATION_TYPE_LABELS,
  INTERVENTION_TYPE_LABELS,
  MONITORING_STATUS_CONFIG,
} from '@/lib/constants'
import {
  inspectSpatialPoint,
  type SpatialInspectionResult,
} from '@/lib/map/spatial-inspector'
import {
  ArrowLeft,
  MapPin,
  Trees,
  Calendar,
  Layers,
  Activity,
  Plus,
  ClipboardCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Waves,
  TreePine,
  History,
  Sprout,
  Wrench,
  Satellite,
} from 'lucide-react'
import { PlotSatelliteTab } from '@/components/plots/plot-satellite-tab'

const PlotMapView = dynamic(
  () => import('@/components/map/plot-map-view').then((mod) => mod.PlotMapView),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '420px',
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
        Memuat Peta Poligon Plot...
      </div>
    ),
  }
)

export default function PlotDetailPage() {
  const params = useParams()
  const plotId = params?.id as string
  const { data: plot, isLoading, error } = usePlot(plotId)
  const { data: interventions = [] } = useInterventions(plotId)
  const { data: plantings = [] } = usePlantingEvents(plotId)

  const [activeTab, setActiveTab] = useState<'monitoring' | 'satellite' | 'interventions' | 'plantings'>('monitoring')
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false)
  const [isPlantingModalOpen, setIsPlantingModalOpen] = useState(false)
  const [spatialProfile, setSpatialProfile] = useState<SpatialInspectionResult | null>(null)

  // Calculate spatial profile for the plot polygon centroid
  React.useEffect(() => {
    if (!plot?.geom) return
    let geom = plot.geom
    if (typeof geom === 'string') {
      try {
        geom = JSON.parse(geom)
      } catch {
        return
      }
    }
    const coords = geom.coordinates?.[0]
    if (coords && coords.length > 0) {
      let sumLng = 0
      let sumLat = 0
      for (const pt of coords) {
        sumLng += pt[0]
        sumLat += pt[1]
      }
      const centroidLng = sumLng / coords.length
      const centroidLat = sumLat / coords.length
      inspectSpatialPoint(centroidLng, centroidLat).then((res) => {
        setSpatialProfile(res)
      })
    }
  }, [plot?.geom])

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
        Memuat data plot dan geometri spasial...
      </div>
    )
  }

  if (error || !plot) {
    return (
      <Card style={{ borderColor: 'var(--status-at-risk)', background: 'var(--status-at-risk-bg)' }}>
        <h3 style={{ color: 'var(--status-at-risk)', marginBottom: '0.5rem' }}>Plot Tidak Ditemukan</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Plot ini mungkin telah dihapus atau Anda belum memiliki izin akses untuk melihat plot ini.
        </p>
        <Link href="/plots">
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={16} />}>
            Kembali ke Daftar Plot
          </Button>
        </Link>
      </Card>
    )
  }

  const areaHa = ((Number(plot.area_m2) || 0) / 10000).toFixed(2)
  const monitorings = (plot as any).field_monitorings || []

  // Latest monitoring stats
  const latestMonitoring = monitorings.length > 0 ? monitorings[0] : null
  const latestSurvivalRate = latestMonitoring?.survival_rate !== null && latestMonitoring?.survival_rate !== undefined
    ? Math.round(latestMonitoring.survival_rate * 100)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Breadcrumb & Action Bar */}
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

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPlantingModalOpen(true)}
            icon={<Sprout size={15} />}
          >
            Catat Penanaman
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsInterventionModalOpen(true)}
            icon={<Wrench size={15} />}
          >
            Catat Intervensi
          </Button>

          <Link href={`/monitoring/new?plotId=${plot.id}`}>
            <Button variant="primary" size="sm" icon={<ClipboardCheck size={15} />}>
              Input Monitoring
            </Button>
          </Link>
        </div>
      </div>

      {/* Plot Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
          borderColor: 'var(--primary-200)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <StatusBadge status={plot.monitoring_status} />
              <Badge variant="default">
                {REHABILITATION_TYPE_LABELS[plot.rehabilitation_type] || plot.rehabilitation_type}
              </Badge>
            </div>

            <h1 style={{ fontSize: '1.65rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              {plot.name}
            </h1>

            {plot.project && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Trees size={15} style={{ color: 'var(--primary-600)' }} />
                <span>Proyek: </span>
                <Link
                  href={`/projects/${plot.project.id}`}
                  style={{ color: 'var(--primary-700)', fontWeight: 600 }}
                >
                  {plot.project.name}
                </Link>
                <span>&bull; {plot.project.location_name}, {plot.project.province}</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Badge Group */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                Luas Plot
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                {areaHa} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ha</span>
              </strong>
            </div>

            <div
              style={{
                background: '#ffffff',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                Target Pohon
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--primary-700)' }}>
                {plot.target_plants ? plot.target_plants.toLocaleString('id-ID') : '-'} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>btg</span>
              </strong>
            </div>

            {latestSurvivalRate !== null && (
              <div
                style={{
                  background: '#ffffff',
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Tingkat Hidup
                </span>
                <strong style={{ fontSize: '1.25rem', color: latestSurvivalRate >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)' }}>
                  {latestSurvivalRate}%
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Spatial Map Viewer + Baseline Metadata */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Spatial Polygon Map */}
        <Card style={{ padding: '0.5rem', background: '#ffffff', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem 0.75rem 0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={16} style={{ color: 'var(--primary-600)' }} />
              Batas Poligon Spasial (PostGIS SRID 4326)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {Math.round(Number(plot.area_m2) || 0).toLocaleString('id-ID')} m²
            </span>
          </div>

          <PlotMapView
            plots={[plot as any]}
            height="440px"
          />
        </Card>

        {/* Right Column: Baseline Information & Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.875rem 0', color: 'var(--text-primary)' }}>
              Informasi Baseline Lahan
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tanggal Baseline</span>
                <strong>
                  {new Date(plot.baseline_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Jenis Restorasi</span>
                <strong>
                  {REHABILITATION_TYPE_LABELS[plot.rehabilitation_type] || plot.rehabilitation_type}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status Pemulihan</span>
                <StatusBadge status={plot.monitoring_status} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Tanaman</span>
                <strong>{plot.target_plants ? `${plot.target_plants.toLocaleString('id-ID')} batang` : 'Belum ditentukan'}</strong>
              </div>
            </div>

            {plot.baseline_description && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Deskripsi Kondisi Awal:
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {plot.baseline_description}
                </p>
              </div>
            )}
          </Card>

          {/* Contextual Spatial & Eco-DRR Profile Card */}
          {spatialProfile && (
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
                  <ShieldCheck size={18} style={{ color: 'var(--primary-600)' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Konteks Spasial & Dampak Eco-DRR
                  </h4>
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#059669',
                    background: '#ecfdf5',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  PostGIS Analisis
                </span>
              </div>

              {/* Grid 1: Wilayah & RTRW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                <div
                  style={{
                    background: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Wilayah Administrasi
                  </span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>
                    {spatialProfile.desa ? `Desa ${spatialProfile.desa}` : 'Banjarnegara'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {spatialProfile.kecamatan ? `Kec. ${spatialProfile.kecamatan}` : 'Kab. Banjarnegara'}
                  </span>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Pola Ruang (RTRW)
                  </span>
                  <strong style={{ fontSize: '0.85rem', color: '#15803d', display: 'block', marginTop: '2px' }}>
                    {spatialProfile.polaRuang || 'Kawasan Non-Hutan'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Zonasi Peruntukan Lahan
                  </span>
                </div>
              </div>

              {/* Grid 2: Dasimetrik Hazard & Exposed Population */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                <div
                  style={{
                    background:
                      spatialProfile.longsor?.kelas === 'Tinggi'
                        ? '#fef2f2'
                        : spatialProfile.longsor?.kelas === 'Sedang'
                        ? '#fffbeb'
                        : '#f0fdf4',
                    border:
                      spatialProfile.longsor?.kelas === 'Tinggi'
                        ? '1px solid #fecaca'
                        : spatialProfile.longsor?.kelas === 'Sedang'
                        ? '1px solid #fde68a'
                        : '1px solid #bbf7d0',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2px' }}>
                    <AlertTriangle
                      size={13}
                      style={{
                        color:
                          spatialProfile.longsor?.kelas === 'Tinggi'
                            ? '#dc2626'
                            : spatialProfile.longsor?.kelas === 'Sedang'
                            ? '#d97706'
                            : '#16a34a',
                      }}
                    />
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Bahaya Longsor
                    </span>
                  </div>
                  <strong
                    style={{
                      fontSize: '0.85rem',
                      display: 'block',
                      color:
                        spatialProfile.longsor?.kelas === 'Tinggi'
                          ? '#991b1b'
                          : spatialProfile.longsor?.kelas === 'Sedang'
                          ? '#92400e'
                          : '#166534',
                    }}
                  >
                    Kelas: {spatialProfile.longsor?.kelas || 'Aman / Rendah'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    👥 Dampak: <strong>{spatialProfile.longsor?.jiwaTerpapar ? spatialProfile.longsor.jiwaTerpapar.toLocaleString('id-ID') : '0'} Jiwa</strong>
                  </span>
                </div>

                <div
                  style={{
                    background: spatialProfile.banjir ? '#eff6ff' : '#f8fafc',
                    border: spatialProfile.banjir ? '1px solid #bfdbfe' : '1px solid var(--border-subtle)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2px' }}>
                    <Waves size={13} style={{ color: spatialProfile.banjir ? '#2563eb' : '#64748b' }} />
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Bahaya Banjir
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.85rem', display: 'block', color: spatialProfile.banjir ? '#1d4ed8' : '#475569' }}>
                    Kelas: {spatialProfile.banjir?.kelas || 'Aman'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    👥 Dampak: <strong>{spatialProfile.banjir?.jiwaTerpapar ? spatialProfile.banjir.jiwaTerpapar.toLocaleString('id-ID') : '0'} Jiwa</strong>
                  </span>
                </div>
              </div>

              {/* Riwayat BPBD */}
              {spatialProfile.riwayatTerdekat && (
                <div
                  style={{
                    background: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#7e22ce', fontSize: '0.68rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <History size={12} />
                      Riwayat Bencana Terdekat BPBD
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9333ea', background: '#f3e8ff', padding: '1px 4px', borderRadius: '3px' }}>
                      ~{spatialProfile.riwayatTerdekat.jarakMeter.toLocaleString('id-ID')} m
                    </span>
                  </div>
                  <div style={{ color: '#334155' }}>
                    {spatialProfile.riwayatTerdekat.title} &bull; {spatialProfile.riwayatTerdekat.lokasi} ({spatialProfile.riwayatTerdekat.waktu})
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Quick Action CTA Card */}
          <Card
            style={{
              background: 'linear-gradient(135deg, var(--primary-50), #f0fdf4)',
              borderColor: 'var(--primary-200)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <History size={16} style={{ color: 'var(--primary-700)' }} />
              <strong style={{ fontSize: '0.875rem', color: 'var(--primary-800)' }}>
                Aksi & Pemeliharaan Berkelanjutan
              </strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
              Catat penyulaman bibit, pemupukan, penyiraman berkala, serta pemantauan lapangan untuk plot ini.
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" size="sm" onClick={() => setIsPlantingModalOpen(true)} icon={<Sprout size={13} />}>
                Penanaman
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsInterventionModalOpen(true)} icon={<Wrench size={13} />}>
                Intervensi
              </Button>
              <Link href={`/monitoring/new?plotId=${plot.id}`}>
                <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                  Monitoring
                </Button>
              </Link>
            </div>
          </Card>
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
          onClick={() => setActiveTab('monitoring')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'monitoring' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'monitoring' ? 'var(--primary-700)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Riwayat Monitoring ({monitorings.length})
        </button>

        <button
          onClick={() => setActiveTab('satellite')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'satellite' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'satellite' ? 'var(--primary-700)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Satellite size={15} />
          Analisis Satelit (GEE)
        </button>

        <button
          onClick={() => setActiveTab('interventions')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'interventions' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'interventions' ? 'var(--primary-700)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Tindakan Intervensi ({interventions.length})
        </button>

        <button
          onClick={() => setActiveTab('plantings')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'plantings' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'plantings' ? 'var(--primary-700)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Event Penanaman ({plantings.length})
        </button>
      </div>

      {/* TAB: SATELLITE GEE ANALYSIS */}
      {activeTab === 'satellite' && (
        <PlotSatelliteTab
          plotId={plot.id}
          plotName={plot.name}
          polygonGeoJSON={plot.geom}
          fieldMonitorings={monitorings}
          baselineDate={plot.baseline_date}
          plantingDate={(plot as any).planting_date || plot.baseline_date}
          interventions={interventions}
        />
      )}

      {/* TAB 1: FIELD MONITORINGS */}
      {activeTab === 'monitoring' && (
        <Card>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Riwayat Pemantauan Lapangan ({monitorings.length})</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Pengamatan survival rate dan pertumbuhan bibit secara berkala.
              </p>
            </div>

            <Link href={`/monitoring/new?plotId=${plot.id}`}>
              <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                Input Data
              </Button>
            </Link>
          </div>

          {monitorings.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Tanggal Pengamatan</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Petugas / Observer</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Tingkat Hidup</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Kondisi Tanaman (Sehat/Sakit/Mati)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Rata-rata Tinggi</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Tutupan Kanopi</th>
                  </tr>
                </thead>
                <tbody>
                  {monitorings.map((m: any) => {
                    const survivalPct = m.survival_rate !== null ? `${Math.round(m.survival_rate * 100)}%` : '-'

                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                          <Link href={`/monitoring/${m.id}`} style={{ color: 'inherit' }}>
                            {new Date(m.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </Link>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {m.observer?.name || 'Petugas Lapangan'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: (m.survival_rate || 0) >= 0.7 ? 'var(--status-recovering)' : 'var(--status-at-risk)' }}>
                          {survivalPct}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>{m.healthy_count || 0}</span> /{' '}
                          <span style={{ color: '#ea580c' }}>{m.stressed_count || 0}</span> /{' '}
                          <span style={{ color: '#dc2626' }}>{m.dead_count || 0}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                          {m.avg_height_cm ? `${m.avg_height_cm} cm` : '-'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                          {m.canopy_cover_pct ? `${m.canopy_cover_pct}%` : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Belum Ada Data Monitoring Lapangan"
              description="Lakukan pemantauan pertama untuk mulai mencatat tingkat kelangsungan hidup (survival rate) dan pertumbuhan bibit."
              action={
                <Link href={`/monitoring/new?plotId=${plot.id}`}>
                  <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                    Input Monitoring Pertama
                  </Button>
                </Link>
              }
            />
          )}
        </Card>
      )}

      {/* TAB 2: INTERVENTIONS */}
      {activeTab === 'interventions' && (
        <Card>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Tindakan Intervensi Lahan ({interventions.length})</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Catatan penyulaman bibit, pemupukan, penyiraman, dan pemeliharaan lanjutan.
              </p>
            </div>

            <Button variant="primary" size="sm" onClick={() => setIsInterventionModalOpen(true)} icon={<Plus size={14} />}>
              Catat Intervensi Baru
            </Button>
          </div>

          {interventions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Tanggal</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Jenis Tindakan</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Kuantitas</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Rincian Deskripsi</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Pelaksana</th>
                  </tr>
                </thead>
                <tbody>
                  {interventions.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {new Date(inv.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'var(--primary-50)',
                            color: 'var(--primary-800)',
                            border: '1px solid var(--primary-200)',
                          }}
                        >
                          {INTERVENTION_TYPE_LABELS[inv.type] || inv.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        {inv.quantity ? `${inv.quantity.toLocaleString('id-ID')} unit` : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {inv.description}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        {inv.created_by_user?.name || 'Petugas'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Belum Ada Tindakan Intervensi"
              description="Catat tindakan perawatan lahan seperti penyulaman bibit atau pemupukan berkala."
              action={
                <Button variant="primary" size="sm" onClick={() => setIsInterventionModalOpen(true)} icon={<Plus size={14} />}>
                  Catat Intervensi Pertama
                </Button>
              }
            />
          )}
        </Card>
      )}

      {/* TAB 3: PLANTING EVENTS */}
      {activeTab === 'plantings' && (
        <Card>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Event Penanaman Bibit ({plantings.length})</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Arsip bibit yang telah ditanam di dalam plot ini beserta spesies tanamannya.
              </p>
            </div>

            <Button variant="primary" size="sm" onClick={() => setIsPlantingModalOpen(true)} icon={<Plus size={14} />}>
              Catat Penanaman Baru
            </Button>
          </div>

          {plantings.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Tanggal Tanam</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Spesies Bibit</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Jumlah Bibit</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {plantings.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {new Date(p.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong>{p.species?.common_name || 'Spesies Tanaman'}</strong>
                        {p.species?.scientific_name && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            <em>{p.species.scientific_name}</em>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#16a34a' }}>
                        {p.quantity.toLocaleString('id-ID')} batang
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                        {p.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Belum Ada Catatan Penanaman"
              description="Catat jenis dan jumlah bibit pohon yang ditanam di dalam plot ini."
              action={
                <Button variant="primary" size="sm" onClick={() => setIsPlantingModalOpen(true)} icon={<Plus size={14} />}>
                  Catat Penanaman Pertama
                </Button>
              }
            />
          )}
        </Card>
      )}

      {/* Modals */}
      <NewInterventionModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        defaultPlotId={plot.id}
      />

      <NewPlantingModal
        isOpen={isPlantingModalOpen}
        onClose={() => setIsPlantingModalOpen(false)}
        defaultPlotId={plot.id}
      />
    </div>
  )
}
