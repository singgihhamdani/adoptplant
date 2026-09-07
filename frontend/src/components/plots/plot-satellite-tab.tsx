'use client'

import React, { useState, useMemo } from 'react'
import {
  Satellite,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Activity,
  Download,
  TreePine,
  CloudSun,
  Calendar,
  Sprout,
  Info,
  ShieldAlert,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  usePlotSatelliteTimeSeries,
  useAnalyzePlotSatellite,
  SatelliteObservation,
} from '@/hooks/use-satellite'
import type { FieldMonitoring, Intervention } from '@/lib/supabase/types'

export interface PlotSatelliteTabProps {
  plotId: string
  plotName: string
  polygonGeoJSON: any
  fieldMonitorings?: FieldMonitoring[]
  baselineDate?: string
  plantingDate?: string
  interventions?: Intervention[]
}

const TIMEFRAME_OPTIONS = [
  { label: '1 Thn (12 Bln)', months: 12 },
  { label: '2 Thn (24 Bln)', months: 24 },
  { label: '3 Thn (36 Bln) ⭐', months: 36 },
  { label: '5 Thn (60 Bln)', months: 60 },
]

export function PlotSatelliteTab({
  plotId,
  plotName,
  polygonGeoJSON,
  fieldMonitorings = [],
  baselineDate,
  plantingDate,
  interventions = [],
}: PlotSatelliteTabProps) {
  const [timeframeMonths, setTimeframeMonths] = useState<number>(36)
  const [selectedMetric, setSelectedMetric] = useState<'ndvi' | 'evi' | 'tree_cover'>('ndvi')

  const effectivePlantingDate = plantingDate || baselineDate || ''

  const { data: satData, isLoading, isFetching } = usePlotSatelliteTimeSeries(
    plotId,
    timeframeMonths,
    effectivePlantingDate
  )
  const analyzeMutation = useAnalyzePlotSatellite()

  const observations = satData?.observations || []
  const recovery = satData?.recovery

  // Find formatted display date of planting milestone for Recharts vertical line
  const plantingDisplayDate = useMemo(() => {
    if (!effectivePlantingDate || observations.length === 0) return null

    const pDate = new Date(effectivePlantingDate)
    const pYearMonth = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`

    const match = observations.find((obs) => obs.observation_date.startsWith(pYearMonth))
    if (match) {
      const d = new Date(match.observation_date)
      return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
    }

    // Fallback: pick the closest date in the array
    const sorted = [...observations].sort((a, b) => {
      return Math.abs(new Date(a.observation_date).getTime() - pDate.getTime()) -
        Math.abs(new Date(b.observation_date).getTime() - pDate.getTime())
    })

    if (sorted.length > 0) {
      const d = new Date(sorted[0].observation_date)
      return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
    }

    return null
  }, [effectivePlantingDate, observations])

  // Combine satellite data with field monitoring points and intervention tags
  const chartData = useMemo(() => {
    return observations.map((obs) => {
      const obsMonth = obs.observation_date.substring(0, 7)

      const matchingField = fieldMonitorings.find((m) => {
        return m.date.substring(0, 7) === obsMonth
      })

      const matchingIntervention = interventions.find((itv) => {
        const itvDate = itv.date || (itv as any).action_date || ''
        return itvDate.substring(0, 7) === obsMonth
      })

      const d = new Date(obs.observation_date)
      const monthYear = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })

      const isPostPlanting = effectivePlantingDate
        ? new Date(obs.observation_date) >= new Date(effectivePlantingDate)
        : obs.is_post_planting ?? true

      return {
        date: obs.observation_date,
        displayDate: monthYear,
        ndvi: obs.ndvi,
        evi: obs.evi || Number((obs.ndvi * 0.75).toFixed(4)),
        treeCover: obs.tree_cover_pct || Number((obs.ndvi * 105).toFixed(1)),
        cloudCover: obs.cloud_cover_pct,
        survivalRate:
          matchingField?.survival_rate !== undefined && matchingField?.survival_rate !== null
            ? Number(matchingField.survival_rate)
            : null,
        intervention: matchingIntervention?.type || (matchingIntervention as any)?.intervention_type || null,
        isPostPlanting,
      }
    })
  }, [observations, fieldMonitorings, interventions, effectivePlantingDate])

  const handleTriggerAnalysis = () => {
    if (!polygonGeoJSON) return
    analyzeMutation.mutate({
      plotId,
      polygonGeoJSON,
      timeframeMonths,
      plantingDate: effectivePlantingDate,
    })
  }

  // Recovery status styling
  const status = recovery?.status || 'MONITORING'
  const isRecovering = status === 'RECOVERING'
  const isAtRisk = status === 'AT_RISK'

  const statusBadgeBg = isRecovering ? '#dcfce7' : isAtRisk ? '#fee2e2' : '#fef3c7'
  const statusBadgeColor = isRecovering ? '#15803d' : isAtRisk ? '#991b1b' : '#92400e'
  const statusBorder = isRecovering ? '#bbf7d0' : isAtRisk ? '#fecaca' : '#fde68a'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Action & Overview Bar */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #bbf7d0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#dcfce7',
                  color: '#166534',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Satellite size={14} />
                Sentinel-2 MSI Level-2A (10m)
              </span>

              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f0f9ff',
                  color: '#0369a1',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid #bae6fd',
                }}
              >
                Cloud Masked (QA60/SCL)
              </span>

              {effectivePlantingDate && (
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#fefce8',
                    color: '#854d0e',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid #fef08a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Sprout size={13} style={{ color: '#65a30d' }} />
                  Tanam: {new Date(effectivePlantingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
              Analisis Time Series Google Earth Engine
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
              Ekstraksi indeks vegetasi temporal bulanan dari satelit Copernicus Sentinel-2 di atas batas poligon plot untuk memverifikasi bukti pemulihan kanopi secara objektif.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              variant="primary"
              onClick={handleTriggerAnalysis}
              isLoading={analyzeMutation.isPending || isFetching}
              icon={<RefreshCw size={15} className={analyzeMutation.isPending || isFetching ? 'animate-spin' : ''} />}
            >
              {analyzeMutation.isPending ? 'Memproses GEE...' : 'Update Analisis Satelit'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Key Remote Sensing Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Metric 1: Skor Pemulihan (Recovery Score) */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Skor Pemulihan</span>
            <Activity size={16} style={{ color: statusBadgeColor }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: statusBadgeColor }}>
              {recovery?.recovery_score || 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: statusBadgeBg,
              color: statusBadgeColor,
              border: `1px solid ${statusBorder}`,
            }}
          >
            {status === 'RECOVERING' ? '🟢 RECOVERING (Meningkat)' : status === 'MONITORING' ? '🟡 MONITORING (Stabil)' : '🔴 AT_RISK (Degradasi)'}
          </span>
        </Card>

        {/* Metric 2: NDVI Baseline vs Terkini */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Tren Pertumbuhan NDVI</span>
            <TrendingUp size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {recovery?.latest_ndvi || 0}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: (recovery?.delta_ndvi || 0) >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {(recovery?.delta_ndvi || 0) >= 0 ? `+${recovery?.delta_ndvi}` : recovery?.delta_ndvi}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Baseline: <strong>{recovery?.baseline_ndvi || 0}</strong> ({(recovery?.trend_percentage ?? 0) >= 0 ? `+${recovery?.trend_percentage}%` : `${recovery?.trend_percentage}%`})
          </div>
        </Card>

        {/* Metric 3: Estimasi Tutupan Kanopi */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Tutupan Kanopi (Estimasi)</span>
            <TreePine size={16} style={{ color: '#15803d' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#15803d', margin: '0.35rem 0' }}>
            {observations.length > 0 ? `${observations[observations.length - 1].tree_cover_pct}%` : '0%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Resolusi 10m &bull; Sentinel-2 MSI
          </div>
        </Card>

        {/* Metric 4: Validitas Data & Cloud Masking */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Kualitas Citra Satelit</span>
            <CloudSun size={16} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7', margin: '0.35rem 0' }}>
            {observations.length > 0 ? `${observations[observations.length - 1].valid_pixel_pct}%` : '0%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Piksel Bebas Awan (QA60 Valid)
          </div>
        </Card>
      </div>

      {/* 3. Interactive Recharts Time Series Chart */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
              Kurva Trajektori Pertumbuhan Vegetasi (Temporal Time Series)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Menampilkan evolusi kerapatan vegetasi bulanan dengan batas penanda hari penanaman.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Timeframe Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8fafc', padding: '3px 6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '2px' }}>
                Rentang:
              </span>
              {TIMEFRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setTimeframeMonths(opt.months)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: timeframeMonths === opt.months ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    background: timeframeMonths === opt.months ? 'var(--primary-600)' : 'transparent',
                    color: timeframeMonths === opt.months ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Metric Selector Pills */}
            <div style={{ display: 'flex', background: 'var(--bg-surface-subtle)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setSelectedMetric('ndvi')}
                type="button"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedMetric === 'ndvi' ? '#ffffff' : 'transparent',
                  color: selectedMetric === 'ndvi' ? 'var(--primary-700)' : 'var(--text-secondary)',
                  boxShadow: selectedMetric === 'ndvi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                NDVI (Vegetasi)
              </button>
              <button
                onClick={() => setSelectedMetric('evi')}
                type="button"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedMetric === 'evi' ? '#ffffff' : 'transparent',
                  color: selectedMetric === 'evi' ? 'var(--primary-700)' : 'var(--text-secondary)',
                  boxShadow: selectedMetric === 'evi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                EVI (Kanopi)
              </button>
              <button
                onClick={() => setSelectedMetric('tree_cover')}
                type="button"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedMetric === 'tree_cover' ? '#ffffff' : 'transparent',
                  color: selectedMetric === 'tree_cover' ? 'var(--primary-700)' : 'var(--text-secondary)',
                  boxShadow: selectedMetric === 'tree_cover' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                % Tutupan Pohon
              </button>
            </div>
          </div>
        </div>

        {/* Phase Indicator Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            marginBottom: '0.75rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-subtle)',
            fontSize: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '3px', background: '#94a3b8', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>
              <strong>Kiri Garis Hijau:</strong> Kondisi Pra-Penanaman (Baseline Lahan Terdegradasi)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '3px', background: '#10b981', display: 'inline-block' }} />
            <span style={{ color: '#047857' }}>
              <strong>Kanan Garis Hijau:</strong> Bukti Pertumbuhan Pohon Pasca-Penanaman
            </span>
          </div>
        </div>

        {/* Chart Viewport */}
        <div style={{ width: '100%', height: '340px', position: 'relative' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="eviGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="displayDate" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis
                  domain={selectedMetric === 'tree_cover' ? [0, 100] : [0.1, 0.9]}
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => (selectedMetric === 'tree_cover' ? `${v}%` : v.toFixed(2))}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                            📅 Periode: {data.date}
                          </div>

                          <div
                            style={{
                              display: 'inline-block',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '3px',
                              marginBottom: '6px',
                              background: data.isPostPlanting ? '#dcfce7' : '#f1f5f9',
                              color: data.isPostPlanting ? '#15803d' : '#64748b',
                            }}
                          >
                            {data.isPostPlanting ? '🌱 Pasca-Penanaman (Pemulihan)' : '⏳ Pra-Penanaman (Kondisi Awal)'}
                          </div>

                          <div style={{ color: '#059669', fontWeight: 600 }}>
                            🌿 NDVI Vegetasi: <strong>{data.ndvi}</strong>
                          </div>
                          <div style={{ color: '#0284c7', marginTop: '2px' }}>
                            🍃 EVI Kanopi: <strong>{data.evi}</strong>
                          </div>
                          <div style={{ color: '#166534', marginTop: '2px' }}>
                            🌳 Estimasi Tutupan: <strong>{data.treeCover}%</strong>
                          </div>

                          {data.survivalRate !== null && (
                            <div style={{ color: '#d97706', fontWeight: 700, marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                              📍 Survival Rate Lapangan: <strong>{data.survivalRate}%</strong>
                            </div>
                          )}

                          {data.intervention && (
                            <div style={{ color: '#7e22ce', fontWeight: 700, marginTop: '4px' }}>
                              🛠️ Intervensi: <strong>{data.intervention}</strong>
                            </div>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />

                {/* Horizontal Baseline reference line */}
                {recovery?.baseline_ndvi && (
                  <ReferenceLine
                    y={selectedMetric === 'tree_cover' ? recovery.baseline_ndvi * 105 : recovery.baseline_ndvi}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Baseline Awal',
                      position: 'insideBottomRight',
                      fill: '#94a3b8',
                      fontSize: 10,
                    }}
                  />
                )}

                {/* Vertical Planting Date Milestone Marker Line */}
                {plantingDisplayDate && (
                  <ReferenceLine
                    x={plantingDisplayDate}
                    stroke="#059669"
                    strokeWidth={2.2}
                    strokeDasharray="4 4"
                    label={{
                      value: '🌱 Hari Penanaman',
                      position: 'top',
                      fill: '#047857',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                )}

                {/* Main Data Area */}
                <Area
                  type="monotone"
                  dataKey={selectedMetric === 'ndvi' ? 'ndvi' : selectedMetric === 'evi' ? 'evi' : 'treeCover'}
                  stroke={selectedMetric === 'ndvi' ? '#059669' : selectedMetric === 'evi' ? '#0284c7' : '#166534'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={selectedMetric === 'ndvi' ? 'url(#ndviGradient)' : 'url(#eviGradient)'}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              {isLoading ? 'Mengambil data satelit Sentinel-2...' : 'Belum ada data observasi satelit.'}
            </div>
          )}
        </div>

        {/* Interpretasi Analitis */}
        {recovery?.interpretation && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              fontSize: '0.825rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
            <span>
              <strong>Interpretasi Analitis:</strong> {recovery.interpretation}
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}
