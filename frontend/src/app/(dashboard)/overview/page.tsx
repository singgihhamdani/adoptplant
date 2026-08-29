'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Trees,
  MapPin,
  Sprout,
  Activity,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

export default function OverviewPage() {
  // Sample data before Supabase live project connects
  const stats = {
    total_projects: 3,
    total_plots: 8,
    total_area_ha: 42.5,
    total_planted: 12450,
    avg_survival_rate: 86.4,
    plots_recovering: 5,
    plots_monitoring: 2,
    plots_at_risk: 1,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
          borderColor: 'var(--primary-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-700)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <ShieldCheck size={16} />
            <span>Sistem Monitoring Lahan Berkelanjutan</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            Dashboard Pemantauan Rehabilitasi
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '600px' }}>
            Dari aksi penanaman menuju bukti pemulihan. Pantau kondisi plot secara spasial, survival rate, dan time series satelit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/projects/new">
            <Button variant="secondary" size="sm" icon={<Plus size={16} />}>
              Proyek Baru
            </Button>
          </Link>
          <Link href="/monitoring/new">
            <Button variant="primary" size="sm" icon={<Plus size={16} />}>
              Input Monitoring
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Proyek</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
              <Trees size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {stats.total_projects}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>3 area rehabilitasi aktif</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Luas Lahan</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-cyan)' }}>
              <MapPin size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {stats.total_area_ha} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Ha</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Terbagi dalam {stats.total_plots} polygon plot</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tanaman Tertanam</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--accent-amber)' }}>
              <Sprout size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {stats.total_planted.toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bibit dari 16 spesies lokal</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Rata-rata Survival</span>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--status-recovering-bg)', color: 'var(--status-recovering)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--status-recovering)' }}>
            {stats.avg_survival_rate}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--primary-700)' }}>
            <TrendingUp size={14} />
            <span>+4.2% dari baseline survey</span>
          </div>
        </Card>
      </div>

      {/* Plot Status Breakdown & Recent Plots */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Status Distribution */}
        <Card>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Distribusi Status Plot</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--status-recovering)', fontWeight: 600 }}>Pulih (Recovering)</span>
                <span>{stats.plots_recovering} Plot (62.5%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: '62.5%', height: '100%', background: 'var(--status-recovering)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--status-monitoring)', fontWeight: 600 }}>Pemantauan (Monitoring)</span>
                <span>{stats.plots_monitoring} Plot (25.0%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: 'var(--status-monitoring)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--status-at-risk)', fontWeight: 600 }}>Beresiko (At Risk)</span>
                <span>{stats.plots_at_risk} Plot (12.5%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: '12.5%', height: '100%', background: 'var(--status-at-risk)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Insights */}
        <Card>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Peringatan & Tindakan Lapangan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-at-risk-bg)',
                border: '1px solid rgba(225, 29, 72, 0.2)',
                display: 'flex',
                gap: '0.75rem',
              }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--status-at-risk)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.825rem', color: 'var(--status-at-risk)' }}>Plot PLT-004 DAS Serayu</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Survival rate turun ke 48%. Direkomendasikan penyulaman 150 bibit Sengon & Mahoni.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-recovering-bg)',
                border: '1px solid rgba(5, 150, 105, 0.2)',
                display: 'flex',
                gap: '0.75rem',
              }}
            >
              <TrendingUp size={18} style={{ color: 'var(--status-recovering)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.825rem', color: 'var(--status-recovering)' }}>Plot PLT-001 Mangrove Teluk</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Tren NDVI +0.22 positif selama 6 bulan terakhir. Tutupan kanopi mencapai 65%.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
