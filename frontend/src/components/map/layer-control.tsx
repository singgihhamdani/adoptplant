'use client'

import React, { useState } from 'react'
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
  EyeOff,
  TreePine,
  AlertTriangle,
  MapPin,
  Waves,
} from 'lucide-react'
import { BASEMAP_STYLES } from '@/lib/map/config'

export interface LayerControlProps {
  currentBasemap: string
  onSelectBasemap: (basemapId: string) => void
  showKecamatan?: boolean
  onToggleKecamatan?: (visible: boolean) => void
  showDesa?: boolean
  onToggleDesa?: (visible: boolean) => void
  showPolaRuang?: boolean
  onTogglePolaRuang?: (visible: boolean) => void
  showDasimetrikLongsor?: boolean
  onToggleDasimetrikLongsor?: (visible: boolean) => void
  showDasimetrikBanjir?: boolean
  onToggleDasimetrikBanjir?: (visible: boolean) => void
  showRiwayatLongsor?: boolean
  onToggleRiwayatLongsor?: (visible: boolean) => void
  isLoadingThematic?: string | null
}

export function LayerControl({
  currentBasemap,
  onSelectBasemap,
  showKecamatan = true,
  onToggleKecamatan,
  showDesa = false,
  onToggleDesa,
  showPolaRuang = false,
  onTogglePolaRuang,
  showDasimetrikLongsor = false,
  onToggleDasimetrikLongsor,
  showDasimetrikBanjir = false,
  onToggleDasimetrikBanjir,
  showRiwayatLongsor = false,
  onToggleRiwayatLongsor,
  isLoadingThematic = null,
}: LayerControlProps) {
  const [isOpen, setIsOpen] = useState(true)

  const hasThematic =
    onTogglePolaRuang ||
    onToggleDasimetrikLongsor ||
    onToggleDasimetrikBanjir ||
    onToggleRiwayatLongsor

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        overflow: 'hidden',
        width: '285px',
        fontFamily: 'inherit',
        maxHeight: 'calc(100% - 24px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.625rem 0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: '#fafbfc',
          borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={16} style={{ color: 'var(--primary-600)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            Layer Peta & Analisis
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {/* Body */}
      {isOpen && (
        <div
          style={{
            padding: '0.625rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            overflowY: 'auto',
          }}
        >
          {/* Section 1: Batas Administrasi Banjarnegara */}
          <div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.4rem',
                letterSpacing: '0.5px',
              }}
            >
              Batas Administrasi Banjarnegara
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {/* Kecamatan Toggle */}
              {onToggleKecamatan && (
                <div
                  onClick={() => onToggleKecamatan(!showKecamatan)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: showKecamatan ? '#fffbeb' : 'var(--bg-surface-subtle)',
                    border: showKecamatan ? '1px solid #fde68a' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        backgroundColor: '#d97706',
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontWeight: showKecamatan ? 600 : 400, color: showKecamatan ? '#92400e' : 'var(--text-secondary)' }}>
                      Batas 20 Kecamatan
                    </span>
                  </div>
                  <span style={{ color: showKecamatan ? '#d97706' : 'var(--text-muted)' }}>
                    {showKecamatan ? <Eye size={14} /> : <EyeOff size={14} />}
                  </span>
                </div>
              )}

              {/* Desa Toggle */}
              {onToggleDesa && (
                <div
                  onClick={() => onToggleDesa(!showDesa)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: showDesa ? '#f0f9ff' : 'var(--bg-surface-subtle)',
                    border: showDesa ? '1px solid #bae6fd' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        backgroundColor: '#0284c7',
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontWeight: showDesa ? 600 : 400, color: showDesa ? '#0369a1' : 'var(--text-secondary)' }}>
                      Batas 278 Desa/Kelurahan
                    </span>
                  </div>
                  <span style={{ color: showDesa ? '#0284c7' : 'var(--text-muted)' }}>
                    {showDesa ? <Eye size={14} /> : <EyeOff size={14} />}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Layer Analisis Risiko & Dampak Dasimetrik */}
          {hasThematic && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Analisis Risiko & Dasimetrik
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--primary-700)', fontWeight: 600, background: 'var(--primary-50)', padding: '1px 5px', borderRadius: '4px' }}>
                  Hitung Dampak
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {/* Bahaya & Dampak Longsor Dasimetrik Toggle */}
                {onToggleDasimetrikLongsor && (
                  <div
                    onClick={() => onToggleDasimetrikLongsor(!showDasimetrikLongsor)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: showDasimetrikLongsor ? '#fef2f2' : 'var(--bg-surface-subtle)',
                      border: showDasimetrikLongsor ? '1px solid #fecaca' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={13} style={{ color: '#dc2626' }} />
                      <span style={{ fontWeight: showDasimetrikLongsor ? 600 : 400, color: showDasimetrikLongsor ? '#991b1b' : 'var(--text-secondary)' }}>
                        Bahaya Longsor (Dasimetrik)
                      </span>
                    </div>
                    <span style={{ color: showDasimetrikLongsor ? '#dc2626' : 'var(--text-muted)' }}>
                      {isLoadingThematic === 'dasimetrik-longsor' ? (
                        <span style={{ fontSize: '0.68rem', color: '#dc2626' }}>Memuat...</span>
                      ) : showDasimetrikLongsor ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </span>
                  </div>
                )}

                {/* Bahaya & Dampak Banjir Dasimetrik Toggle */}
                {onToggleDasimetrikBanjir && (
                  <div
                    onClick={() => onToggleDasimetrikBanjir(!showDasimetrikBanjir)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: showDasimetrikBanjir ? '#eff6ff' : 'var(--bg-surface-subtle)',
                      border: showDasimetrikBanjir ? '1px solid #bfdbfe' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Waves size={13} style={{ color: '#2563eb' }} />
                      <span style={{ fontWeight: showDasimetrikBanjir ? 600 : 400, color: showDasimetrikBanjir ? '#1d4ed8' : 'var(--text-secondary)' }}>
                        Bahaya Banjir (Dasimetrik)
                      </span>
                    </div>
                    <span style={{ color: showDasimetrikBanjir ? '#2563eb' : 'var(--text-muted)' }}>
                      {isLoadingThematic === 'dasimetrik-banjir' ? (
                        <span style={{ fontSize: '0.68rem', color: '#2563eb' }}>Memuat...</span>
                      ) : showDasimetrikBanjir ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </span>
                  </div>
                )}

                {/* Pola Ruang Toggle */}
                {onTogglePolaRuang && (
                  <div
                    onClick={() => onTogglePolaRuang(!showPolaRuang)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: showPolaRuang ? '#f0fdf4' : 'var(--bg-surface-subtle)',
                      border: showPolaRuang ? '1px solid #bbf7d0' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <TreePine size={13} style={{ color: '#16a34a' }} />
                      <span style={{ fontWeight: showPolaRuang ? 600 : 400, color: showPolaRuang ? '#15803d' : 'var(--text-secondary)' }}>
                        Pola Ruang (RTRW)
                      </span>
                    </div>
                    <span style={{ color: showPolaRuang ? '#16a34a' : 'var(--text-muted)' }}>
                      {isLoadingThematic === 'pola-ruang' ? (
                        <span style={{ fontSize: '0.68rem', color: '#16a34a' }}>Memuat...</span>
                      ) : showPolaRuang ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </span>
                  </div>
                )}

                {/* Riwayat Longsor BPBD Toggle */}
                {onToggleRiwayatLongsor && (
                  <div
                    onClick={() => onToggleRiwayatLongsor(!showRiwayatLongsor)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: showRiwayatLongsor ? '#faf5ff' : 'var(--bg-surface-subtle)',
                      border: showRiwayatLongsor ? '1px solid #e9d5ff' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} style={{ color: '#9333ea' }} />
                      <span style={{ fontWeight: showRiwayatLongsor ? 600 : 400, color: showRiwayatLongsor ? '#7e22ce' : 'var(--text-secondary)' }}>
                        Riwayat Bencana (244 Titik)
                      </span>
                    </div>
                    <span style={{ color: showRiwayatLongsor ? '#9333ea' : 'var(--text-muted)' }}>
                      {isLoadingThematic === 'riwayat' ? (
                        <span style={{ fontSize: '0.68rem', color: '#9333ea' }}>Memuat...</span>
                      ) : showRiwayatLongsor ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Basemap Styles */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.35rem',
                letterSpacing: '0.5px',
              }}
            >
              Peta Dasar (Basemap)
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {Object.values(BASEMAP_STYLES).map((bm) => {
                const isActive = currentBasemap === bm.id

                return (
                  <button
                    key={bm.id}
                    onClick={() => onSelectBasemap(bm.id)}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--primary-700)' : 'var(--text-primary)',
                      backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                      border: isActive ? '1px solid var(--primary-200)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span>{bm.name}</span>
                    {isActive && <Check size={14} style={{ color: 'var(--primary-600)' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
