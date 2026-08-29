'use client'

import React from 'react'
import clsx from 'clsx'
import { MONITORING_STATUS_CONFIG } from '@/lib/constants'
import type { MonitoringStatus } from '@/lib/supabase/types'

export interface StatusBadgeProps {
  status: MonitoringStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = MONITORING_STATUS_CONFIG[status] || {
    label: status,
    badgeClass: '',
  }

  return (
    <span className={clsx('badge', config.badgeClass, className)}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {config.label}
    </span>
  )
}

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const styleMap = {
    default: { background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' },
    success: { background: 'var(--status-recovering-bg)', color: 'var(--status-recovering)' },
    warning: { background: 'var(--status-monitoring-bg)', color: 'var(--status-monitoring)' },
    danger: { background: 'var(--status-at-risk-bg)', color: 'var(--status-at-risk)' },
    info: { background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)' },
  }[variant]

  return (
    <span
      className={clsx('badge', className)}
      style={{
        ...styleMap,
        border: '1px solid currentColor',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </span>
  )
}
