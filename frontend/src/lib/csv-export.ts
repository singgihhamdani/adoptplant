import type { MonitoringWithRelations } from '@/hooks/use-monitoring'

/**
 * Clean and escape field for CSV compliance
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Trigger download of CSV file with UTF-8 BOM in browser
 */
function triggerDownload(csvContent: string, filename: string): void {
  // UTF-8 BOM for Microsoft Excel compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export field monitoring records to CSV
 */
export function exportMonitoringsToCSV(
  monitorings: MonitoringWithRelations[],
  filename: string = `rehabtrack-monitoring-${new Date().toISOString().split('T')[0]}.csv`
): void {
  const headers = [
    'ID Monitoring',
    'Tanggal Pengamatan',
    'Nama Plot',
    'Tipe Rehabilitasi',
    'Nama Proyek',
    'Lokasi',
    'Provinsi',
    'Latitude',
    'Longitude',
    'Akurasi GPS (m)',
    'Pohon Sehat',
    'Pohon Stres',
    'Pohon Mati',
    'Pohon Hilang',
    'Total Pohon Diamati',
    'Survival Rate (%)',
    'Rata-rata Tinggi (cm)',
    'Rata-rata Diameter (cm)',
    'Tutupan Kanopi (%)',
    'Petugas Pengamat',
    'Email Pengamat',
    'Catatan Lapangan',
    'Jumlah Foto',
    'Status Sinkronisasi',
    'Waktu Dibuat',
  ]

  const rows = monitorings.map((m) => {
    let lat: any = ''
    let lon: any = ''
    if (m.geom && m.geom.coordinates) {
      lon = m.geom.coordinates[0]
      lat = m.geom.coordinates[1]
    }

    const totalTrees =
      (m.healthy_count || 0) +
      (m.stressed_count || 0) +
      (m.dead_count || 0) +
      (m.missing_count || 0)

    return [
      escapeCSV(m.id),
      escapeCSV(m.date),
      escapeCSV(m.plot?.name || 'Plot Lahan'),
      escapeCSV(m.plot?.rehabilitation_type || ''),
      escapeCSV(m.plot?.project?.name || ''),
      escapeCSV(m.plot?.project?.location_name || ''),
      escapeCSV(m.plot?.project?.province || ''),
      escapeCSV(lat),
      escapeCSV(lon),
      escapeCSV(m.gps_accuracy_m ?? ''),
      escapeCSV(m.healthy_count ?? 0),
      escapeCSV(m.stressed_count ?? 0),
      escapeCSV(m.dead_count ?? 0),
      escapeCSV(m.missing_count ?? 0),
      escapeCSV(totalTrees),
      escapeCSV(m.survival_rate !== null ? `${m.survival_rate}%` : ''),
      escapeCSV(m.avg_height_cm ?? ''),
      escapeCSV(m.avg_diameter_cm ?? ''),
      escapeCSV(m.canopy_cover_pct !== null ? `${m.canopy_cover_pct}%` : ''),
      escapeCSV(m.observer?.name || ''),
      escapeCSV(m.observer?.email || ''),
      escapeCSV(m.notes || ''),
      escapeCSV(m.photos?.length || 0),
      escapeCSV(m.sync_status || 'SYNCED'),
      escapeCSV(m.created_at || ''),
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\r\n')
  triggerDownload(csvContent, filename)
}

/**
 * Export plots summary to CSV
 */
export function exportPlotsToCSV(
  plots: any[],
  filename: string = `rehabtrack-plots-${new Date().toISOString().split('T')[0]}.csv`
): void {
  const headers = [
    'ID Plot',
    'Nama Plot',
    'Nama Proyek',
    'Lokasi Proyek',
    'Provinsi',
    'Tipe Rehabilitasi',
    'Luas (m2)',
    'Luas (ha)',
    'Target Bibit',
    'Tanggal Baseline',
    'Status Pemulihan',
    'Dapat Diadopsi',
    'Tanggal Dibuat',
  ]

  const rows = plots.map((p) => {
    const areaHa = p.area_m2 ? (p.area_m2 / 10000).toFixed(2) : '0'
    return [
      escapeCSV(p.id),
      escapeCSV(p.name),
      escapeCSV(p.project?.name || p.project_name || ''),
      escapeCSV(p.project?.location_name || ''),
      escapeCSV(p.project?.province || ''),
      escapeCSV(p.rehabilitation_type || ''),
      escapeCSV(p.area_m2 || 0),
      escapeCSV(areaHa),
      escapeCSV(p.target_plants ?? ''),
      escapeCSV(p.baseline_date || ''),
      escapeCSV(p.monitoring_status || ''),
      escapeCSV(p.adoptable ? 'Ya' : 'Tidak'),
      escapeCSV(p.created_at || ''),
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\r\n')
  triggerDownload(csvContent, filename)
}
