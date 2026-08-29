'use client'

import React, { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.3rem 0.65rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: isOnline ? 'var(--status-recovering-bg)' : 'var(--status-at-risk-bg)',
        color: isOnline ? 'var(--status-recovering)' : 'var(--status-at-risk)',
        border: `1px solid ${isOnline ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
      }}
    >
      {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
      <span>{isOnline ? 'Online' : 'Offline'}</span>

      {pendingCount > 0 && (
        <span
          style={{
            marginLeft: '0.25rem',
            padding: '0.1rem 0.4rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--status-monitoring-bg)',
            color: 'var(--status-monitoring)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {isSyncing && <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} />}
          {pendingCount} pending
        </span>
      )}
    </div>
  )
}
