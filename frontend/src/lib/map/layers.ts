export interface LayerGroupConfig {
  id: string
  name: string
  icon: string
  description: string
  layers: MapLayerConfig[]
}

export interface MapLayerConfig {
  id: string
  name: string
  sourceId: string
  geojsonUrl: string
  type: 'line' | 'fill' | 'circle' | 'symbol'
  defaultVisible: boolean
  minZoom?: number
  maxZoom?: number
  layout?: Record<string, any>
  paint: Record<string, any>
  legend?: {
    type: 'category' | 'risk' | 'simple'
    items: { label: string; color: string; description?: string }[]
  }
}

export const POLA_RUANG_COLORS: Record<string, string> = {
  'HUTAN LINDUNG': '#15803d',
  'HUTAN PRODUKSI TETAP': '#16a34a',
  'HUTAN PRODUKSI TERBATAS': '#22c55e',
  'KAWASAN LINDUNG BAWAHANNYA': '#0f766e',
  'SEMPADAN SUNGAI': '#06b6d4',
  'AIR TAWAR': '#0284c7',
  'PERTANIAN SAWAH IRIGASI': '#84cc16',
  'PERTANIAN LAHAN BASAH': '#65a30d',
  'PERTANIAN LAHAN KERING': '#d97706',
  'PERTANIAN HORTIKULTURA': '#ea580c',
  'PERMUKIMAN PERKOTAAN': '#64748b',
  'PERMUKIMAN PERDESAAN': '#94a3b8',
  'SEMPADAN PERKOTAAN': '#71717a',
  'INDUSTRI': '#7c3aed',
}

export const HAZARD_COLORS = {
  Tinggi: '#ef4444',
  Sedang: '#f97316',
  Rendah: '#eab308',
}

export const LAYER_GROUPS: LayerGroupConfig[] = [
  {
    id: 'administrasi',
    name: 'Batas Administrasi',
    icon: 'MapPin',
    description: 'Batas wilayah 18 Kecamatan & 276 Desa di Kabupaten Banjarnegara',
    layers: [
      {
        id: 'layer-kecamatan-fill',
        name: 'Wilayah Kecamatan (Area)',
        sourceId: 'src-kecamatan',
        geojsonUrl: '/geojson/administrasi-kecamatan.geojson',
        type: 'fill',
        defaultVisible: true,
        paint: {
          'fill-color': '#059669',
          'fill-opacity': 0.12,
        },
        legend: {
          type: 'simple',
          items: [{ label: '18 Kecamatan Banjarnegara', color: '#059669' }],
        },
      },
      {
        id: 'layer-kecamatan-line',
        name: 'Batas Kecamatan (Garis Tegas)',
        sourceId: 'src-kecamatan',
        geojsonUrl: '/geojson/administrasi-kecamatan.geojson',
        type: 'line',
        defaultVisible: true,
        paint: {
          'line-color': '#047857',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 12, 3.2, 16, 5],
          'line-opacity': 1.0,
        },
        legend: {
          type: 'simple',
          items: [{ label: 'Garis Batas Kecamatan', color: '#047857' }],
        },
      },
      {
        id: 'layer-desa-line',
        name: 'Batas Desa / Kelurahan (Garis)',
        sourceId: 'src-desa',
        geojsonUrl: '/geojson/administrasi-desa.geojson',
        type: 'line',
        defaultVisible: true,
        paint: {
          'line-color': '#2563eb',
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.0, 13, 1.8, 16, 3],
          'line-dasharray': [3, 2],
          'line-opacity': 0.85,
        },
        legend: {
          type: 'simple',
          items: [{ label: 'Batas 276 Desa', color: '#2563eb' }],
        },
      },
    ],
  },
  {
    id: 'tata-ruang',
    name: 'Pola Ruang (Tata Guna Lahan)',
    icon: 'Layers',
    description: 'Zonasi peruntukan kawasan hutan, pertanian, dan lindung',
    layers: [
      {
        id: 'layer-pola-ruang-fill',
        name: 'Kawasan Pola Ruang',
        sourceId: 'src-pola-ruang',
        geojsonUrl: '/geojson/pola-ruang.geojson',
        type: 'fill',
        defaultVisible: false,
        paint: {
          'fill-color': [
            'match',
            ['get', 'POLA_RUANG'],
            'HUTAN LINDUNG', POLA_RUANG_COLORS['HUTAN LINDUNG'],
            'HUTAN PRODUKSI TETAP', POLA_RUANG_COLORS['HUTAN PRODUKSI TETAP'],
            'HUTAN PRODUKSI TERBATAS', POLA_RUANG_COLORS['HUTAN PRODUKSI TERBATAS'],
            'KAWASAN LINDUNG BAWAHANNYA', POLA_RUANG_COLORS['KAWASAN LINDUNG BAWAHANNYA'],
            'SEMPADAN SUNGAI', POLA_RUANG_COLORS['SEMPADAN SUNGAI'],
            'AIR TAWAR', POLA_RUANG_COLORS['AIR TAWAR'],
            'PERTANIAN SAWAH IRIGASI', POLA_RUANG_COLORS['PERTANIAN SAWAH IRIGASI'],
            'PERTANIAN LAHAN BASAH', POLA_RUANG_COLORS['PERTANIAN LAHAN BASAH'],
            'PERTANIAN LAHAN KERING', POLA_RUANG_COLORS['PERTANIAN LAHAN KERING'],
            'PERTANIAN HORTIKULTURA', POLA_RUANG_COLORS['PERTANIAN HORTIKULTURA'],
            'PERMUKIMAN PERKOTAAN', POLA_RUANG_COLORS['PERMUKIMAN PERKOTAAN'],
            'PERMUKIMAN PERDESAAN', POLA_RUANG_COLORS['PERMUKIMAN PERDESAAN'],
            'SEMPADAN PERKOTAAN', POLA_RUANG_COLORS['SEMPADAN PERKOTAAN'],
            'INDUSTRI', POLA_RUANG_COLORS['INDUSTRI'],
            '#9ca3af',
          ],
          'fill-opacity': 0.45,
          'fill-outline-color': '#ffffff',
        },
        legend: {
          type: 'category',
          items: Object.entries(POLA_RUANG_COLORS).map(([label, color]) => ({
            label,
            color,
          })),
        },
      },
    ],
  },
  {
    id: 'kerawanan-bencana',
    name: 'Kerawanan Bencana',
    icon: 'AlertTriangle',
    description: 'Zona potensi risiko longsor, banjir bandang, gempa & likuifaksi',
    layers: [
      {
        id: 'layer-rawan-longsor-fill',
        name: 'Kerawanan Tanah Longsor',
        sourceId: 'src-rawan-longsor',
        geojsonUrl: '/geojson/rawan-longsor.geojson',
        type: 'fill',
        defaultVisible: false,
        paint: {
          'fill-color': [
            'match',
            ['get', 'Keterangan'],
            'Tinggi', HAZARD_COLORS.Tinggi,
            'Sedang', HAZARD_COLORS.Sedang,
            'Rendah', HAZARD_COLORS.Rendah,
            '#d1d5db',
          ],
          'fill-opacity': 0.45,
          'fill-outline-color': '#b91c1c',
        },
        legend: {
          type: 'risk',
          items: [
            { label: 'Tinggi', color: HAZARD_COLORS.Tinggi, description: 'Sangat rawan longsor' },
            { label: 'Sedang', color: HAZARD_COLORS.Sedang, description: 'Potensi longsor menengah' },
            { label: 'Rendah', color: HAZARD_COLORS.Rendah, description: 'Potensi longsor rendah' },
          ],
        },
      },
      {
        id: 'layer-rawan-banjir-bandang-fill',
        name: 'Kerawanan Banjir Bandang',
        sourceId: 'src-rawan-banjir-bandang',
        geojsonUrl: '/geojson/rawan-banjir-bandang.geojson',
        type: 'fill',
        defaultVisible: false,
        paint: {
          'fill-color': [
            'match',
            ['get', 'Keterangan'],
            'Tinggi', '#2563eb',
            'Sedang', '#60a5fa',
            'Rendah', '#93c5fd',
            '#bfdbfe',
          ],
          'fill-opacity': 0.45,
          'fill-outline-color': '#1d4ed8',
        },
        legend: {
          type: 'risk',
          items: [
            { label: 'Tinggi', color: '#2563eb' },
            { label: 'Sedang', color: '#60a5fa' },
            { label: 'Rendah', color: '#93c5fd' },
          ],
        },
      },
      {
        id: 'layer-rawan-banjir-fill',
        name: 'Kerawanan Genangan Banjir',
        sourceId: 'src-rawan-banjir',
        geojsonUrl: '/geojson/rawan-banjir.geojson',
        type: 'fill',
        defaultVisible: false,
        paint: {
          'fill-color': [
            'match',
            ['get', 'Keterangan'],
            'Tinggi', '#0284c7',
            'Sedang', '#38bdf8',
            'Rendah', '#7dd3fc',
            '#bae6fd',
          ],
          'fill-opacity': 0.4,
          'fill-outline-color': '#0369a1',
        },
        legend: {
          type: 'risk',
          items: [
            { label: 'Tinggi', color: '#0284c7' },
            { label: 'Sedang', color: '#38bdf8' },
            { label: 'Rendah', color: '#7dd3fc' },
          ],
        },
      },
      {
        id: 'layer-rawan-gempa-fill',
        name: 'Kerawanan Gempa Bumi',
        sourceId: 'src-rawan-gempa',
        geojsonUrl: '/geojson/rawan-gempa.geojson',
        type: 'fill',
        defaultVisible: false,
        paint: {
          'fill-color': [
            'match',
            ['get', 'Keterangan'],
            'Sedang', '#a855f7',
            'Rendah', '#c084fc',
            '#e9d5ff',
          ],
          'fill-opacity': 0.35,
          'fill-outline-color': '#7e22ce',
        },
        legend: {
          type: 'risk',
          items: [
            { label: 'Sedang', color: '#a855f7' },
            { label: 'Rendah', color: '#c084fc' },
          ],
        },
      },
      {
        id: 'layer-rawan-likuifaksi-fill',
        name: 'Kerawanan Likuifaksi',
        sourceId: 'src-rawan-likuifaksi',
        geojsonUrl: '/geojson/rawan-likuifaksi.geojson',
        type: 'fill',
        defaultVisible: false,
        paint: {
          'fill-color': [
            'match',
            ['get', 'Keterangan'],
            'Sedang', '#ec4899',
            'Rendah', '#f472b6',
            '#fbcfe8',
          ],
          'fill-opacity': 0.35,
          'fill-outline-color': '#be185d',
        },
        legend: {
          type: 'risk',
          items: [
            { label: 'Sedang', color: '#ec4899' },
            { label: 'Rendah', color: '#f472b6' },
          ],
        },
      },
    ],
  },
  {
    id: 'riwayat-kejadian',
    name: 'Riwayat Kejadian Bencana',
    icon: 'History',
    description: 'Titik historis kejadian tanah longsor BPBD Banjarnegara (2022–2026)',
    layers: [
      {
        id: 'layer-riwayat-longsor-points',
        name: 'Titik Kejadian Longsor',
        sourceId: 'src-riwayat-longsor',
        geojsonUrl: '/geojson/riwayat-longsor.geojson',
        type: 'circle',
        defaultVisible: false,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 5, 13, 8, 16, 12],
          'circle-color': '#dc2626',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
        legend: {
          type: 'simple',
          items: [{ label: 'Titik Kejadian Longsor (249 titik)', color: '#dc2626' }],
        },
      },
    ],
  },
]
