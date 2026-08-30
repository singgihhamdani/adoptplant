'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ProjectNewPlotRedirect() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  useEffect(() => {
    if (projectId) {
      router.replace(`/plots/new?projectId=${projectId}`)
    } else {
      router.replace('/plots/new')
    }
  }, [projectId, router])

  return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      Mengarahkan ke form pendaftaran plot...
    </div>
  )
}
