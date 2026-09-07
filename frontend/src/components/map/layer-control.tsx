'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  X,
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
  defaultOpen?: boolean
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
  defaultOpen = false,
}: LayerControlProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeCount =
    (showKecamatan ? 1 : 0) +
    (showDesa ? 1 : 0) +
    (showPolaRuang ? 1 : 0) +
    (showDasimetrikLongsor ? 1 : 0) +
    (showDasimetrikBanjir ? 1 : 0) +
    (showRiwayatLongsor ? 1 : 0)

  const hasThematic =
    onTogglePolaRuang ||
    onToggleDasimetrikLongsor ||
    onToggleDasimetrikBanjir ||
    onToggleRiwayatLongsor

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        fontFamily: 'inherit',
      }}
    >
      {/* Floating Pill Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.45rem 0.75rem',
          borderRadius: '8px',
          backgroundColor: isOpen ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: isOpen ? '1px solid var(--primary-400)' : '1px solid rgba(0,0,0,0.12)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: isOpen ? 'var(--primary-700)' : 'var(--text-primary)',
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        <Layers size={14} style={{ color: 'var(--primary-600)' }} />
        <span>Layer & Analisis</span>

        {activeCount > 0 && (
          <span
            style={{
              background: 'var(--primary-600)',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '9999px',
            }}
          >
            {activeCount}
          </span>
        )}

        {isOpen ? <ChevronUp size={14} style={{ color: '#64748b' }} /> : <ChevronDown size={14} style={{ color: '#64748b' }} />}
      </button>

      {/* Popover Floating Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '275px',
            maxHeight: '440px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pilihan Layer Referensi Spasial
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div
            style={{
              padding: '0.625rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              overflowY: 'auto',
            }}
          >
            {/* Section 1: Batas Administrasi */}
            <div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '0.35rem',
                  letterSpacing: '0.5px',
                }}
              >
                Batas Administrasi
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {/* Kecamatan */}
                {onToggleKecamatan && (
                  <div
                    onClick={() => onToggleKecamatan(!showKecamatan)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: showKecamatan ? '#fffbeb' : 'var(--bg-surface-subtle)',
                      border: showKecamatan ? '1px solid #fde68a' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          width: '9px',
                          height: '9px',
                          borderRadius: '2px',
                          backgroundColor: '#d97706',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontWeight: showKecamatan ? 600 : 400, color: showKecamatan ? '#92400e' : 'var(--text-secondary)' }}>
                        20 Kecamatan
                      </span>
                    </div>
                    <span style={{ color: showKecamatan ? '#d97706' : 'var(--text-muted)' }}>
                      {showKecamatan ? <Eye size={13} /> : <EyeOff size={13} />}
                    </span>
                  </div>
                )}

                {/* Desa */}
                {onToggleDesa && (
                  <div
                    onClick={() => onToggleDesa(!showDesa)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: showDesa ? '#f0f9ff' : 'var(--bg-surface-subtle)',
                      border: showDesa ? '1px solid #bae6fd' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          width: '9px',
                          height: '9px',
                          borderRadius: '2px',
                          backgroundColor: '#0284c7',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontWeight: showDesa ? 600 : 400, color: showDesa ? '#0369a1' : 'var(--text-secondary)' }}>
                        278 Desa / Kelurahan
                      </span>
                    </div>
                    <span style={{ color: showDesa ? '#0284c7' : 'var(--text-muted)' }}>
                      {showDesa ? <Eye size={13} /> : <EyeOff size={13} />}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Tematik & Kebencanaan */}
            {hasThematic && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '0.35rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  Analisis Risiko & Pola Ruang
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {/* Pola Ruang */}
                  {onTogglePolaRuang && (
                    <div
                      onClick={() => onTogglePolaRuang(!showPolaRuang)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: showPolaRuang ? '#f0fdf4' : 'var(--bg-surface-subtle)',
                        border: showPolaRuang ? '1px solid #bbf7d0' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <TreePine size={13} style={{ color: '#16a34a' }} />
                        <span style={{ fontWeight: showPolaRuang ? 600 : 400, color: showPolaRuang ? '#15803d' : 'var(--text-secondary)' }}>
                          Pola Ruang (RTRW 14 Zonasi)
                        </span>
                      </div>
                      <span style={{ color: showPolaRuang ? '#16a34a' : 'var(--text-muted)' }}>
                        {isLoadingThematic === 'pola-ruang' ? (
                          <span style={{ fontSize: '0.65rem', color: '#16a34a' }}>Memuat...</span>
                        ) : showPolaRuang ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}
                      </span>
                    </div>
                  )}

                  {/* Longsor Dasimetrik */}
                  {onToggleDasimetrikLongsor && (
                    <div
                      onClick={() => onToggleDasimetrikLongsor(!showDasimetrikLongsor)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: showDasimetrikLongsor ? '#fef2f2' : 'var(--bg-surface-subtle)',
                        border: showDasimetrikLongsor ? '1px solid #fecaca' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertTriangle size={13} style={{ color: '#dc2626' }} />
                        <span style={{ fontWeight: showDasimetrikLongsor ? 600 : 400, color: showDasimetrikLongsor ? '#991b1b' : 'var(--text-secondary)' }}>
                          Bahaya Longsor & Jiwa Terpapar
                        </span>
                      </div>
                      <span style={{ color: showDasimetrikLongsor ? '#dc2626' : 'var(--text-muted)' }}>
                        {isLoadingThematic === 'dasimetrik-longsor' ? (
                          <span style={{ fontSize: '0.65rem', color: '#dc2626' }}>Memuat...</span>
                        ) : showDasimetrikLongsor ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}
                      </span>
                    </div>
                  )}

                  {/* Banjir Dasimetrik */}
                  {onToggleDasimetrikBanjir && (
                    <div
                      onClick={() => onToggleDasimetrikBanjir(!showDasimetrikBanjir)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: showDasimetrikBanjir ? '#eff6ff' : 'var(--bg-surface-subtle)',
                        border: showDasimetrikBanjir ? '1px solid #bfdbfe' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Waves size={13} style={{ color: '#2563eb' }} />
                        <span style={{ fontWeight: showDasimetrikBanjir ? 600 : 400, color: showDasimetrikBanjir ? '#1d4ed8' : 'var(--text-secondary)' }}>
                          Bahaya Banjir & Jiwa Terpapar
                        </span>
                      </div>
                      <span style={{ color: showDasimetrikBanjir ? '#2563eb' : 'var(--text-muted)' }}>
                        {isLoadingThematic === 'dasimetrik-banjir' ? (
                          <span style={{ fontSize: '0.65rem', color: '#2563eb' }}>Memuat...</span>
                        ) : showDasimetrikBanjir ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}
                      </span>
                    </div>
                  )}

                  {/* Riwayat BPBD */}
                  {onToggleRiwayatLongsor && (
                    <div
                      onClick={() => onToggleRiwayatLongsor(!showRiwayatLongsor)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: showRiwayatLongsor ? '#faf5ff' : 'var(--bg-surface-subtle)',
                        border: showRiwayatLongsor ? '1px solid #e9d5ff' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={13} style={{ color: '#9333ea' }} />
                        <span style={{ fontWeight: showRiwayatLongsor ? 600 : 400, color: showRiwayatLongsor ? '#7e22ce' : 'var(--text-secondary)' }}>
                          Riwayat Bencana BPBD (244 Titik)
                        </span>
                      </div>
                      <span style={{ color: showRiwayatLongsor ? '#9333ea' : 'var(--text-muted)' }}>
                        {isLoadingThematic === 'riwayat' ? (
                          <span style={{ fontSize: '0.65rem', color: '#9333ea' }}>Memuat...</span>
                        ) : showRiwayatLongsor ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 3: Basemap */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '0.3rem',
                  letterSpacing: '0.5px',
                }}
              >
                Peta Dasar (Basemap)
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                {Object.values(BASEMAP_STYLES).map((bm) => {
                  const isActive = currentBasemap === bm.id

                  return (
                    <button
                      key={bm.id}
                      onClick={() => onSelectBasemap(bm.id)}
                      type="button"
                      style={{
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem',
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? 'var(--primary-700)' : 'var(--text-primary)',
                        backgroundColor: isActive ? 'var(--primary-50)' : '#f8fafc',
                        border: isActive ? '1px solid var(--primary-300)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bm.name}
                      </span>
                      {isActive && <Check size={12} style={{ color: 'var(--primary-600)' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
