import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'REHABTRACK — Platform Monitoring & Evaluasi Pemulihan Lahan',
  description: 'Dari aksi penanaman menuju bukti pemulihan. Sistem monitoring rehabilitasi berbasis spasial, time series, dan remote sensing.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'REHABTRACK',
  },
}

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" data-theme="dark" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
