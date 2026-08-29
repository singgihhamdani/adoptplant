export const APP_NAME = 'REHABTRACK'
export const APP_TAGLINE = 'Dari aksi penanaman menuju bukti pemulihan.'

export const INDONESIA_CENTER: [number, number] = [118.0149, -2.5489] // [lng, lat]
export const DEFAULT_MAP_ZOOM = 5

export const REHABILITATION_TYPE_LABELS: Record<string, string> = {
  REFORESTATION: 'Reforestasi Hutan',
  AGROFORESTRY: 'Agroforestri',
  MANGROVE_RESTORATION: 'Restorasi Mangrove',
  RIPARIAN_RESTORATION: 'Restorasi Sempadan Sungai',
  MINE_RECLAMATION: 'Reklamasi Bekas Tambang',
  WATERSHED_REHABILITATION: 'Rehabilitasi DAS',
  OTHER: 'Lainnya',
}

export const MONITORING_STATUS_CONFIG = {
  RECOVERING: {
    label: 'Pulih (Recovering)',
    color: 'var(--status-recovering)',
    bg: 'var(--status-recovering-bg)',
    badgeClass: 'badge-recovering',
  },
  MONITORING: {
    label: 'Pemantauan (Monitoring)',
    color: 'var(--status-monitoring)',
    bg: 'var(--status-monitoring-bg)',
    badgeClass: 'badge-monitoring',
  },
  AT_RISK: {
    label: 'Beresiko (At Risk)',
    color: 'var(--status-at-risk)',
    bg: 'var(--status-at-risk-bg)',
    badgeClass: 'badge-at-risk',
  },
}

export const PLANT_CONDITION_LABELS: Record<string, string> = {
  HEALTHY: 'Sehat',
  STRESSED: 'Stres / Sakit',
  DEAD: 'Mati',
  MISSING: 'Hilang',
  UNKNOWN: 'Tidak Diketahui',
}

export const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  PLANTING: 'Penanaman Awal',
  REPLANTING: 'Penyulaman Bibit',
  MAINTENANCE: 'Pembersihan & Pemeliharaan',
  FERTILIZATION: 'Pemupukan',
  WATERING: 'Penyiraman',
  PEST_CONTROL: 'Pengendalian Hama / Gulma',
  OTHER: 'Intervensi Lainnya',
}
