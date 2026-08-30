'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useMonitoring } from '@/hooks/use-monitoring'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { formatBytes } from '@/lib/image-compress'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trees,
  User,
  Image as ImageIcon,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Maximize2,
  X,
} from 'lucide-react'

const GPSPicker = dynamic(
  () => import('@/components/monitoring/gps-picker').then((mod) => mod.GPSPicker),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          color: '#64748b',
        }}
      >
        Memuat Peta Lokasi...
      </div>
    ),
  }
)

export default function MonitoringDetailPage() {
  const params = useParams()
  const monitoringId = params?.id as string
  const { data: monitoring, isLoading, error } = useMonitoring(monitoringId)
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null)

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
        Memuat laporan pengamatan lapangan...
      </div>
    )
  }

  if (error || !monitoring) {
    return (
      <Card style={{ borderColor: 'var(--status-at-risk)', background: 'var(--status-at-risk-bg)' }}>
        <h3 style={{ color: 'var(--status-at-risk)', marginBottom: '0.5rem' }}>Laporan Tidak Ditemukan</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Data pengamatan lapangan ini mungkin telah dihapus atau Anda tidak memiliki akses.
        </p>
        <Link href="/monitoring">
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={16} />}>
            Kembali ke Daftar Monitoring
          </Button>
        </Link>
      </Card>
    )
  }

  const survivalPct =
    monitoring.survival_rate !== null && monitoring.survival_rate !== undefined
      ? Math.round(Number(monitoring.survival_rate))
      : null

  const totalObserved =
    monitoring.healthy_count +
    monitoring.stressed_count +
    monitoring.dead_count +
    monitoring.missing_count

  // Coordinates from GeoJSON Point
  const coords = monitoring.geom?.coordinates as [number, number] | undefined
  const photos = monitoring.photos || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Back Link */}
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

        {monitoring.plot && (
          <Link href={`/plots/${monitoring.plot.id}`}>
            <Button variant="secondary" size="sm">
              Lihat Detail Plot
            </Button>
          </Link>
        )}
      </div>

      {/* Report Header Banner */}
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
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-100)',
                  color: 'var(--primary-800)',
                }}
              >
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {new Date(monitoring.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>

              {monitoring.plot && (
                <StatusBadge status={(monitoring.plot as any).monitoring_status || 'MONITORING'} />
              )}
            </div>

            <h1 style={{ fontSize: '1.65rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              Laporan Pemantauan: {monitoring.plot?.name || 'Plot Lapangan'}
            </h1>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {monitoring.plot?.project && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Trees size={15} style={{ color: 'var(--primary-600)' }} />
                  <span>Proyek: <strong>{monitoring.plot.project.name}</strong></span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={15} style={{ color: 'var(--primary-600)' }} />
                <span>Observer: <strong>{monitoring.observer?.name || 'Petugas'}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ImageIcon size={15} style={{ color: 'var(--accent-indigo)' }} />
                <span>{photos.length} Foto Dokumentasi</span>
              </div>
            </div>
          </div>

          {/* Survival Rate Hero Badge */}
          {survivalPct !== null && (
            <div
              style={{
                textAlign: 'center',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                background: survivalPct >= 70 ? 'var(--status-recovering-bg)' : 'var(--status-at-risk-bg)',
                border: `1px solid ${survivalPct >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)'}`,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                Tingkat Kelangsungan Hidup
              </span>
              <strong style={{ fontSize: '2rem', color: survivalPct >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)' }}>
                {survivalPct}%
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                {monitoring.healthy_count} dari {totalObserved} bibit sehat
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Data Breakdown (Left) + GPS Map (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left: Tree Health & Growth Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Tree Health Counts */}
          <Card>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.875rem 0', color: 'var(--text-primary)' }}>
              Hasil Perhitungan Bibit & Pohon
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600, display: 'block' }}>
                  Pohon Sehat (Healthy)
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#16a34a' }}>{monitoring.healthy_count} btg</strong>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, display: 'block' }}>
                  Pohon Stres / Sakit (Stressed)
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#ea580c' }}>{monitoring.stressed_count} btg</strong>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600, display: 'block' }}>
                  Pohon Mati (Dead)
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#dc2626' }}>{monitoring.dead_count} btg</strong>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block' }}>
                  Pohon Hilang (Missing)
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#64748b' }}>{monitoring.missing_count} btg</strong>
              </div>
            </div>
          </Card>

          {/* Growth Metrics */}
          <Card>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.875rem 0', color: 'var(--text-primary)' }}>
              Metrik Pertumbuhan Vegetasi
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-surface-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Rata-rata Tinggi</span>
                <strong style={{ fontSize: '1.15rem' }}>{monitoring.avg_height_cm ? `${monitoring.avg_height_cm} cm` : '-'}</strong>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-surface-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Diameter Batang</span>
                <strong style={{ fontSize: '1.15rem' }}>{monitoring.avg_diameter_cm ? `${monitoring.avg_diameter_cm} cm` : '-'}</strong>
              </div>

              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-surface-subtle)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Tutupan Kanopi</span>
                <strong style={{ fontSize: '1.15rem' }}>{monitoring.canopy_cover_pct ? `${monitoring.canopy_cover_pct}%` : '-'}</strong>
              </div>
            </div>

            {monitoring.notes && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Catatan Naratif Pengamatan:
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {monitoring.notes}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right: GPS Location Map */}
        <Card style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="flex-between">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={16} style={{ color: 'var(--primary-600)' }} />
              Titik GPS Pengamatan Lapangan
            </span>
            {coords && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {coords[1]}, {coords[0]}
              </span>
            )}
          </div>

          <GPSPicker
            coordinates={coords || null}
            onCoordinatesChange={() => {}}
            plotPolygon={(monitoring.plot as any)?.geom}
            plotName={monitoring.plot?.name}
            height="320px"
          />
        </Card>
      </div>

      {/* Photo Gallery Section */}
      <Card>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
              Foto Dokumentasi Lapangan ({photos.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Dokumentasi visual geotagged terkompresi otomatis di sisi klien.
            </p>
          </div>
        </div>

        {photos.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                style={{
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Image */}
                <div
                  style={{
                    position: 'relative',
                    height: '180px',
                    background: '#0f172a',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedPhotoModal(photo.url)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Foto monitoring ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {photo.file_size_bytes && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {formatBytes(photo.file_size_bytes)} (Optimized)
                    </div>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: '#ffffff',
                      padding: '4px',
                      borderRadius: '4px',
                    }}
                  >
                    <Maximize2 size={14} />
                  </div>
                </div>

                {/* Caption */}
                {photo.caption && (
                  <div style={{ padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Tidak ada foto yang dilampirkan pada laporan ini.
          </div>
        )}
      </Card>

      {/* Fullscreen Lightbox Modal */}
      {selectedPhotoModal && (
        <div
          onClick={() => setSelectedPhotoModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setSelectedPhotoModal(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={24} />
          </button>

          <img
            src={selectedPhotoModal}
            alt="Fullscreen Foto Monitoring"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
