'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trees, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || 'Gagal login. Periksa email dan password Anda.')
        setIsLoading(false)
        return
      }

      if (data.user) {
        router.push('/overview')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.')
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
            Masuk ke REHABTRACK
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Pantau dan verifikasi pemulihan lahan rehabilitasi Anda
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Alamat Email"
            type="email"
            placeholder="nama@organisasi.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.35rem',
              }}
            >
              <label className="input-label" style={{ margin: 0 }}>
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--primary-700)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Lupa password?
              </Link>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            Masuk ke Dashboard
          </Button>
        </form>

        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.825rem',
            color: 'var(--text-secondary)',
          }}
        >
          Belum memiliki akun?{' '}
          <Link href="/register" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
            Daftar Akun Baru
          </Link>
        </div>
      </div>
    </div>
  )
}
