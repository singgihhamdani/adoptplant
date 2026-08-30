/**
 * Smart Spatial Inspector Utility
 * Performs fast client-side point-in-polygon and proximity queries
 * across Banjarnegara contextual layers (Administrasi, RTRW, Dasimetrik, BPBD).
 */

export interface SpatialInspectionResult {
  coordinates: [number, number] // [lng, lat]
  desa: string | null
  kecamatan: string | null
  polaRuang: string | null
  longsor: {
    kelas: string
    luasHa: number
    jiwaTerpapar: number
  } | null
  banjir: {
    kelas: string
    luasHa: number
    jiwaTerpapar: number
  } | null
  riwayatTerdekat: {
    title: string
    lokasi: string
    waktu: string
    dampak: string
    jarakMeter: number
  } | null
}

// In-memory cache for loaded GeoJSON datasets
const geojsonCache: {
  desa?: any
  polaRuang?: any
  longsor?: any
  banjir?: any
  riwayat?: any
} = {}

// Fetch dataset with cache
async function getGeoJSON(url: string, key: keyof typeof geojsonCache) {
  if (geojsonCache[key]) return geojsonCache[key]
  try {
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      geojsonCache[key] = data
      return data
    }
  } catch (err) {
    console.warn(`Failed to fetch ${url} for spatial inspector:`, err)
  }
  return null
}

// Ray-casting point-in-polygon algorithm for a single polygon ring
function isPointInRing(point: [number, number], ring: number[][]): boolean {
  let inside = false
  const [px, py] = point
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Check if point is inside GeoJSON geometry (Polygon or MultiPolygon)
function isPointInGeometry(point: [number, number], geom: any): boolean {
  if (!geom || !geom.coordinates) return false

  if (geom.type === 'Polygon') {
    const coords = geom.coordinates
    if (!coords || coords.length === 0) return false
    // Inside exterior ring and not inside any interior hole
    if (isPointInRing(point, coords[0])) {
      for (let i = 1; i < coords.length; i++) {
        if (isPointInRing(point, coords[i])) return false // In a hole
      }
      return true
    }
    return false
  }

  if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      if (isPointInRing(point, poly[0])) {
        let inHole = false
        for (let i = 1; i < poly.length; i++) {
          if (isPointInRing(point, poly[i])) {
            inHole = true
            break
          }
        }
        if (!inHole) return true
      }
    }
    return false
  }

  return false
}

// Haversine formula to calculate distance in meters
function getHaversineDistanceMeters(p1: [number, number], p2: [number, number]): number {
  const R = 6371000 // Earth radius in meters
  const rad = Math.PI / 180
  const lat1 = p1[1] * rad
  const lat2 = p2[1] * rad
  const dLat = (p2[1] - p1[1]) * rad
  const dLng = (p2[0] - p1[0]) * rad

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

/**
 * Preload all spatial datasets in background for instant inspection
 */
export function preloadSpatialDatasets() {
  getGeoJSON('/data/boundary/administrasi-desa.geojson', 'desa')
  getGeoJSON('/data/thematic/pola-ruang.geojson', 'polaRuang')
  getGeoJSON('/data/thematic/dasimetrik-longsor.geojson', 'longsor')
  getGeoJSON('/data/thematic/dasimetrik-banjir.geojson', 'banjir')
  getGeoJSON('/data/thematic/riwayat-longsor.geojson', 'riwayat')
}

/**
 * Main Spatial Inspection Function
 * Queries all layers for a given [lng, lat] coordinate point.
 */
export async function inspectSpatialPoint(
  lng: number,
  lat: number
): Promise<SpatialInspectionResult> {
  const point: [number, number] = [lng, lat]

  // Ensure datasets are loaded in parallel
  const [desaData, polaData, longsorData, banjirData, riwayatData] = await Promise.all([
    getGeoJSON('/data/boundary/administrasi-desa.geojson', 'desa'),
    getGeoJSON('/data/thematic/pola-ruang.geojson', 'polaRuang'),
    getGeoJSON('/data/thematic/dasimetrik-longsor.geojson', 'longsor'),
    getGeoJSON('/data/thematic/dasimetrik-banjir.geojson', 'banjir'),
    getGeoJSON('/data/thematic/riwayat-longsor.geojson', 'riwayat'),
  ])

  const result: SpatialInspectionResult = {
    coordinates: point,
    desa: null,
    kecamatan: null,
    polaRuang: null,
    longsor: null,
    banjir: null,
    riwayatTerdekat: null,
  }

  // 1. Check Administrasi Desa & Kecamatan
  if (desaData?.features) {
    for (const feat of desaData.features) {
      if (isPointInGeometry(point, feat.geometry)) {
        result.desa = feat.properties?.DESA || feat.properties?.desa || null
        result.kecamatan = feat.properties?.KECAMATAN || feat.properties?.kecamatan || null
        break
      }
    }
  }

  // 2. Check Pola Ruang (RTRW)
  if (polaData?.features) {
    for (const feat of polaData.features) {
      if (isPointInGeometry(point, feat.geometry)) {
        result.polaRuang = feat.properties?.POLA_RUANG || null
        break
      }
    }
  }

  // 3. Check Dasimetrik Longsor
  if (longsorData?.features) {
    for (const feat of longsorData.features) {
      if (isPointInGeometry(point, feat.geometry)) {
        const p = feat.properties || {}
        result.longsor = {
          kelas: p.KLS_BENC || 'Sedang',
          luasHa: Number(p.LUAS_HA) || 0,
          jiwaTerpapar: Math.round(Number(p.JML_JIWA) || 0),
        }
        if (!result.desa && p.NAMA_DESA) result.desa = p.NAMA_DESA
        if (!result.kecamatan && p.NAMA_KEC) result.kecamatan = p.NAMA_KEC
        break
      }
    }
  }

  // 4. Check Dasimetrik Banjir
  if (banjirData?.features) {
    for (const feat of banjirData.features) {
      if (isPointInGeometry(point, feat.geometry)) {
        const p = feat.properties || {}
        result.banjir = {
          kelas: p.KLS_BENC || 'Sedang',
          luasHa: Number(p.LUAS_HA) || 0,
          jiwaTerpapar: Math.round(Number(p.JML_JIWA) || 0),
        }
        break
      }
    }
  }

  // 5. Check Nearest BPBD Landslide Event
  if (riwayatData?.features && riwayatData.features.length > 0) {
    let minDistance = Infinity
    let nearestProps: any = null

    for (const feat of riwayatData.features) {
      const coords = feat.geometry?.coordinates
      if (coords && coords.length >= 2) {
        const dist = getHaversineDistanceMeters(point, [coords[0], coords[1]])
        if (dist < minDistance) {
          minDistance = dist
          nearestProps = feat.properties
        }
      }
    }

    if (nearestProps && minDistance <= 15000) {
      // within 15 km
      result.riwayatTerdekat = {
        title: nearestProps.title || 'Kejadian Tanah Longsor',
        lokasi: nearestProps.lokasi || '-',
        waktu: nearestProps.waktu || '-',
        dampak: nearestProps.dampak || 'Kerusakan infrastruktur / lereng',
        jarakMeter: minDistance,
      }
    }
  }

  return result
}
