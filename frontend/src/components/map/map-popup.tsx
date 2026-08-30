'use client'

import React from 'react'
import { AlertTriangle, MapPin, Calendar, Activity, Info, ShieldAlert } from 'lucide-react'

export interface PopupData {
  layerId: string
  coordinates: [number, number]
  properties: Record<string, any>
}

export function MapPopupContent({ data }: { data: PopupData }) {
  const { layerId, properties } = data

  if (layerId === 'layer-riwayat-longsor-points') {
    return (
      <div style={{ padding: '0.875rem', maxWidth: '300px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)', borderBottom: '1px solid var(--status-at-risk-bg)', paddingBottom: '0.5rem' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{properties.title || 'Kejadian Tanah Longsor'}</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tahun {properties.tahun}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
          {properties.desa_kecamatan && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
              <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Lokasi:</strong> {properties.desa_kecamatan} {properties.dusun_rt_rw && `(${properties.dusun_rt_rw})`}</span>
            </div>
          )}

          {properties.waktu && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
              <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Waktu:</strong> {properties.waktu}</span>
            </div>
          )}

          {properties.kronologi && (
            <div style={{ background: 'var(--bg-surface-subtle)', padding: '0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', marginTop: '0.25rem' }}>
              <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--text-primary)' }}>Kronologi:</strong>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{properties.kronologi}</p>
            </div>
          )}

          {properties.dampak_bangunan && (
            <div style={{ color: 'var(--accent-rose)', background: 'var(--status-at-risk-bg)', padding: '0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Dampak Fisik:</strong>
              <p style={{ margin: 0, lineHeight: 1.3 }}>{properties.dampak_bangunan}</p>
            </div>
          )}

          {properties.penanganan && (
            <div style={{ color: 'var(--primary-700)', background: 'var(--primary-50)', padding: '0.5rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--primary-200)' }}>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Tindakan BPBD:</strong>
              <p style={{ margin: 0, lineHeight: 1.3 }}>{properties.penanganan}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (layerId.startsWith('layer-rawan-')) {
    const hazardType = layerId.replace('layer-rawan-', '').replace('-fill', '').toUpperCase()
    const riskLevel = properties.Keterangan || 'Sedang'
    const isHigh = riskLevel === 'Tinggi'

    return (
      <div style={{ padding: '0.875rem', maxWidth: '280px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <AlertTriangle size={18} style={{ color: isHigh ? 'var(--accent-rose)' : 'var(--accent-amber)', flexShrink: 0 }} />
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>Kawasan Rawan {hazardType}</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tingkat Risiko:</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.7rem',
                background: isHigh ? 'var(--status-at-risk-bg)' : 'var(--status-monitoring-bg)',
                color: isHigh ? 'var(--status-at-risk)' : 'var(--status-monitoring)',
                border: `1px solid ${isHigh ? 'rgba(225, 29, 72, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`,
              }}
            >
              {riskLevel}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0 0', fontSize: '0.7rem', lineHeight: 1.35 }}>
            Area ini masuk zona pemantauan risiko rehabilitasi lahan berdasarkan data BPBD Banjarnegara.
          </p>
        </div>
      </div>
    )
  }

  if (layerId === 'layer-pola-ruang-fill') {
    return (
      <div style={{ padding: '0.875rem', maxWidth: '280px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', color: 'var(--primary-700)' }}>
          <Activity size={18} style={{ flexShrink: 0 }} />
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>Pola Ruang Wilayah</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Kategori Ruang:</span>
            <strong style={{ color: 'var(--primary-900)' }}>{properties.POLA_RUANG || 'N/A'}</strong>
          </div>
          {properties.PL_CONVERT && properties.PL_CONVERT !== properties.POLA_RUANG && (
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Konversi Lahan:</span>
              <span style={{ color: 'var(--text-secondary)' }}>{properties.PL_CONVERT}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (layerId.includes('kecamatan')) {
    return (
      <div style={{ padding: '0.75rem', maxWidth: '260px', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          <MapPin size={16} style={{ color: '#059669', flexShrink: 0 }} />
          <span>Kecamatan {properties.KECAMATAN || 'N/A'}</span>
        </div>
        <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          Kabupaten Banjarnegara, Jawa Tengah
        </p>
      </div>
    )
  }

  if (layerId.includes('desa')) {
    return (
      <div style={{ padding: '0.75rem', maxWidth: '260px', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          <MapPin size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
          <span>Desa / Kel. {properties.DESA || 'N/A'}</span>
        </div>
        {properties.KECAMATAN ? (
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Kecamatan {properties.KECAMATAN}, Kab. Banjarnegara
          </p>
        ) : (
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Kabupaten Banjarnegara, Jawa Tengah
          </p>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '0.75rem', maxWidth: '260px', fontSize: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
        <Info size={14} style={{ color: 'var(--text-muted)' }} />
        <span>Informasi Fitur</span>
      </div>
      <pre style={{ fontSize: '0.65rem', background: 'var(--bg-surface-subtle)', padding: '0.35rem', borderRadius: '4px', marginTop: '0.35rem', overflow: 'auto', maxHeight: '120px' }}>
        {JSON.stringify(properties, null, 2)}
      </pre>
    </div>
  )
}
