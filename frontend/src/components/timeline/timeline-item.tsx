'use client'

import React from 'react'
import Link from 'next/link'
import type { TimelineEventItem } from '@/hooks/use-interventions'
import { INTERVENTION_TYPE_LABELS } from '@/lib/constants'
import {
  Sprout,
  Wrench,
  Droplets,
  FlaskConical,
  ShieldAlert,
  ClipboardCheck,
  Calendar,
  MapPin,
  Trees,
  User,
  Image as ImageIcon,
  ArrowUpRight,
  TrendingUp,
  Leaf,
} from 'lucide-react'

export interface TimelineItemProps {
  item: TimelineEventItem
  isLast?: boolean
}

export function TimelineItem({ item, isLast = false }: TimelineItemProps) {
  // Determine icon & color based on event type
  const getEventMeta = () => {
    switch (item.category) {
      case 'PLANTING':
        return {
          icon: <Sprout size={16} />,
          color: '#15803d',
          bg: '#f0fdf4',
          border: '#bbf7d0',
          badgeText: 'Penanaman Bibit',
        }
      case 'INTERVENTION':
        switch (item.interventionType) {
          case 'REPLANTING':
            return {
              icon: <Leaf size={16} />,
              color: '#d97706',
              bg: '#fffbeb',
              border: '#fef3c7',
              badgeText: 'Penyulaman Bibit',
            }
          case 'FERTILIZATION':
            return {
              icon: <FlaskConical size={16} />,
              color: '#7c3aed',
              bg: '#f5f3ff',
              border: '#ddd6fe',
              badgeText: 'Pemupukan',
            }
          case 'WATERING':
            return {
              icon: <Droplets size={16} />,
              color: '#0284c7',
              bg: '#f0f9ff',
              border: '#bae6fd',
              badgeText: 'Penyiraman',
            }
          case 'PEST_CONTROL':
            return {
              icon: <ShieldAlert size={16} />,
              color: '#dc2626',
              bg: '#fef2f2',
              border: '#fecaca',
              badgeText: 'Pengendalian Hama',
            }
          default:
            return {
              icon: <Wrench size={16} />,
              color: '#047857',
              bg: '#ecfdf5',
              border: '#a7f3d0',
              badgeText: INTERVENTION_TYPE_LABELS[item.interventionType || 'MAINTENANCE'] || 'Pemeliharaan',
            }
        }
      case 'MONITORING':
        return {
          icon: <ClipboardCheck size={16} />,
          color: '#4338ca',
          bg: '#eef2ff',
          border: '#c7d2fe',
          badgeText: 'Field Monitoring',
        }
      default:
        return {
          icon: <Calendar size={16} />,
          color: '#475569',
          bg: '#f8fafc',
          border: '#e2e8f0',
          badgeText: 'Aktivitas',
        }
    }
  }

  const meta = getEventMeta()

  return (
    <div style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
      {/* Left Timeline Line & Icon Node */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        {/* Node Circle */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: meta.bg,
            border: `2px solid ${meta.border}`,
            color: meta.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-xs)',
            zIndex: 2,
          }}
        >
          {meta.icon}
        </div>

        {/* Vertical Connecting Line */}
        {!isLast && (
          <div
            style={{
              width: '2px',
              flex: 1,
              backgroundColor: 'var(--border-subtle)',
              marginTop: '4px',
              marginBottom: '4px',
            }}
          />
        )}
      </div>

      {/* Right Content Card */}
      <div
        style={{
          flex: 1,
          paddingBottom: isLast ? 0 : '1.75rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            transition: 'box-shadow var(--transition-fast)',
          }}
        >
          {/* Header Row: Badge & Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: meta.bg,
                  color: meta.color,
                  border: `1px solid ${meta.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {meta.badgeText}
              </span>

              {item.plotName && (
                <Link
                  href={`/plots/${item.plotId}`}
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  className="hover-underline"
                >
                  <MapPin size={13} style={{ color: 'var(--primary-600)' }} />
                  <span>{item.plotName}</span>
                </Link>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Calendar size={13} />
              <span>
                {new Date(item.date).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Event Title */}
          <div>
            <h4 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
              {item.title}
            </h4>

            {item.projectName && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                Proyek: {item.projectName} &bull; {item.locationName}
              </span>
            )}
          </div>

          {/* Specific Data Blocks */}
          {/* 1. Planting Event Details */}
          {item.category === 'PLANTING' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <span style={{ color: '#15803d', fontSize: '0.72rem', display: 'block' }}>Spesies Bibit</span>
                <strong style={{ color: '#16a34a' }}>
                  {item.speciesName} {item.scientificName ? `(${item.scientificName})` : ''}
                </strong>
              </div>
              <div style={{ borderLeft: '1px solid #bbf7d0', paddingLeft: '1rem' }}>
                <span style={{ color: '#15803d', fontSize: '0.72rem', display: 'block' }}>Jumlah Ditanam</span>
                <strong style={{ color: '#16a34a' }}>{item.quantity?.toLocaleString('id-ID')} batang</strong>
              </div>
            </div>
          )}

          {/* 2. Intervention Details */}
          {item.category === 'INTERVENTION' && item.quantity && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.7rem',
                borderRadius: '6px',
                background: 'var(--bg-surface-subtle)',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Kuantitas / Bibit Terlibat:</span>
              <strong>{item.quantity.toLocaleString('id-ID')} unit</strong>
            </div>
          )}

          {/* 3. Monitoring Details */}
          {item.category === 'MONITORING' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                flexWrap: 'wrap',
              }}
            >
              {item.survivalRate !== null && item.survivalRate !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Survival Rate</span>
                  <strong style={{ color: item.survivalRate >= 70 ? 'var(--status-recovering)' : 'var(--status-at-risk)' }}>
                    {item.survivalRate}%
                  </strong>
                </div>
              )}

              {item.healthyCount !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Bibit Sehat</span>
                  <strong style={{ color: '#16a34a' }}>{item.healthyCount} btg</strong>
                </div>
              )}

              {item.stressedCount !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Sakit / Stres</span>
                  <strong style={{ color: '#ea580c' }}>{item.stressedCount} btg</strong>
                </div>
              )}

              {item.deadCount !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Mati</span>
                  <strong style={{ color: '#dc2626' }}>{item.deadCount} btg</strong>
                </div>
              )}
            </div>
          )}

          {/* Narrative Description */}
          {item.description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {item.description}
            </p>
          )}

          {/* Photos if attached */}
          {item.photos && item.photos.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {item.photos.slice(0, 4).map((ph, idx) => (
                <div
                  key={ph.id || idx}
                  style={{
                    width: '75px',
                    height: '55px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    background: '#0f172a',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={ph.url}
                    alt={ph.caption || 'Foto timeline'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footer User Info */}
          {item.userName && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={13} />
                <span>Pelaksana / Petugas: <strong>{item.userName}</strong></span>
              </div>

              {item.category === 'MONITORING' && (
                <Link
                  href={`/monitoring/${item.id.replace('monitoring-', '')}`}
                  style={{ color: 'var(--primary-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                >
                  <span>Laporan Penuh</span>
                  <ArrowUpRight size={13} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
