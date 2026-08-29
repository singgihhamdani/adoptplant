'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Trees,
  MapPin,
  ClipboardCheck,
  History,
  Settings,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: Trees },
  { label: 'Plots', href: '/plots', icon: MapPin },
  { label: 'Field Monitoring', href: '/monitoring', icon: ClipboardCheck },
  { label: 'Timeline & Events', href: '/timeline', icon: History },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-glow-emerald)',
          }}
        >
          <Trees size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', margin: 0, letterSpacing: '-0.02em' }}>
            REHABTRACK
          </h2>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
            Evidence of Recovery
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/overview' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary-900)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--primary-400)' : 'var(--text-muted)' }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Pro Indicator Card */}
      <div style={{ padding: '1rem' }}>
        <div
          className="glass-panel"
          style={{
            padding: '0.875rem',
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4), rgba(17, 24, 39, 0.6))',
            borderColor: 'rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Sparkles size={14} style={{ color: 'var(--primary-400)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-300)' }}>
              GEE Satellite Ready
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            Sentinel-2 10m & Dynamic World land cover pipeline.
          </p>
        </div>
      </div>
    </aside>
  )
}
