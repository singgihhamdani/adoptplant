'use client'

import React, { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useOfflinePendingCount, useSyncMonitorings } from '@/hooks/use-monitoring'

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const pendingCount = useOfflinePendingCount()
  const syncMutation = useSyncMonitorings()
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)

    const handleOnline = () => {
      setIsOnline(true)
      // Auto sync when coming back online
      syncMutation.mutate()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOnline || syncMutation.isPending) return

    try {
      const res = await syncMutation.mutateAsync()
      if (res.success > 0) {
        setSyncFeedback(`${res.success} tersinkron`)
        setTimeout(() => setSyncFeedback(null), 3000)
      } else if (res.failed > 0) {
        setSyncFeedback(`${res.failed} gagal`)
        setTimeout(() => setSyncFeedback(null), 4000)
      }
    } catch (err: any) {
      console.error('Manual sync failed:', err)
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: isOnline ? 'var(--status-recovering-bg)' : 'var(--status-at-risk-bg)',
          color: isOnline ? 'var(--status-recovering)' : 'var(--status-at-risk)',
          border: `1px solid ${isOnline ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
          transition: 'all 0.2s ease',
        }}
        title={isOnline ? 'Tersambung ke internet' : 'Perangkat sedang offline'}
      >
        {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={!isOnline || syncMutation.isPending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--status-monitoring-bg)',
            color: 'var(--status-monitoring)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: isOnline ? 'pointer' : 'default',
            opacity: isOnline ? 1 : 0.8,
            transition: 'background 0.2s ease',
          }}
          title={isOnline ? 'Klik untuk menyinkronkan data ke server' : 'Data tersimpan di memori perangkat, menunggu koneksi online'}
        >
          <RefreshCw
            size={11}
            style={{
              animation: syncMutation.isPending ? 'spin 1s linear infinite' : 'none',
            }}
          />
          <span>
            {syncMutation.isPending
              ? 'Menyinkronkan...'
              : `${pendingCount} Menunggu Sync`}
          </span>
        </button>
      )}

      {syncFeedback && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--status-recovering)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <CheckCircle2 size={12} />
          {syncFeedback}
        </span>
      )}
    </div>
  )
}
