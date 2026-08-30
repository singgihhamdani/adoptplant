'use client'

import React, { useState } from 'react'
import {
  Satellite,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Activity,
  Download,
  TreePine,
  CloudSun,
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
import type { FieldMonitoring } from '@/lib/supabase/types'

export interface PlotSatelliteTabProps {
  plotId: string
  plotName: string
  polygonGeoJSON: any
  fieldMonitorings?: FieldMonitoring[]
}

export function PlotSatelliteTab({
  plotId,
  plotName,
  polygonGeoJSON,
  fieldMonitorings = [],
}: PlotSatelliteTabProps) {
  const { data: satData, isLoading, isFetching } = usePlotSatelliteTimeSeries(plotId)
  const analyzeMutation = useAnalyzePlotSatellite()
  const [selectedMetric, setSelectedMetric] = useState<'ndvi' | 'evi' | 'tree_cover'>('ndvi')

  const observations = satData?.observations || []
  const recovery = satData?.recovery

  // Combine satellite data with field monitoring points for dual-source graph
  const chartData = observations.map((obs) => {
    const matchingField = fieldMonitorings.find((m) => {
      return m.date.substring(0, 7) === obs.observation_date.substring(0, 7)
    })

    const d = new Date(obs.observation_date)
    const monthYear = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })

    return {
      date: obs.observation_date,
      displayDate: monthYear,
      ndvi: obs.ndvi,
      evi: obs.evi || Number((obs.ndvi * 0.75).toFixed(4)),
      treeCover: obs.tree_cover_pct || Number((obs.ndvi * 105).toFixed(1)),
      cloudCover: obs.cloud_cover_pct,
      survivalRate: matchingField?.survival_rate !== undefined && matchingField?.survival_rate !== null ? Number(matchingField.survival_rate) : null,
    }
  })

  const handleTriggerAnalysis = () => {
    if (!polygonGeoJSON) return
    analyzeMutation.mutate({
      plotId,
      polygonGeoJSON,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
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
              Menampilkan evolusi kerapatan vegetasi bulanan sejak inisiasi plot penanaman.
            </p>
          </div>

          {/* Metric Selector Pills */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-subtle)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setSelectedMetric('ndvi')}
              type="button"
              style={{
                padding: '4px 12px',
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
                padding: '4px 12px',
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
                padding: '4px 12px',
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

        {/* Chart Viewport */}
        <div style={{ width: '100%', height: '340px', position: 'relative' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
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
                          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                            📅 Periode: {data.date}
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
                        </div>
                      )
                    }
                    return null
                  }}
                />

                {/* Baseline reference line */}
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

                {/* Main Data Area */}
                <Area
                  type="monotone"
                  dataKey={selectedMetric === 'ndvi' ? 'ndvi' : selectedMetric === 'evi' ? 'evi' : 'treeCover'}
                  stroke={selectedMetric === 'ndvi' ? '#059669' : selectedMetric === 'evi' ? '#0284c7' : '#166534'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={selectedMetric === 'evi' ? 'url(#eviGradient)' : 'url(#ndviGradient)'}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Memuat data time series satelit...
            </div>
          )}
        </div>

        {/* Interpretation Note */}
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: statusBadgeBg,
            border: `1px solid ${statusBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            fontSize: '0.8rem',
            color: statusBadgeColor,
          }}
        >
          <Sparkles size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Interpretasi Analitis:</strong> {recovery?.interpretation || 'Vegetasi terpantau konsisten.'}
          </span>
        </div>
      </Card>

      {/* 4. Multi-Source Evidence Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.2rem 0', color: 'var(--text-primary)' }}>
              Tabel Rekam Jejak Observasi Satelit Sentinel-2
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {observations.length} observasi temporal terdaftar
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const headers = ['Tanggal', 'NDVI', 'EVI', 'NDMI', 'Tutupan Pohon (%)', 'Piksel Valid (%)', 'Kualitas']
              const rows = observations.map((o) => [
                o.observation_date,
                o.ndvi,
                o.evi || '-',
                o.ndmi || '-',
                o.tree_cover_pct || '-',
                o.valid_pixel_pct,
                o.quality_flag,
              ])
              const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `satellite_observations_${plotName.replace(/\s+/g, '_')}.csv`
              a.click()
            }}
            icon={<Download size={13} />}
          >
            Export CSV
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-subtle)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Tanggal Observasi</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>NDVI (Vegetasi)</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>EVI (Kanopi)</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Tutupan Kanopi</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Piksel Valid</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Kualitas</th>
              </tr>
            </thead>
            <tbody>
              {observations.slice(-8).reverse().map((obs, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {obs.observation_date}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#059669', fontWeight: 700 }}>
                    {obs.ndvi}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#0284c7' }}>
                    {obs.evi || '-'}
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                    {obs.tree_cover_pct}%
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                    {obs.valid_pixel_pct}%
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: obs.quality_flag === 'HIGH' ? '#dcfce7' : '#fef3c7',
                        color: obs.quality_flag === 'HIGH' ? '#15803d' : '#92400e',
                      }}
                    >
                      {obs.quality_flag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
