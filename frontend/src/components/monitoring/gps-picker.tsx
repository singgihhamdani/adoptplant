'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BASEMAP_STYLES, BANJARNEGARA_MAP_CONFIG } from '@/lib/map/config'
import { Button } from '@/components/ui/button'
import {
  inspectSpatialPoint,
  preloadSpatialDatasets,
  type SpatialInspectionResult,
} from '@/lib/map/spatial-inspector'
import {
  MapPin,
  Crosshair,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  TreePine,
  ShieldAlert,
} from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'

export interface GPSPickerProps {
  coordinates: [number, number] | null // [lng, lat]
  onCoordinatesChange: (
    coords: [number, number],
    accuracyM: number,
    spatialInspection?: SpatialInspectionResult | null
  ) => void
  plotPolygon?: any // GeoJSON Polygon of plot
  plotName?: string
  height?: string | number
}

export function GPSPicker({
  coordinates,
  onCoordinatesChange,
  plotPolygon,
  plotName,
  height = '340px',
}: GPSPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [spatialInspection, setSpatialInspection] = useState<SpatialInspectionResult | null>(null)

  // Layer toggles
  const [showPolaRuang, setShowPolaRuang] = useState(false)
  const [showRawanLongsor, setShowRawanLongsor] = useState(false)

  // Preload spatial datasets in background
  useEffect(() => {
    preloadSpatialDatasets()
  }, [])

  // If initial coordinates exist, run initial inspection
  useEffect(() => {
    if (coordinates) {
      inspectSpatialPoint(coordinates[0], coordinates[1]).then((res) => {
        setSpatialInspection(res)
      })
    }
  }, [])

  // Get initial map center
  const getInitialCenter = (): [number, number] => {
    if (coordinates) return coordinates
    if (plotPolygon && plotPolygon.coordinates?.[0]?.length > 0) {
      return plotPolygon.coordinates[0][0]
    }
    return BANJARNEGARA_MAP_CONFIG.center
  }

  // Update marker on map
  const updateMarker = (lngLat: [number, number], maplibregl: any) => {
    const map = mapRef.current
    if (!map) return

    if (!markerRef.current) {
      const el = document.createElement('div')
      el.className = 'custom-gps-marker'
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#dc2626'
      el.style.border = '3px solid #ffffff'
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map)
    } else {
      markerRef.current.setLngLat(lngLat)
    }
  }

  // Handle location update
  const handleLocationUpdate = async (lngLat: [number, number], acc: number, maplibregl: any) => {
    updateMarker(lngLat, maplibregl)
    const inspection = await inspectSpatialPoint(lngLat[0], lngLat[1])
    setSpatialInspection(inspection)
    onCoordinatesChange(lngLat, acc, inspection)
  }

  // Setup Map
  useEffect(() => {
    let isCancelled = false

    async function init() {
      if (!mapContainerRef.current) return

      try {
        const maplibreglModule = await import('maplibre-gl')
        const maplibregl = (maplibreglModule as any).default || maplibreglModule

        if (isCancelled || !mapContainerRef.current) return

        const basemap = BASEMAP_STYLES['satellite']
        const initialCenter = getInitialCenter()

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: basemap.style as any,
          center: initialCenter,
          zoom: 14,
        })

        mapRef.current = map

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-left')

        map.on('load', () => {
          if (isCancelled) return
          setIsMapLoaded(true)

          // Add plot polygon boundary if available
          if (plotPolygon) {
            map.addSource('plot-boundary-src', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: { name: plotName || 'Batas Plot' },
                geometry: plotPolygon,
              },
            })

            map.addLayer({
              id: 'plot-boundary-fill',
              type: 'fill',
              source: 'plot-boundary-src',
              paint: {
                'fill-color': '#10b981',
                'fill-opacity': 0.25,
              },
            })

            map.addLayer({
              id: 'plot-boundary-line',
              type: 'line',
              source: 'plot-boundary-src',
              paint: {
                'line-color': '#059669',
                'line-width': 2.5,
                'line-dasharray': [2, 1],
              },
            })

            // Fit bounds to polygon
            try {
              const coords = plotPolygon.coordinates?.[0] || []
              if (coords.length > 0) {
                const bounds: [number, number, number, number] = [180, 90, -180, -90]
                coords.forEach((pt: [number, number]) => {
                  if (pt[0] < bounds[0]) bounds[0] = pt[0]
                  if (pt[1] < bounds[1]) bounds[1] = pt[1]
                  if (pt[0] > bounds[2]) bounds[2] = pt[0]
                  if (pt[1] > bounds[3]) bounds[3] = pt[1]
                })
                map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
                  padding: 30,
                  maxZoom: 16,
                })
              }
            } catch (err) {
              console.warn('GPSPicker fitbounds error:', err)
            }
          }

          // If initial coordinates exist, place marker
          if (coordinates) {
            updateMarker(coordinates, maplibregl)
          }

          // Click to place marker
          map.on('click', async (e: any) => {
            const lng = parseFloat(e.lngLat.lng.toFixed(6))
            const lat = parseFloat(e.lngLat.lat.toFixed(6))
            const newCoords: [number, number] = [lng, lat]

            await handleLocationUpdate(newCoords, accuracy || 10.0, maplibregl)
          })
        })
      } catch (err) {
        console.error('GPSPicker map error:', err)
      }
    }

    init()

    return () => {
      isCancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [plotPolygon])

  // Handle GPS detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser Anda tidak mendukung fitur Geolocation GPS.')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lng = parseFloat(pos.coords.longitude.toFixed(6))
        const lat = parseFloat(pos.coords.latitude.toFixed(6))
        const acc = Math.round(pos.coords.accuracy)

        const newCoords: [number, number] = [lng, lat]
        setAccuracy(acc)
        setIsLocating(false)

        const maplibreglModule = await import('maplibre-gl')
        const maplibregl = (maplibreglModule as any).default || maplibreglModule

        await handleLocationUpdate(newCoords, acc, maplibregl)

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: newCoords,
            zoom: 16,
            duration: 1000,
          })
        }
      },
      (err) => {
        setIsLocating(false)
        console.warn('Geolocation error:', err)
        setLocationError('Tidak dapat mengakses GPS. Pastikan izin lokasi aktif atau klik langsung di peta.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Toggle Pola Ruang on MapLibre
  const togglePolaRuangLayer = async () => {
    const map = mapRef.current
    if (!map || !isMapLoaded) return

    const nextState = !showPolaRuang
    setShowPolaRuang(nextState)

    if (nextState) {
      if (!map.getSource('src-pola-ruang-picker')) {
        map.addSource('src-pola-ruang-picker', {
          type: 'geojson',
          data: '/data/thematic/pola-ruang.geojson',
        })
        map.addLayer({
          id: 'layer-pola-ruang-picker',
          type: 'fill',
          source: 'src-pola-ruang-picker',
          paint: {
            'fill-color': '#16a34a',
            'fill-opacity': 0.35,
            'fill-outline-color': '#15803d',
          },
        })
      } else {
        map.setLayoutProperty('layer-pola-ruang-picker', 'visibility', 'visible')
      }
    } else {
      if (map.getLayer('layer-pola-ruang-picker')) {
        map.setLayoutProperty('layer-pola-ruang-picker', 'visibility', 'none')
      }
    }
  }

  // Toggle Rawan Longsor on MapLibre
  const toggleRawanLongsorLayer = async () => {
    const map = mapRef.current
    if (!map || !isMapLoaded) return

    const nextState = !showRawanLongsor
    setShowRawanLongsor(nextState)

    if (nextState) {
      if (!map.getSource('src-longsor-picker')) {
        map.addSource('src-longsor-picker', {
          type: 'geojson',
          data: '/data/thematic/dasimetrik-longsor.geojson',
        })
        map.addLayer({
          id: 'layer-longsor-picker',
          type: 'fill',
          source: 'src-longsor-picker',
          paint: {
            'fill-color': '#ef4444',
            'fill-opacity': 0.35,
            'fill-outline-color': '#dc2626',
          },
        })
      } else {
        map.setLayoutProperty('layer-longsor-picker', 'visibility', 'visible')
      }
    } else {
      if (map.getLayer('layer-longsor-picker')) {
        map.setLayoutProperty('layer-longsor-picker', 'visibility', 'none')
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Top Bar: GPS Action & Layer Toggles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDetectGPS}
            disabled={isLocating}
            icon={isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
          >
            {isLocating ? 'Mendeteksi GPS...' : 'Ambil Lokasi GPS Lapangan'}
          </Button>

          {/* Quick Contextual Layer Toggles */}
          <button
            type="button"
            onClick={togglePolaRuangLayer}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.72rem',
              borderRadius: 'var(--radius-sm)',
              border: showPolaRuang ? '1px solid #16a34a' : '1px solid var(--border-subtle)',
              background: showPolaRuang ? '#f0fdf4' : '#ffffff',
              color: showPolaRuang ? '#15803d' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontWeight: 600,
            }}
          >
            <TreePine size={12} />
            Pola Ruang
          </button>

          <button
            type="button"
            onClick={toggleRawanLongsorLayer}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.72rem',
              borderRadius: 'var(--radius-sm)',
              border: showRawanLongsor ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
              background: showRawanLongsor ? '#fef2f2' : '#ffffff',
              color: showRawanLongsor ? '#dc2626' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontWeight: 600,
            }}
          >
            <ShieldAlert size={12} />
            Bahaya Longsor
          </button>
        </div>

        {coordinates ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--primary-800)',
              background: 'var(--primary-50)',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--primary-200)',
            }}
          >
            <MapPin size={13} style={{ color: 'var(--primary-600)' }} />
            <span>
              Lat: {coordinates[1]}, Lng: {coordinates[0]}
            </span>
            {accuracy !== null && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                (&plusmn;{accuracy}m)
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Belum ada titik GPS yang dipilih
          </span>
        )}
      </div>

      {/* Error Notice */}
      {locationError && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            color: '#b45309',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <AlertTriangle size={14} />
          <span>{locationError}</span>
        </div>
      )}

      {/* Mini Map */}
      <div
        ref={mapContainerRef}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
        }}
      />

      {/* Live Contextual Inspection Summary for GPS Point */}
      {spatialInspection && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '0.75rem',
          }}
        >
          <span style={{ fontWeight: 700, color: '#0f172a' }}>
            📍 {spatialInspection.desa ? `Desa ${spatialInspection.desa}` : 'Banjarnegara'}{' '}
            {spatialInspection.kecamatan ? `(${spatialInspection.kecamatan})` : ''}
          </span>
          <span style={{ color: '#cbd5e1' }}>&bull;</span>
          <span style={{ color: '#15803d', fontWeight: 600 }}>
            🌲 {spatialInspection.polaRuang || 'Non-Hutan'}
          </span>
          <span style={{ color: '#cbd5e1' }}>&bull;</span>
          <span
            style={{
              color:
                spatialInspection.longsor?.kelas === 'Tinggi'
                  ? '#dc2626'
                  : spatialInspection.longsor?.kelas === 'Sedang'
                  ? '#d97706'
                  : '#16a34a',
              fontWeight: 600,
            }}
          >
            ⚠️ Longsor: {spatialInspection.longsor?.kelas || 'Rendah'}
          </span>
          {spatialInspection.longsor?.jiwaTerpapar ? (
            <span style={{ color: '#64748b' }}>
              (👥 ~{spatialInspection.longsor.jiwaTerpapar.toLocaleString('id-ID')} jiwa)
            </span>
          ) : null}
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Info size={12} style={{ color: 'var(--primary-600)' }} />
        <span>
          Gunakan tombol GPS atau klik titik spesifik di atas peta tempat Anda melakukan pengamatan tanaman.
        </span>
      </div>
    </div>
  )
}
