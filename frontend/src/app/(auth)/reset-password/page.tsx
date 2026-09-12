'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Trees,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSessionChecking, setIsSessionChecking] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)

  // Password matching helpers
  const isMatch = confirmPassword.length > 0 && password === confirmPassword
  const isMismatch = confirmPassword.length > 0 && password !== confirmPassword

  useEffect(() => {
    async function checkRecoverySession() {
      try {
        // Check current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          setHasValidSession(true)
        } else {
          // Check if there is a hash or recovery event
          const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
                setHasValidSession(true)
              }
            }
          )

          // Give a short grace period for Supabase client to parse URL hash fragment
          setTimeout(async () => {
            const {
              data: { session: currentSession },
            } = await supabase.auth.getSession()
            if (currentSession) {
              setHasValidSession(true)
            }
            setIsSessionChecking(false)
          }, 800)

          return () => {
            authListener.subscription.unsubscribe()
          }
        }
      } catch (err) {
        console.warn('Session check warning:', err)
      } finally {
        setIsSessionChecking(false)
      }
    }

    checkRecoverySession()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password baru dan Konfirmasi Password tidak cocok.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Gagal memperbarui kata sandi. Silakan coba lagi.')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem saat memperbarui kata sandi.')
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
            Setel Ulang Kata Sandi
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Masukkan kata sandi baru yang kuat untuk akun REHABTRACK Anda.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={36} style={{ color: '#059669' }} />
              <strong style={{ fontSize: '1rem' }}>Kata Sandi Berhasil Diperbarui!</strong>
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#047857', lineHeight: 1.4 }}>
                Kata sandi baru Anda telah aktif. Anda sekarang dapat mengakses dashboard pemantauan rehabilitasi.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              icon={<ArrowRight size={16} />}
              onClick={() => router.push('/overview')}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Masuk ke Dashboard
            </Button>

            <Link
              href="/login"
              style={{
                fontSize: '0.825rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              Atau kembali ke halaman masuk
            </Link>
          </div>
        ) : isSessionChecking ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                border: '3px solid var(--border-subtle)',
                borderTopColor: 'var(--primary-600)',
                borderRadius: '50%',
                margin: '0 auto 1rem auto',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Memverifikasi tautan keamanan...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <Input
                label="Kata Sandi Baru"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={showPassword ? 'Sembunyikan' : 'Lihat'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                Kombinasi huruf, angka, dan karakter khusus dianjurkan.
              </span>
            </div>

            <div>
              <Input
                label="Ulangi Kata Sandi Baru"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ketik ulang kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={showConfirmPassword ? 'Sembunyikan' : 'Lihat'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              {isMatch && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--status-recovering)',
                    marginTop: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={12} /> Kata sandi cocok
                </span>
              )}
              {isMismatch && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--status-at-risk)',
                    marginTop: '3px',
                    display: 'block',
                  }}
                >
                  Kata sandi belum cocok
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              icon={<ShieldCheck size={16} />}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Simpan Kata Sandi Baru
            </Button>

            <div
              style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'center',
              }}
            >
              <Link
                href="/login"
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--primary-700)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Batal dan Kembali ke Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
