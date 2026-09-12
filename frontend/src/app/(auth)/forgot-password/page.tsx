'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trees, AlertCircle, CheckCircle2, ArrowLeft, Mail, RefreshCw } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Harap masukkan alamat email Anda.')
      return
    }

    setIsLoading(true)

    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=/reset-password`
          : undefined

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      })

      if (resetError) {
        setError(resetError.message || 'Gagal mengirim email pemulihan. Periksa kembali alamat email Anda.')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      setCooldown(60)
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan pada sistem.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at top, #ecfdf5 0%, #f8fafc 70%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2.25rem',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              marginBottom: '1rem',
            }}
          >
            <Trees size={28} />
          </div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            Lupa Kata Sandi?
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Masukkan email akun REHABTRACK Anda untuk menerima instruksi tautan pemulihan kata sandi.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-at-risk-bg)',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              color: 'var(--status-at-risk)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              <CheckCircle2 size={20} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Tautan Pemulihan Terkirim!</strong>
                <p style={{ margin: '0.25rem 0 0 0', color: '#047857' }}>
                  Kami telah mengirimkan tautan reset kata sandi ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam email Anda.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={cooldown > 0 || isLoading}
              onClick={handleSubmit}
              icon={<RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />}
              style={{ width: '100%' }}
            >
              {cooldown > 0 ? `Kirim Ulang (${cooldown}d)` : 'Kirim Ulang Tautan'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.825rem',
                  color: 'var(--primary-700)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={15} />
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Alamat Email Terdaftar"
              type="email"
              placeholder="nama@organisasi.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              icon={<Mail size={16} />}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Kirim Tautan Pemulihan
            </Button>

            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'center',
              }}
            >
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.825rem',
                  color: 'var(--primary-700)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={15} />
                Kembali ke Halaman Masuk
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
