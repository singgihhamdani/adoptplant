'use client'

import React, { useEffect, useRef, useState } from 'react'
import { LayerControl } from './layer-control'
import { Loader2 } from 'lucide-react'
import {
  inspectSpatialPoint,
  preloadSpatialDatasets,
  SpatialInspectionResult,
} from '@/lib/map/spatial-inspector'
import 'leaflet/dist/leaflet.css'

export interface BaseMapProps {
  height?: string | number
  center?: [number, number] // [lng, lat]
  zoom?: number
  onMapClick?: (coords: [number, number], inspection?: SpatialInspectionResult) => void
  showControls?: boolean
  initialShowKecamatan?: boolean
  initialShowDesa?: boolean
  className?: string
  style?: React.CSSProperties
}

const LEAFLET_BASEMAPS = {
  satellite: {
    name: 'Citra Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  'esri-topo': {
    name: 'Topografi & Jalan',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  'esri-canvas': {
    name: 'Clean Light Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
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

export function BaseMap({
  height = '560px',
  center = [109.698, -7.397], // [lng, lat]
  zoom = 11,
  onMapClick,
  showControls = true,
  initialShowKecamatan = true,
  initialShowDesa = false,
  className = '',
  style,
}: BaseMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)

  // Core Boundary Layers (Non-blocking line overlays)
  const kecamatanLayerRef = useRef<any>(null)
  const desaLayerRef = useRef<any>(null)

  // Thematic Layers Cache
  const polaRuangLayerRef = useRef<any>(null)
  const riwayatLongsorLayerRef = useRef<any>(null)
  const dasimetrikLongsorLayerRef = useRef<any>(null)
  const dasimetrikBanjirLayerRef = useRef<any>(null)

  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [currentBasemap, setCurrentBasemap] = useState('satellite')
  const [showKecamatan, setShowKecamatan] = useState(initialShowKecamatan)
  const [showDesa, setShowDesa] = useState(initialShowDesa)

  // Thematic states
  const [showPolaRuang, setShowPolaRuang] = useState(false)
  const [showDasimetrikLongsor, setShowDasimetrikLongsor] = useState(false)
  const [showDasimetrikBanjir, setShowDasimetrikBanjir] = useState(false)
  const [showRiwayatLongsor, setShowRiwayatLongsor] = useState(false)
  const [isLoadingThematic, setIsLoadingThematic] = useState<string | null>(null)

  // Reorder layers helper: Ensures boundaries & point markers stay on top
  const reorderLayers = () => {
    if (showKecamatan && kecamatanLayerRef.current) {
      kecamatanLayerRef.current.bringToFront()
    }
    if (showDesa && desaLayerRef.current) {
      desaLayerRef.current.bringToFront()
    }
    if (showRiwayatLongsor && riwayatLongsorLayerRef.current) {
      riwayatLongsorLayerRef.current.bringToFront()
    }
  }

  // Preload spatial datasets in background
  useEffect(() => {
    preloadSpatialDatasets()
  }, [])

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false

    async function initLeaflet() {
      if (!mapContainerRef.current) return

      try {
        const L = (await import('leaflet')).default

        if (isCancelled || !mapContainerRef.current) return

        // Create Leaflet Map instance
        const map = L.map(mapContainerRef.current, {
          center: [center[1], center[0]],
          zoom: zoom,
          minZoom: 6,
          maxZoom: 19,
          zoomControl: false,
        })

        mapInstanceRef.current = map

        L.control.zoom({ position: 'topleft' }).addTo(map)
        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

        // Initial Basemap Tile Layer
        const baseConfig = LEAFLET_BASEMAPS['satellite']
        tileLayerRef.current = L.tileLayer(baseConfig.url, {
          attribution: baseConfig.attribution,
          maxZoom: baseConfig.maxZoom,
        }).addTo(map)

        // Fetch & Add Batas Kecamatan (Dashed Line, fillOpacity 0 so clicks pass through)
        try {
          const kecRes = await fetch('/data/boundary/administrasi-kecamatan.geojson')
          if (kecRes.ok) {
            const kecGeoJSON = await kecRes.json()
            if (!isCancelled) {
              const kecLayer = L.geoJSON(kecGeoJSON, {
                style: {
                  color: '#f59e0b', // Amber/Emas
                  weight: 2.5,
                  dashArray: '6, 6', // Garis putus-putus tegas
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
              if (initialShowKecamatan) {
                kecLayer.addTo(map)
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load kecamatan geojson:', err)
        }

        // Fetch & Add Batas Desa (Dashed Line, fillOpacity 0)
        try {
          const desaRes = await fetch('/data/boundary/administrasi-desa.geojson')
          if (desaRes.ok) {
            const desaGeoJSON = await desaRes.json()
            if (!isCancelled) {
              const desaLayer = L.geoJSON(desaGeoJSON, {
                style: {
                  color: '#06b6d4', // Cyan
                  weight: 1.5,
                  dashArray: '3, 3', // Garis putus-putus rapat
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
              if (initialShowDesa) {
                desaLayer.addTo(map)
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load desa geojson:', err)
        }

        // Smart Spatial Inspector Click Handler
        map.on('click', async (e: any) => {
          const lat = parseFloat(e.latlng.lat.toFixed(6))
          const lng = parseFloat(e.latlng.lng.toFixed(6))

          // Instantly execute point-in-polygon inspection across all layers
          const inspection = await inspectSpatialPoint(lng, lat)

          if (onMapClick) {
            onMapClick([lng, lat], inspection)
          }

          // Build Smart Spatial Inspection Card HTML
          const desaStr = inspection.desa ? `Desa ${inspection.desa}` : 'Wilayah Banjarnegara'
          const kecStr = inspection.kecamatan ? `Kec. ${inspection.kecamatan}` : 'Kabupaten Banjarnegara'
          const rtrwStr = inspection.polaRuang || 'Zonasi Non-Hutan / Belum Terdata'
          const rtrwColor = inspection.polaRuang ? POLA_RUANG_COLORS[inspection.polaRuang] || '#16a34a' : '#64748b'

          // Longsor info
          const hasLongsor = !!inspection.longsor
          const longsorKelas = inspection.longsor?.kelas || 'Aman / Rendah'
          const longsorHa = inspection.longsor?.luasHa ? inspection.longsor.luasHa.toFixed(2) : '-'
          const longsorJiwa = inspection.longsor?.jiwaTerpapar ? inspection.longsor.jiwaTerpapar.toLocaleString() : '0'

          let longsorBadgeBg = '#f0fdf4'
          let longsorBadgeColor = '#166534'
          if (longsorKelas === 'Tinggi') {
            longsorBadgeBg = '#fee2e2'
            longsorBadgeColor = '#991b1b'
          } else if (longsorKelas === 'Sedang') {
            longsorBadgeBg = '#fef3c7'
            longsorBadgeColor = '#92400e'
          }

          // Banjir info
          const hasBanjir = !!inspection.banjir
          const banjirKelas = inspection.banjir?.kelas || 'Aman'
          const banjirJiwa = inspection.banjir?.jiwaTerpapar ? inspection.banjir.jiwaTerpapar.toLocaleString() : '0'

          // BPBD info
          const riwayat = inspection.riwayatTerdekat

          const popupHtml = `
            <div style="font-family: inherit; width: 300px; padding: 2px;">
              <!-- Header Bar -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
                  <span style="font-size: 10.5px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.4px;">
                    Hasil Deteksi Spasial
                  </span>
                </div>
                <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">
                  ${lat}, ${lng}
                </span>
              </div>

              <!-- Wilayah -->
              <div style="margin-bottom: 8px;">
                <h4 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">
                  ${desaStr}
                </h4>
                <div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">
                  ${kecStr} &bull; Banjarnegara
                </div>
              </div>

              <!-- RTRW & Pola Ruang -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">
                  Pola Ruang (RTRW Resmi)
                </div>
                <div style="font-size: 12px; font-weight: 600; color: ${rtrwColor};">
                  ${rtrwStr}
                </div>
              </div>

              <!-- Analisis Dampak Dasimetrik Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                <!-- Longsor -->
                <div style="background: ${longsorBadgeBg}; border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; padding: 6px 8px;">
                  <div style="font-size: 9.5px; font-weight: 700; color: ${longsorBadgeColor}; text-transform: uppercase;">
                    Bahaya Longsor
                  </div>
                  <div style="font-size: 12px; font-weight: 700; color: ${longsorBadgeColor}; margin-top: 1px;">
                    ${longsorKelas}
                  </div>
                  <div style="font-size: 10.5px; color: ${longsorBadgeColor}; margin-top: 2px;">
                    👥 <strong>${longsorJiwa}</strong> Jiwa
                  </div>
                </div>

                <!-- Banjir -->
                <div style="background: ${hasBanjir ? '#eff6ff' : '#f8fafc'}; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
                  <div style="font-size: 9.5px; font-weight: 700; color: ${hasBanjir ? '#1e40af' : '#64748b'}; text-transform: uppercase;">
                    Bahaya Banjir
                  </div>
                  <div style="font-size: 12px; font-weight: 700; color: ${hasBanjir ? '#1e40af' : '#475569'}; margin-top: 1px;">
                    ${banjirKelas}
                  </div>
                  <div style="font-size: 10.5px; color: ${hasBanjir ? '#1e40af' : '#64748b'}; margin-top: 2px;">
                    ${hasBanjir ? `👥 <strong>${banjirJiwa}</strong> Jiwa` : 'Genangan nihil'}
                  </div>
                </div>
              </div>

              <!-- Riwayat BPBD Terdekat -->
              ${
                riwayat
                  ? `
                <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 6px 8px; margin-bottom: 10px; font-size: 11px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; color: #7e22ce; font-size: 10px; text-transform: uppercase;">
                      Riwayat BPBD Terdekat
                    </span>
                    <span style="font-weight: 700; color: #9333ea; font-size: 10px; background: #f3e8ff; padding: 1px 4px; border-radius: 3px;">
                      ~${riwayat.jarakMeter} meter
                    </span>
                  </div>
                  <div style="color: #475569; margin-top: 2px; font-size: 10.5px;">
                    ${riwayat.lokasi} (${riwayat.waktu})
                  </div>
                </div>
              `
                  : ''
              }

              <!-- Action Link -->
              <div style="display: flex; gap: 6px;">
                <a
                  href="/plots/new?lat=${lat}&lng=${lng}&region=${encodeURIComponent(desaStr + ', ' + kecStr)}"
                  style="flex: 1; text-align: center; background: #16a34a; color: #ffffff; text-decoration: none; padding: 6px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; display: block;"
                >
                  + Daftarkan Plot di Sini
                </a>
              </div>
            </div>
          `

          L.popup({ maxWidth: 320 })
            .setLatLng(e.latlng)
            .setContent(popupHtml)
            .openOn(map)
        })

        setIsMapLoaded(true)
        setTimeout(() => {
          map.invalidateSize()
        }, 200)
      } catch (err) {
        console.error('Error initializing Leaflet:', err)
      }
    }

    initLeaflet()

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize?.() || mapInstanceRef.current.invalidateSize?.()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      isCancelled = true
      window.removeEventListener('resize', handleResize)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Switch Basemap
  const handleSelectBasemap = async (basemapId: string) => {
    const map = mapInstanceRef.current
    if (!map) return
    setCurrentBasemap(basemapId)

    const L = (await import('leaflet')).default
    const baseConfig = LEAFLET_BASEMAPS[basemapId as keyof typeof LEAFLET_BASEMAPS] || LEAFLET_BASEMAPS['satellite']

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    tileLayerRef.current = L.tileLayer(baseConfig.url, {
      attribution: baseConfig.attribution,
      maxZoom: baseConfig.maxZoom,
    }).addTo(map)

    reorderLayers()
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
        reorderLayers()
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
        reorderLayers()
      }
    } else {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    }
  }

  // Toggle Pola Ruang (Lazy Loaded)
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
        reorderLayers()
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
        reorderLayers()
      }
    } catch (err) {
      console.warn('Failed to load Pola Ruang GeoJSON:', err)
    } finally {
      setIsLoadingThematic(null)
    }
  }

  // Toggle Bahaya & Dampak Longsor Dasimetrik
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
        reorderLayers()
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
            let fillOpacity = 0.50

            if (kls === 'Tinggi') {
              fillColor = '#ef4444'
              borderColor = '#dc2626'
              fillOpacity = 0.55
            } else if (kls === 'Rendah') {
              fillColor = '#22c55e'
              borderColor = '#16a34a'
              fillOpacity = 0.45
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
        reorderLayers()
      }
    } catch (err) {
      console.warn('Failed to load Dasimetrik Longsor GeoJSON:', err)
    } finally {
      setIsLoadingThematic(null)
    }
  }

  // Toggle Bahaya & Dampak Banjir Dasimetrik
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
        reorderLayers()
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
            let fillOpacity = 0.50

            if (kls === 'Tinggi') {
              color = '#1d4ed8'
              fillOpacity = 0.60
            } else if (kls === 'Rendah') {
              color = '#60a5fa'
              fillOpacity = 0.40
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
        reorderLayers()
      }
    } catch (err) {
      console.warn('Failed to load Dasimetrik Banjir GeoJSON:', err)
    } finally {
      setIsLoadingThematic(null)
    }
  }

  // Toggle Riwayat Longsor BPBD (Lazy Loaded)
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
        riwayatLongsorLayerRef.current.bringToFront()
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
        layer.bringToFront()
      }
    } catch (err) {
      console.warn('Failed to load Riwayat Longsor GeoJSON:', err)
    } finally {
      setIsLoadingThematic(null)
    }
  }

  const containerHeight = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`map-wrapper ${className}`}
      style={{
        height: containerHeight,
        minHeight: '400px',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        border: '1px solid var(--border-subtle)',
        ...style,
      }}
    >
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* Loading Overlay */}
      {!isMapLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            gap: '0.75rem',
            color: '#1e293b',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary-600)' }} />
          <p>Memuat Peta Spasial Banjarnegara...</p>
        </div>
      )}

      {/* Layer & Basemap Control */}
      {showControls && isMapLoaded && (
        <LayerControl
          currentBasemap={currentBasemap}
          onSelectBasemap={handleSelectBasemap}
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
        />
      )}
    </div>
  )
}
