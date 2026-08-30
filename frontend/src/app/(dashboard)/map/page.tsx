'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import {
  MapPin,
  Trees,
  Compass,
  Layers,
  Sparkles,
  Copy,
  Check,
  Building2,
  TreePine,
  AlertTriangle,
  Users,
  Waves,
} from 'lucide-react'

const BaseMap = dynamic(
  () => import('@/components/map/base-map').then((mod) => mod.BaseMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '620px',
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
        Memuat GIS Map Engine...
      </div>
    ),
  }
)

export default function MapExplorerPage() {
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyCoords = () => {
    if (!selectedCoords) return
    const text = `${selectedCoords[1]}, ${selectedCoords[0]}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Spatial Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
              <Compass size={20} />
            </span>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
              GIS Map Explorer & Analisis Wilayah
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Visualisasi spasial batas administrasi, zonasi Pola Ruang (RTRW), kerawanan bencana, dan dampak dasimetrik penduduk terpapar di Banjarnegara.
          </p>
        </div>

        {/* Spatial Info Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {selectedCoords && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                color: 'var(--primary-800)',
              }}
            >
              <MapPin size={14} style={{ color: 'var(--primary-600)' }} />
              <span>{selectedCoords[1]}, {selectedCoords[0]}</span>
              <button
                onClick={handleCopyCoords}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--primary-700)',
                }}
                title="Salin Koordinat (Lat, Lng)"
              >
                {copied ? <Check size={13} style={{ color: '#16a34a' }} /> : <Copy size={13} />}
              </button>
            </div>
          )}

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <Users size={14} style={{ color: '#dc2626' }} />
            <span>374k Jiwa Terpapar Longsor</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <Building2 size={14} style={{ color: '#d97706' }} />
            <span>Kab. Banjarnegara</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <Layers size={14} style={{ color: 'var(--primary-600)' }} />
            <span>Leaflet SVG Engine</span>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <Card style={{ padding: '0.5rem', background: '#ffffff', overflow: 'hidden' }}>
        <BaseMap
          height="640px"
          onMapClick={(coords) => setSelectedCoords(coords)}
          initialShowKecamatan={true}
          initialShowDesa={false}
        />
      </Card>

      {/* Thematic Spatial Insights & Guidance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <Users size={16} />
            <span>Dampak Bencana Dasimetrik (Eco-DRR)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
            Korelasi sebaran pemukiman & lereng bahaya longsor (7.747 zona). Menampilkan estimasi jumlah <strong>penduduk/jiwa yang terlindungi</strong> oleh aksi restorasi vegetasi pohon di sekitar plot.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
            <span>Total 374k Jiwa Terpapar</span>
            <strong style={{ color: '#991b1b' }}>Proteksi Pemukiman</strong>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <TreePine size={16} />
            <span>Pola Ruang (RTRW Banjarnegara)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
            14 klasifikasi zonasi tata ruang resmi (Hutan Lindung, Hutan Produksi, Kawasan Lindung Bawahannya, Sempadan Sungai, dll) untuk memvalidasi legalitas & kesesuaian plot pemulihan.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
            <span>Aktivasi via Layer Panel</span>
            <strong style={{ color: '#15803d' }}>Zonasi Legal</strong>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9333ea', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <MapPin size={16} />
            <span>Riwayat Kejadian BPBD (244 Titik)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
            Sebaran 244 titik empiris kejadian tanah longsor yang tercatat oleh BPBD Banjarnegara (2022–2026), lengkap dengan catatan waktu, dusun/desa, dan dampak fisik.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
            <span>Pusdalops BPBD Data</span>
            <strong style={{ color: '#9333ea' }}>Bukti Empiris</strong>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1d4ed8', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <Waves size={16} />
            <span>Dampak Bahaya Banjir Dasimetrik</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
            591 zona risiko genangan banjir di sepanjang bantaran sungai Banjarnegara dengan data penduduk terpapar untuk mendukung restorasi sempadan sungai (<em>riparian buffer</em>).
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
            <span>Riparian Buffer Zone</span>
            <strong style={{ color: '#1d4ed8' }}>Konservasi Sungai</strong>
          </div>
        </Card>
      </div>
    </div>
  )
}
