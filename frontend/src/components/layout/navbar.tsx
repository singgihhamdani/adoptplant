'use client'

import React from 'react'
import { Bell, User, LogOut } from 'lucide-react'
import { SyncIndicator } from './sync-indicator'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

export interface NavbarProps {
  title?: string
  subtitle?: string
}

export function Navbar({ title, subtitle }: NavbarProps) {
  const { user, signOut } = useAuth()

  return (
    <header
      style={{
        height: '64px',
        padding: '0 1.75rem',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div>
        {title && <h1 style={{ fontSize: '1.15rem', margin: 0 }}>{title}</h1>}
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <SyncIndicator />

        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingLeft: '0.75rem',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'var(--primary-700)',
                  backgroundColor: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={() => signOut()}
              style={{
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
              }}
              title="Keluar / Logout"
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--primary-700)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
            }}
          >
            Masuk Akun
          </Link>
        )}
      </div>
    </header>
  )
}
