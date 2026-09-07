'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BANJARNEGARA_MAP_CONFIG } from '@/lib/map/config'
import { LayerControl } from './layer-control'
import {
  RotateCcw,
  Trash2,
  MapPin,
  Info,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Crosshair,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  inspectSpatialPoint,
  preloadSpatialDatasets,
  isCoordinateWithinBanjarnegaraBBox,
  type SpatialInspectionResult,
} from '@/lib/map/spatial-inspector'
import 'leaflet/dist/leaflet.css'

export interface PlotMapDrawerProps {
  initialPolygon?: [number, number][] // [[lng, lat], ...]
  onPolygonChange: (
    polygonGeoJSON: any,
    areaM2: number,
    spatialInspection?: SpatialInspectionResult | null
  ) => void
  center?: [number, number] // [lng, lat]
  zoom?: number
  height?: string | number
  showLayerControls?: boolean
  targetBeacon?: [number, number] | null // [lng, lat] from /map
}

const LEAFLET_BASEMAPS = {
  satellite: {
    name: 'Citra Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  'esri-canvas': {
    name: 'Clean Light Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  'esri-topo': {
    name: 'Topografi & Kontur',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
}

const POLA_RUANG_COLORS: Record<string, string> = {
  'HUTAN LINDUNG': '#047857',
  'HUTAN PRODUKSI TERBATAS': '#15803d',
  'HUTAN PRODUKSI TETAP': '#4d7c0f',
  'KAWASAN LINDUNG BAWAHANNYA': '#059669',
  'SEMPADAN SUNGAI': '#0d9488',
  'SEMPADAN PERKOTAAN': '#0284c7',
  'PERTANIAN HORTIKULTURA': '#84cc16',
  'PERTANIAN LAHAN BASAH': '#65a30d',
  'PERTANIAN SAWAH IRIGASI': '#a3e635',
  'PERTANIAN LAHAN KERING': '#eab308',
  'AIR TAWAR': '#3b82f6',
  'PERMUKIMAN PERDESAAN': '#f97316',
  'PERMUKIMAN PERKOTAAN': '#ef4444',
  INDUSTRI: '#8b5cf6',
}

// Calculate geodesic area on Earth in m²
export function calculatePolygonAreaM2(coords: [number, number][]): number {
  if (coords.length < 3) return 0
  const radius = 6378137 // WGS84 Earth radius in meters
  let total = 0

  const ring = [...coords]
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0])
  }

  for (let i = 0; i < ring.length - 1; i++) {
    const p1 = ring[i]
    const p2 = ring[i + 1]
    const lat1 = (p1[1] * Math.PI) / 180
    const lat2 = (p2[1] * Math.PI) / 180
    const lon1 = (p1[0] * Math.PI) / 180
    const lon2 = (p2[0] * Math.PI) / 180
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  return Math.abs((total * radius * radius) / 2)
}

// Calculate centroid of polygon points
export function getPolygonCentroid(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return [109.698, -7.397]
  let sumLng = 0
  let sumLat = 0
  for (const pt of coords) {
    sumLng += pt[0]
    sumLat += pt[1]
  }
  return [sumLng / coords.length, sumLat / coords.length]
}

export function PlotMapDrawer({
  initialPolygon = [],
  onPolygonChange,
  center = BANJARNEGARA_MAP_CONFIG.center, // [lng, lat]
  zoom = 13,
  height = '480px',
  showLayerControls = true,
  targetBeacon = null,
}: PlotMapDrawerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const polygonLayerRef = useRef<any>(null)
  const markersLayerGroupRef = useRef<any>(null)
  const beaconMarkerRef = useRef<any>(null)

  // Contextual Layers
  const kecamatanLayerRef = useRef<any>(null)
  const desaLayerRef = useRef<any>(null)
  const polaRuangLayerRef = useRef<any>(null)
  const dasimetrikLongsorLayerRef = useRef<any>(null)
  const dasimetrikBanjirLayerRef = useRef<any>(null)
  const riwayatLongsorLayerRef = useRef<any>(null)

  const [points, setPoints] = useState<[number, number][]>(initialPolygon) // [[lng, lat], ...]
  const [currentBasemap, setCurrentBasemap] = useState('satellite')
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Layer toggles
  const [showKecamatan, setShowKecamatan] = useState(true)
  const [showDesa, setShowDesa] = useState(false)
  const [showPolaRuang, setShowPolaRuang] = useState(false)
  const [showDasimetrikLongsor, setShowDasimetrikLongsor] = useState(false)
  const [showDasimetrikBanjir, setShowDasimetrikBanjir] = useState(false)
  const [showRiwayatLongsor, setShowRiwayatLongsor] = useState(false)
  const [isLoadingThematic, setIsLoadingThematic] = useState<string | null>(null)
  const [boundaryWarning, setBoundaryWarning] = useState<string | null>(null)

  const effectiveCenter: [number, number] = targetBeacon ? targetBeacon : center
  const effectiveZoom: number = targetBeacon ? 15 : zoom

  const areaM2 = calculatePolygonAreaM2(points)
  const areaHa = (areaM2 / 10000).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Preload spatial datasets in background
  useEffect(() => {
    preloadSpatialDatasets()
  }, [])

  // Keep drawing markers & polygon on top of contextual layers
  const bringDrawingsToFront = () => {
    if (polygonLayerRef.current) {
      polygonLayerRef.current.bringToFront()
    }
    if (markersLayerGroupRef.current) {
      const map = mapInstanceRef.current
      if (map && map.hasLayer(markersLayerGroupRef.current)) {
        markersLayerGroupRef.current.bringToFront?.()
      }
    }
    if (beaconMarkerRef.current) {
      const map = mapInstanceRef.current
      if (map && map.hasLayer(beaconMarkerRef.current)) {
        beaconMarkerRef.current.bringToFront?.()
      }
    }
  }

  // Render polygon & vertex markers on Leaflet
  const renderLeafletDrawings = async (currentPoints: [number, number][]) => {
    const map = mapInstanceRef.current
    if (!map) return

    const L = (await import('leaflet')).default

    // 1. Clear old markers & polygon
    if (markersLayerGroupRef.current) {
      markersLayerGroupRef.current.clearLayers()
    } else {
      markersLayerGroupRef.current = L.layerGroup().addTo(map)
    }

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current)
      polygonLayerRef.current = null
    }

    if (currentPoints.length === 0) return

    // 2. Add vertex circle markers with number labels
    currentPoints.forEach((pt, idx) => {
      const latlng = [pt[1], pt[0]] // Leaflet takes [lat, lng]

      const marker = L.circleMarker(latlng as [number, number], {
        radius: 7,
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#10b981', // Emerald green
        fillOpacity: 1,
      })

      marker.bindTooltip(`<strong>Titik ${idx + 1}</strong>`, {
        permanent: false,
        direction: 'top',
        offset: [0, -8],
      })

      markersLayerGroupRef.current.addLayer(marker)
    })

    // 3. Add connecting line or filled polygon
    const leafletLatLngs = currentPoints.map((pt) => [pt[1], pt[0]])

    if (currentPoints.length === 2) {
      // Draw connecting dashed line
      polygonLayerRef.current = L.polyline(leafletLatLngs as [number, number][], {
        color: '#059669',
        weight: 3,
        dashArray: '6, 6',
      }).addTo(map)
    } else if (currentPoints.length >= 3) {
      // Draw closed polygon with fill
      polygonLayerRef.current = L.polygon(leafletLatLngs as [number, number][], {
        color: '#059669',
        weight: 3,
        fillColor: '#10b981',
        fillOpacity: 0.35,
      }).addTo(map)
    }

    bringDrawingsToFront()
  }

  // Notify parent on points change and run spatial inspection
  useEffect(() => {
    let isCancelled = false

    async function handlePointsUpdate() {
      if (points.length >= 3) {
        const closedCoordinates = [...points, points[0]]
        const geojson = {
          type: 'Polygon',
          coordinates: [closedCoordinates],
        }

        const centroid = getPolygonCentroid(points)
        const inspection = await inspectSpatialPoint(centroid[0], centroid[1])

        if (!isCancelled) {
          onPolygonChange(geojson, areaM2, inspection)
        }
      } else {
        if (!isCancelled) {
          onPolygonChange(null, 0, null)
        }
      }

      if (isMapLoaded && !isCancelled) {
        renderLeafletDrawings(points)
      }
    }

    handlePointsUpdate()

    return () => {
      isCancelled = true
    }
  }, [points, isMapLoaded])

  // Invalidate map size when fullscreen toggles
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize()
      }, 150)
    }
  }, [isFullscreen])

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false

    async function initLeaflet() {
      if (!mapContainerRef.current) return

      try {
        const L = (await import('leaflet')).default

        if (isCancelled || !mapContainerRef.current) return

        const map = L.map(mapContainerRef.current, {
          center: [effectiveCenter[1], effectiveCenter[0]],
          zoom: effectiveZoom,
          minZoom: 8,
          maxZoom: 19,
          maxBounds: [
            [-7.85, 109.15],
            [-6.95, 110.25],
          ],
          maxBoundsViscosity: 0.85,
          zoomControl: false,
        })

        mapInstanceRef.current = map

        L.control.zoom({ position: 'topleft' }).addTo(map)
        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

        // Add initial basemap tile layer
        const baseConfig = LEAFLET_BASEMAPS['satellite']
        tileLayerRef.current = L.tileLayer(baseConfig.url, {
          attribution: baseConfig.attribution,
          maxZoom: baseConfig.maxZoom,
        }).addTo(map)

        markersLayerGroupRef.current = L.layerGroup().addTo(map)

        // Add Pulsing Target Radar Beacon if coming from /map
        if (targetBeacon) {
          const beaconIcon = L.divIcon({
            className: 'radar-beacon-div-icon',
            html: `
              <div class="radar-beacon-container">
                <div class="radar-beacon-ripple"></div>
                <div class="radar-beacon-ripple-delayed"></div>
                <div class="radar-beacon-dot"></div>
              </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          })

          const beacon = L.marker([targetBeacon[1], targetBeacon[0]], { icon: beaconIcon })
            .bindTooltip(
              `<strong>🎯 Target Pilihan Peta Spasial</strong><br/><span style="font-size:10px;color:#64748b;">Mulai klik titik sudut batas di sekitar radar ini</span>`,
              {
                permanent: true,
                direction: 'top',
                offset: [0, -18],
              }
            )
            .addTo(map)

          beaconMarkerRef.current = beacon
        }

        // Fetch & Add Batas Kecamatan (Default Visible)
        try {
          const kecRes = await fetch('/data/boundary/administrasi-kecamatan.geojson')
          if (kecRes.ok) {
            const kecGeoJSON = await kecRes.json()
            if (!isCancelled) {
              const kecLayer = L.geoJSON(kecGeoJSON, {
                style: {
                  color: '#f59e0b',
                  weight: 2.2,
                  dashArray: '6, 6',
                  opacity: 0.95,
                  fillColor: 'transparent',
                  fillOpacity: 0,
                },
                onEachFeature: (feature, layer) => {
                  const kecName = feature.properties?.KECAMATAN || 'Kecamatan'
                  layer.bindTooltip(`<strong>Kecamatan ${kecName}</strong>`, { sticky: true })
                },
              })

              kecamatanLayerRef.current = kecLayer
              if (showKecamatan) {
                kecLayer.addTo(map)
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load kecamatan in drawer:', err)
        }

        // Fetch & Add Batas Desa
        try {
          const desaRes = await fetch('/data/boundary/administrasi-desa.geojson')
          if (desaRes.ok) {
            const desaGeoJSON = await desaRes.json()
            if (!isCancelled) {
              const desaLayer = L.geoJSON(desaGeoJSON, {
                style: {
                  color: '#06b6d4',
                  weight: 1.5,
                  dashArray: '3, 3',
                  opacity: 0.9,
                  fillColor: 'transparent',
                  fillOpacity: 0,
                },
                onEachFeature: (feature, layer) => {
                  const desaName = feature.properties?.DESA || feature.properties?.desa || 'Desa'
                  const kecName = feature.properties?.KECAMATAN || feature.properties?.kecamatan || ''
                  layer.bindTooltip(`<strong>Desa ${desaName}</strong>${kecName ? ` (${kecName})` : ''}`, { sticky: true })
                },
              })

              desaLayerRef.current = desaLayer
              if (showDesa) {
                desaLayer.addTo(map)
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load desa in drawer:', err)
        }

        // Handle Map Click to add points with Spatial Guard
        map.on('click', (e: any) => {
          const lat = parseFloat(e.latlng.lat.toFixed(6))
          const lng = parseFloat(e.latlng.lng.toFixed(6))

          if (!isCoordinateWithinBanjarnegaraBBox(lng, lat)) {
            setBoundaryWarning('⚠️ Titik dilarang: Koordinat berada di luar batas wilayah Kabupaten Banjarnegara!')
            setTimeout(() => setBoundaryWarning(null), 4500)
            return
          }

          setBoundaryWarning(null)
          setPoints((prev) => [...prev, [lng, lat]])
        })

        setIsMapLoaded(true)
        setTimeout(() => {
          map.invalidateSize()
        }, 200)
      } catch (err) {
        console.error('Drawer Map Leaflet error:', err)
      }
    }

    initLeaflet()

    return () => {
      isCancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Basemap switch
  const handleBasemapChange = async (bmId: string) => {
    const map = mapInstanceRef.current
    if (!map) return
    setCurrentBasemap(bmId)

    const L = (await import('leaflet')).default
    const baseConfig = LEAFLET_BASEMAPS[bmId as keyof typeof LEAFLET_BASEMAPS] || LEAFLET_BASEMAPS['satellite']

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    tileLayerRef.current = L.tileLayer(baseConfig.url, {
      attribution: baseConfig.attribution,
      maxZoom: baseConfig.maxZoom,
    }).addTo(map)

    bringDrawingsToFront()
  }

  // Toggle Kecamatan
  const handleToggleKecamatan = (visible: boolean) => {
    setShowKecamatan(visible)
    const map = mapInstanceRef.current
    const layer = kecamatanLayerRef.current
    if (!map || !layer) return

    if (visible) {
      if (!map.hasLayer(layer)) {
        layer.addTo(map)
        bringDrawingsToFront()
      }
    } else {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    }
  }

  // Toggle Desa
  const handleToggleDesa = (visible: boolean) => {
    setShowDesa(visible)
    const map = mapInstanceRef.current
    const layer = desaLayerRef.current
    if (!map || !layer) return

    if (visible) {
      if (!map.hasLayer(layer)) {
        layer.addTo(map)
        bringDrawingsToFront()
      }
    } else {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    }
  }

  // Toggle Pola Ruang
  const handleTogglePolaRuang = async (visible: boolean) => {
    setShowPolaRuang(visible)
    const map = mapInstanceRef.current
    if (!map) return

    if (!visible) {
      if (polaRuangLayerRef.current && map.hasLayer(polaRuangLayerRef.current)) {
        map.removeLayer(polaRuangLayerRef.current)
      }
      return
    }

    if (polaRuangLayerRef.current) {
      if (!map.hasLayer(polaRuangLayerRef.current)) {
        polaRuangLayerRef.current.addTo(map)
        bringDrawingsToFront()
      }
      return
    }

    setIsLoadingThematic('pola-ruang')
    try {
      const res = await fetch('/data/thematic/pola-ruang.geojson')
      if (res.ok) {
        const data = await res.json()
        const L = (await import('leaflet')).default

        const layer = L.geoJSON(data, {
          style: (feature) => {
            const pr = feature?.properties?.POLA_RUANG || ''
            const color = POLA_RUANG_COLORS[pr] || '#64748b'
            return {
              color: color,
              weight: 1.0,
              opacity: 0.8,
              fillColor: color,
              fillOpacity: 0.35,
            }
          },
          onEachFeature: (feature, l) => {
            const pr = feature.properties?.POLA_RUANG || 'Kawasan'
            l.bindTooltip(`<strong>Pola Ruang:</strong> ${pr}`, { sticky: true })
          },
        })

        polaRuangLayerRef.current = layer
        layer.addTo(map)
        bringDrawingsToFront()
      }
    } catch (err) {
      console.warn('Failed to load Pola Ruang GeoJSON in drawer:', err)
    } finally {
      setIsLoadingThematic(null)
    }
  }

  // Toggle Bahaya Longsor Dasimetrik
  const handleToggleDasimetrikLongsor = async (visible: boolean) => {
    setShowDasimetrikLongsor(visible)
    const map = mapInstanceRef.current
    if (!map) return

    if (!visible) {
      if (dasimetrikLongsorLayerRef.current && map.hasLayer(dasimetrikLongsorLayerRef.current)) {
        map.removeLayer(dasimetrikLongsorLayerRef.current)
      }
      return
    }

    if (dasimetrikLongsorLayerRef.current) {
      if (!map.hasLayer(dasimetrikLongsorLayerRef.current)) {
        dasimetrikLongsorLayerRef.current.addTo(map)
        bringDrawingsToFront()
      }
      return
    }

    setIsLoadingThematic('dasimetrik-longsor')
    try {
      const res = await fetch('/data/thematic/dasimetrik-longsor.geojson')
      if (res.ok) {
        const data = await res.json()
        const L = (await import('leaflet')).default

        const layer = L.geoJSON(data, {
          style: (feature) => {
            const kls = feature?.properties?.KLS_BENC || 'Sedang'
            let fillColor = '#f59e0b'
            let borderColor = '#d97706'
            let fillOpacity = 0.45

            if (kls === 'Tinggi') {
              fillColor = '#ef4444'
              borderColor = '#dc2626'
              fillOpacity = 0.50
            } else if (kls === 'Rendah') {
              fillColor = '#22c55e'
              borderColor = '#16a34a'
              fillOpacity = 0.40
            }

            return {
              color: borderColor,
              weight: 0.8,
              opacity: 0.9,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
            }
          },
          onEachFeature: (feature, l) => {
            const p = feature.properties || {}
            const desa = p.NAMA_DESA || 'Desa'
            const kls = p.KLS_BENC || 'Sedang'
            const jiwa = p.JML_JIWA !== undefined ? Math.round(Number(p.JML_JIWA)) : 0
            l.bindTooltip(`<strong>Desa ${desa}</strong> (${kls}) &bull; 👥 <strong>${jiwa.toLocaleString()} Jiwa</strong>`, { sticky: true })
          },
        })

        dasimetrikLongsorLayerRef.current = layer
        layer.addTo(map)
        bringDrawingsToFront()
      }
    } catch (err) {
      console.warn('Failed to load Dasimetrik Longsor GeoJSON in drawer:', err)
    } finally {
      setIsLoadingThematic(null)
    }
  }

  // Toggle Bahaya Banjir Dasimetrik
  const handleToggleDasimetrikBanjir = async (visible: boolean) => {
    setShowDasimetrikBanjir(visible)
    const map = mapInstanceRef.current
    if (!map) return

    if (!visible) {
      if (dasimetrikBanjirLayerRef.current && map.hasLayer(dasimetrikBanjirLayerRef.current)) {
        map.removeLayer(dasimetrikBanjirLayerRef.current)
      }
      return
    }

    if (dasimetrikBanjirLayerRef.current) {
      if (!map.hasLayer(dasimetrikBanjirLayerRef.current)) {
        dasimetrikBanjirLayerRef.current.addTo(map)
        bringDrawingsToFront()
      }
      return
    }

    setIsLoadingThematic('dasimetrik-banjir')
    try {
      const res = await fetch('/data/thematic/dasimetrik-banjir.geojson')
      if (res.ok) {
        const data = await res.json()
        const L = (await import('leaflet')).default

        const layer = L.geoJSON(data, {
          style: (feature) => {
            const kls = feature?.properties?.KLS_BENC || 'Sedang'
            let color = '#3b82f6'
            let fillOpacity = 0.45

            if (kls === 'Tinggi') {
              color = '#1d4ed8'
              fillOpacity = 0.55
            } else if (kls === 'Rendah') {
              color = '#60a5fa'
              fillOpacity = 0.35
            }

            return {
              color: color,
              weight: 0.8,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: fillOpacity,
            }
          },
          onEachFeature: (feature, l) => {
            const p = feature.properties || {}
            const desa = p.NAMA_DESA || 'Desa'
            const jiwa = p.JML_JIWA !== undefined ? Math.round(Number(p.JML_JIWA)) : 0
            l.bindTooltip(`<strong>Desa ${desa}</strong> &bull; 👥 <strong>${jiwa.toLocaleString()} Jiwa</strong>`, { sticky: true })
          },
        })

        dasimetrikBanjirLayerRef.current = layer
        layer.addTo(map)
        bringDrawingsToFront()
      }
    } catch (err) {
      console.warn('Failed to load Dasimetrik Banjir GeoJSON in drawer:', err)
    } finally {
      setIsLoadingThematic(null)
    }
  }

  // Toggle Riwayat Longsor BPBD
  const handleToggleRiwayatLongsor = async (visible: boolean) => {
    setShowRiwayatLongsor(visible)
    const map = mapInstanceRef.current
    if (!map) return

    if (!visible) {
      if (riwayatLongsorLayerRef.current && map.hasLayer(riwayatLongsorLayerRef.current)) {
        map.removeLayer(riwayatLongsorLayerRef.current)
      }
      return
    }

    if (riwayatLongsorLayerRef.current) {
      if (!map.hasLayer(riwayatLongsorLayerRef.current)) {
        riwayatLongsorLayerRef.current.addTo(map)
        bringDrawingsToFront()
      }
      return
    }

    setIsLoadingThematic('riwayat')
    try {
      const res = await fetch('/data/thematic/riwayat-longsor.geojson')
      if (res.ok) {
        const data = await res.json()
        const L = (await import('leaflet')).default

        const layer = L.geoJSON(data, {
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 6,
              color: '#ffffff',
              weight: 1.5,
              fillColor: '#dc2626',
              fillOpacity: 0.9,
            })
          },
          onEachFeature: (feature, l) => {
            const p = feature.properties
            l.bindTooltip(`<strong>${p.waktu || 'Kejadian Longsor'}</strong><br/>${p.lokasi || ''}`, { sticky: true })
          },
        })

        riwayatLongsorLayerRef.current = layer
        layer.addTo(map)
        bringDrawingsToFront()
      }
    } catch (err) {
      console.warn('Failed to load Riwayat Longsor GeoJSON in drawer:', err)
    } finally {
      setIsLoadingThematic(null)
    }
  }

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1))
  }

  const handleReset = () => {
    setPoints([])
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          background: '#ffffff',
          padding: '0.75rem',
          ...(isFullscreen
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                borderRadius: 0,
                border: 'none',
                padding: '1rem',
                backgroundColor: '#ffffff',
              }
            : {}),
        }}
      >
        {/* Drawer Control Toolbar HUD */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Status Counter & Target Beacon indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <MapPin size={15} style={{ color: 'var(--primary-600)' }} />
              {points.length} Titik Sudut
            </span>

            {targetBeacon && points.length === 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--primary-700)',
                  background: 'var(--primary-50)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--primary-200)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Crosshair size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
                Target Radar Aktif
              </span>
            )}

            {points.length >= 3 ? (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary-700)',
                  background: 'var(--primary-50)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--primary-200)',
                }}
              >
                Estimasi: {areaHa} Ha ({Math.round(areaM2).toLocaleString('id-ID')} m²)
              </span>
            ) : (
              !targetBeacon && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  (Klik minimal 3 titik di peta)
                </span>
              )
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {/* Fullscreen Expand Button */}
            <Button
              type="button"
              variant={isFullscreen ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              icon={isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            >
              {isFullscreen ? 'Tutup Layar Penuh' : 'Layar Penuh'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleUndo}
              disabled={points.length === 0}
              icon={<RotateCcw size={13} />}
            >
              Undo
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={points.length === 0}
              style={{ color: 'var(--accent-rose)' }}
              icon={<Trash2 size={13} />}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Map Canvas with Non-intrusive Floating Popover Layer Control */}
        <div
          style={{
            height: isFullscreen ? 'calc(100vh - 110px)' : typeof height === 'number' ? `${height}px` : height,
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'crosshair',
          }}
        >
          <div
            ref={mapContainerRef}
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          />

          {/* Sleek Floating Popover Layer Control (Collapsed by default) */}
          {showLayerControls && isMapLoaded && (
            <LayerControl
              currentBasemap={currentBasemap}
              onSelectBasemap={handleBasemapChange}
              showKecamatan={showKecamatan}
              onToggleKecamatan={handleToggleKecamatan}
              showDesa={showDesa}
              onToggleDesa={handleToggleDesa}
              showPolaRuang={showPolaRuang}
              onTogglePolaRuang={handleTogglePolaRuang}
              showDasimetrikLongsor={showDasimetrikLongsor}
              onToggleDasimetrikLongsor={handleToggleDasimetrikLongsor}
              showDasimetrikBanjir={showDasimetrikBanjir}
              onToggleDasimetrikBanjir={handleToggleDasimetrikBanjir}
              showRiwayatLongsor={showRiwayatLongsor}
              onToggleRiwayatLongsor={handleToggleRiwayatLongsor}
              isLoadingThematic={isLoadingThematic}
              defaultOpen={false}
            />
          )}
        </div>

        {/* Boundary Guard Warning Toast */}
        {boundaryWarning && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <ShieldAlert size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span>{boundaryWarning}</span>
          </div>
        )}

        {/* Instruction Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            padding: '0.15rem 0.25rem 0 0.25rem',
          }}
        >
          <Info size={13} style={{ color: 'var(--primary-600)' }} />
          <span>
            {targetBeacon && points.length === 0
              ? '🎯 Target radar terdeteksi dari Peta Spasial. Klik di sekitar titik berdenyut hijau untuk mulai menggambar poligon batas plot.'
              : points.length === 0
              ? 'Klik di atas peta untuk membuat titik sudut pertama batas plot (khusus wilayah Kabupaten Banjarnegara).'
              : points.length < 3
              ? 'Klik titik selanjutnya untuk membentuk poligon batas lahan.'
              : '✅ Poligon terbentuk! Anda dapat klik tombol "Layer & Analisis" di pojok kanan atas untuk mengecek zonasi & kerawanan.'}
          </span>
        </div>
      </div>
    </>
  )
}
