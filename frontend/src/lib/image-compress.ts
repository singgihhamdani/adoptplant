/**
 * Client-Side Image Compression Utility
 * Compresses camera/field photos using HTML5 Canvas before uploading to Supabase Storage.
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: 'image/jpeg' | 'image/webp'
}

export interface CompressedImageResult {
  file: File
  originalSizeBytes: number
  compressedSizeBytes: number
  savedPercentage: number
  previewUrl: string
  width: number
  height: number
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    // If file is not an image, return error
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar valid.'))
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate proportional aspect ratio resize
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            maxHeight ? (height = maxHeight) : height
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Gagal menginisialisasi Canvas Context untuk kompresi.'))
          return
        }

        // Draw and smoothly interpolate
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal menghasilkan blob gambar terkompresi.'))
              return
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg')
            const compressedFile = new File([blob], cleanFileName, {
              type: mimeType,
              lastModified: Date.now(),
            })

            const originalSizeBytes = file.size
            const compressedSizeBytes = compressedFile.size
            const savedPercentage = Math.max(
              0,
              Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
            )
            const previewUrl = URL.createObjectURL(blob)

            resolve({
              file: compressedFile,
              originalSizeBytes,
              compressedSizeBytes,
              savedPercentage,
              previewUrl,
              width,
              height,
            })
          },
          mimeType,
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('Gagal memuat gambar untuk proses kompresi.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar.'))
    }
  })
}
