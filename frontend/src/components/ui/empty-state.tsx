'use client'

import React from 'react'
import { FolderKanban } from 'lucide-react'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon = <FolderKanban size={40} style={{ color: 'var(--text-muted)' }} />,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-strong)',
        background: 'var(--bg-surface-subtle)',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{title}</h3>
      {description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: action ? '1.25rem' : 0 }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
