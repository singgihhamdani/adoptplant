'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BANJARNEGARA_MAP_CONFIG } from '@/lib/map/config'
import {
  RotateCcw,
  Trash2,
  MapPin,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import 'leaflet/dist/leaflet.css'

export interface PlotMapDrawerProps {
  initialPolygon?: [number, number][] // [[lng, lat], ...]
  onPolygonChange: (polygonGeoJSON: any, areaM2: number) => void
  center?: [number, number] // [lng, lat]
  zoom?: number
  height?: string | number
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
  'esri-canvas': {
    name: 'Clean Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  'esri-topo': {
    name: 'Topografi',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
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

export function PlotMapDrawer({
  initialPolygon = [],
  onPolygonChange,
  center = BANJARNEGARA_MAP_CONFIG.center, // [lng, lat]
  zoom = 13,
  height = '480px',
}: PlotMapDrawerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const polygonLayerRef = useRef<any>(null)
  const markersLayerGroupRef = useRef<any>(null)

  const [points, setPoints] = useState<[number, number][]>(initialPolygon) // [[lng, lat], ...]
  const [currentBasemap, setCurrentBasemap] = useState('satellite')
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  const areaM2 = calculatePolygonAreaM2(points)
  const areaHa = (areaM2 / 10000).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

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

      // Circle marker
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
  }

  // Notify parent on points change
  useEffect(() => {
    if (points.length >= 3) {
      const closedCoordinates = [...points, points[0]]
      const geojson = {
        type: 'Polygon',
        coordinates: [closedCoordinates],
      }
      onPolygonChange(geojson, areaM2)
    } else {
      onPolygonChange(null, 0)
    }

    if (isMapLoaded) {
      renderLeafletDrawings(points)
    }
  }, [points, isMapLoaded])

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false

    async function initLeaflet() {
      if (!mapContainerRef.current) return

      try {
        const L = (await import('leaflet')).default

        if (isCancelled || !mapContainerRef.current) return

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

        // Add initial basemap tile layer
        const baseConfig = LEAFLET_BASEMAPS['satellite']
        tileLayerRef.current = L.tileLayer(baseConfig.url, {
          attribution: baseConfig.attribution,
          maxZoom: baseConfig.maxZoom,
        }).addTo(map)

        markersLayerGroupRef.current = L.layerGroup().addTo(map)

        // Handle Map Click to add points
        map.on('click', (e: any) => {
          const lat = parseFloat(e.latlng.lat.toFixed(6))
          const lng = parseFloat(e.latlng.lng.toFixed(6))

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

    // Ensure polygon is on top
    if (polygonLayerRef.current) {
      polygonLayerRef.current.bringToFront()
    }
  }

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1))
  }

  const handleReset = () => {
    setPoints([])
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        background: '#ffffff',
        padding: '0.75rem',
      }}
    >
      {/* Drawer Control Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

          {points.length >= 3 ? (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary-700)',
                background: 'var(--primary-50)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--primary-200)',
              }}
            >
              Estimasi: {areaHa} Ha ({Math.round(areaM2).toLocaleString('id-ID')} m²)
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (Klik minimal 3 titik di peta)
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* Basemap Switcher */}
          <select
            value={currentBasemap}
            onChange={(e) => handleBasemapChange(e.target.value)}
            style={{
              padding: '0.35rem 0.6rem',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: '#ffffff',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <option value="satellite">Citra Satelit</option>
            <option value="osm">OpenStreetMap</option>
            <option value="esri-canvas">Clean Canvas</option>
            <option value="esri-topo">Topografi</option>
          </select>

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

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}
      />

      {/* Instruction Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          padding: '0.25rem 0.25rem 0 0.25rem',
        }}
      >
        <Info size={13} style={{ color: 'var(--primary-600)' }} />
        <span>
          Klik pada batas terluar plot lahan di peta secara berurutan. Titik sudut dan garis poligon hijau akan saling menyambung secara otomatis.
        </span>
      </div>
    </div>
  )
}
