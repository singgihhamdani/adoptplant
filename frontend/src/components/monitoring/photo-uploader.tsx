'use client'

import React, { useState, useRef } from 'react'
import { compressImage, formatBytes, type CompressedImageResult } from '@/lib/image-compress'
import { Button } from '@/components/ui/button'
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react'

export interface UploadedPhotoItem {
  id: string
  file: File
  previewUrl: string
  originalSizeBytes: number
  compressedSizeBytes: number
  savedPercentage: number
  caption: string
}

export interface PhotoUploaderProps {
  photos: UploadedPhotoItem[]
  onPhotosChange: (photos: UploadedPhotoItem[]) => void
  maxPhotos?: number
}

export function PhotoUploader({
  photos,
  onPhotosChange,
  maxPhotos = 10,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressError, setCompressError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setCompressError(null)
    setIsCompressing(true)

    const remainingSlots = maxPhotos - photos.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    const newItems: UploadedPhotoItem[] = []

    for (const file of filesToProcess) {
      try {
        const compressed: CompressedImageResult = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.8,
        })

        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file: compressed.file,
          previewUrl: compressed.previewUrl,
          originalSizeBytes: compressed.originalSizeBytes,
          compressedSizeBytes: compressed.compressedSizeBytes,
          savedPercentage: compressed.savedPercentage,
          caption: '',
        })
      } catch (err: any) {
        console.error('Compression error:', err)
        setCompressError(err?.message || 'Gagal memproses salah satu gambar.')
      }
    }

    onPhotosChange([...photos, ...newItems])
    setIsCompressing(false)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (id: string) => {
    onPhotosChange(photos.filter((p) => p.id !== id))
  }

  const handleCaptionChange = (id: string, caption: string) => {
    onPhotosChange(
      photos.map((p) => (p.id === id ? { ...p, caption } : p))
    )
  }

  // Calculate total savings
  const totalOriginal = photos.reduce((acc, p) => acc + p.originalSizeBytes, 0)
  const totalCompressed = photos.reduce((acc, p) => acc + p.compressedSizeBytes, 0)
  const totalSaved = Math.max(0, totalOriginal - totalCompressed)
  const avgSavedPct = totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload Drag/Click Zone */}
      <div
        onClick={() => {
          if (photos.length < maxPhotos && !isCompressing) {
            fileInputRef.current?.click()
          }
        }}
        style={{
          border: '2px dashed var(--border-strong)',
          borderRadius: '12px',
          padding: '1.75rem 1.25rem',
          textAlign: 'center',
          backgroundColor: photos.length >= maxPhotos ? '#f8fafc' : '#ffffff',
          cursor: photos.length >= maxPhotos || isCompressing ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
        }}
      >
        {isCompressing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-700)' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary-600)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Mengompresi Foto Lapangan Otomatis...
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Mengoptimalkan resolusi dan ukuran file untuk menghemat bandwidth
            </span>
          </div>
        ) : photos.length >= maxPhotos ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Maksimum {maxPhotos} foto tercapai.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadCloud size={24} />
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'block' }}>
                Klik untuk Memilih atau Mengambil Foto Lapangan
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Mendukung JPG, PNG, WebP (Maksimum {maxPhotos} foto)
              </span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--primary-700)',
                background: 'var(--primary-50)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--primary-200)',
                marginTop: '0.25rem',
              }}
            >
              <Sparkles size={12} />
              <span>Kompresi Otomatis Aktif (&le; 800 KB per foto)</span>
            </div>
          </div>
        )}
      </div>

      {/* Compression Error Alert */}
      {compressError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-at-risk-bg)',
            border: '1px solid var(--status-at-risk)',
            color: 'var(--status-at-risk)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{compressError}</span>
        </div>
      )}

      {/* Summary Savings Banner */}
      {photos.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.625rem 0.875rem',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--primary-200)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-800)', fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: 'var(--primary-600)' }} />
            <span>{photos.length} Foto Siap Diunggah</span>
          </div>

          <div style={{ color: 'var(--text-secondary)' }}>
            Total: <strong>{formatBytes(totalCompressed)}</strong>{' '}
            <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
              (Hemat {formatBytes(totalSaved)} / -{avgSavedPct}%)
            </span>
          </div>
        </div>
      )}

      {/* Photos Grid List */}
      {photos.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {photos.map((item, idx) => (
            <div
              key={item.id}
              style={{
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {/* Image Preview Container */}
              <div style={{ position: 'relative', height: '160px', background: '#0f172a' }}>
                <img
                  src={item.previewUrl}
                  alt={`Foto ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Compression Tag Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '3px 7px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {formatBytes(item.compressedSizeBytes)}{' '}
                  <span style={{ color: '#4ade80' }}>(-{item.savedPercentage}%)</span>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(item.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                  title="Hapus foto ini"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Caption Input */}
              <div style={{ padding: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Keterangan foto (misal: Bibit mahoni plot barat)..."
                  value={item.caption}
                  onChange={(e) => handleCaptionChange(item.id, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-subtle)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
