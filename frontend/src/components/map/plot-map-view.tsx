'use client'

import React, { useEffect, useRef, useState } from 'react'
import { REHABILITATION_TYPE_LABELS, MONITORING_STATUS_CONFIG } from '@/lib/constants'
import { LayerControl } from './layer-control'
import { Loader2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

export interface PlotData {
  id: string
  name: string
  geom: any // GeoJSON Polygon or PostGIS GeoJSON object
  area_m2: number
  rehabilitation_type: string
  monitoring_status: string
  project?: {
    id: string
    name: string
  }
}

export interface PlotMapViewProps {
  plots: PlotData[]
  height?: string | number
  className?: string
  showControls?: boolean
  initialShowKecamatan?: boolean
  initialShowDesa?: boolean
  selectedPlotId?: string
  onPlotSelect?: (plotId: string) => void
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

export function PlotMapView({
  plots = [],
  height = '520px',
  className = '',
  showControls = true,
  initialShowKecamatan = true,
  initialShowDesa = true,
  selectedPlotId,
  onPlotSelect,
}: PlotMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const kecamatanLayerRef = useRef<any>(null)
  const desaLayerRef = useRef<any>(null)
  const plotsLayerRef = useRef<any>(null)

  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [currentBasemap, setCurrentBasemap] = useState('satellite')
  const [showKecamatan, setShowKecamatan] = useState(initialShowKecamatan)
  const [showDesa, setShowDesa] = useState(initialShowDesa)

  // Render plots vector layer
  const renderPlotsLayer = (L: any, map: any) => {
    if (!map) return

    if (plotsLayerRef.current) {
      map.removeLayer(plotsLayerRef.current)
      plotsLayerRef.current = null
    }

    const validPlots = plots.filter((p) => p.geom)
    if (validPlots.length === 0) return

    const plotGroup = L.featureGroup()

    validPlots.forEach((p) => {
      let geometry = p.geom
      if (typeof geometry === 'string') {
        try {
          geometry = JSON.parse(geometry)
        } catch {
          geometry = null
        }
      }

      if (!geometry || !geometry.coordinates) return

      const status = p.monitoring_status || 'MONITORING'
      const statusConfig =
        MONITORING_STATUS_CONFIG[status as keyof typeof MONITORING_STATUS_CONFIG] ||
        MONITORING_STATUS_CONFIG['MONITORING']

      let strokeColor = '#047857'
      let fillColor = '#10b981'

      if (status === 'MONITORING') {
        strokeColor = '#d97706'
        fillColor = '#f59e0b'
      } else if (status === 'AT_RISK') {
        strokeColor = '#b91c1c'
        fillColor = '#ef4444'
      }

      const layer = L.geoJSON(
        {
          type: 'Feature',
          properties: p,
          geometry: geometry,
        },
        {
          style: {
            color: strokeColor,
            weight: 3.5,
            opacity: 1,
            fillColor: fillColor,
            fillOpacity: 0.45,
          },
        }
      )

      const areaHa = ((Number(p.area_m2) || 0) / 10000).toFixed(2)
      const rehabLabel = REHABILITATION_TYPE_LABELS[p.rehabilitation_type] || p.rehabilitation_type

      layer.bindTooltip(`<strong>${p.name}</strong> (${areaHa} Ha)`, {
        sticky: true,
      })

      layer.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <div style="display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: ${statusConfig.bg}; color: ${statusConfig.color}; margin-bottom: 6px;">
            ${statusConfig.label}
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">
            ${p.name}
          </h4>
          <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
            ${rehabLabel} &bull; <strong>${areaHa} Ha</strong>
          </div>
          ${p.project ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Proyek: ${p.project.name}</div>` : ''}
          <a href="/plots/${p.id}" style="display: block; text-align: center; background: #059669; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-decoration: none; margin-top: 6px;">
            Buka Detail Plot &rarr;
          </a>
        </div>
      `)

      layer.on('click', () => {
        if (onPlotSelect) onPlotSelect(p.id)
      })

      plotGroup.addLayer(layer)
    })

    plotsLayerRef.current = plotGroup
    plotGroup.addTo(map)
    plotGroup.bringToFront()

    // Fit bounds if plots exist
    if (validPlots.length > 0) {
      try {
        const bounds = plotGroup.getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
        }
      } catch (err) {
        console.warn('Could not fit plot bounds:', err)
      }
    }
  }

  // Initialize Map
  useEffect(() => {
    let isCancelled = false

    async function init() {
      if (!mapContainerRef.current) return

      try {
        const L = (await import('leaflet')).default

        if (isCancelled || !mapContainerRef.current) return

        const map = L.map(mapContainerRef.current, {
          center: [-7.397, 109.698], // Banjarnegara center [lat, lng]
          zoom: 11,
          minZoom: 6,
          maxZoom: 19,
          zoomControl: false,
        })

        mapRef.current = map

        L.control.zoom({ position: 'topleft' }).addTo(map)
        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

        // Tile layer
        const baseConfig = LEAFLET_BASEMAPS['satellite']
        tileLayerRef.current = L.tileLayer(baseConfig.url, {
          attribution: baseConfig.attribution,
          maxZoom: baseConfig.maxZoom,
        }).addTo(map)

        // 1. Fetch & Add Kecamatan (Dashed Line)
        try {
          const kecRes = await fetch('/data/boundary/administrasi-kecamatan.geojson')
          if (kecRes.ok) {
            const kecData = await kecRes.json()
            if (!isCancelled) {
              const kecLayer = L.geoJSON(kecData, {
                style: {
                  color: '#f59e0b', // Amber/Gold
                  weight: 2.5,
                  dashArray: '6, 6', // Garis putus-putus
                  opacity: 0.95,
                  fillColor: '#f59e0b',
                  fillOpacity: 0.05,
                },
                onEachFeature: (feature, layer) => {
                  const kecName = feature.properties?.KECAMATAN || 'Kecamatan'
                  layer.bindTooltip(`<strong>Kecamatan ${kecName}</strong>`, { sticky: true })
                  layer.bindPopup(`
                    <div style="font-family: inherit; padding: 4px;">
                      <div style="font-size: 10px; font-weight: 700; color: #d97706; text-transform: uppercase;">
                        Batas Wilayah Administrasi
                      </div>
                      <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px;">
                        Kecamatan ${kecName}
                      </div>
                      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                        Kabupaten Banjarnegara
                      </div>
                    </div>
                  `)
                },
              })

              kecamatanLayerRef.current = kecLayer
              if (initialShowKecamatan) {
                kecLayer.addTo(map)
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load kecamatan geojson in plot view:', err)
        }

        // 2. Fetch & Add Desa (Dashed Line)
        try {
          const desaRes = await fetch('/data/boundary/administrasi-desa.geojson')
          if (desaRes.ok) {
            const desaData = await desaRes.json()
            if (!isCancelled) {
              const desaLayer = L.geoJSON(desaData, {
                style: {
                  color: '#06b6d4', // Cyan
                  weight: 1.5,
                  dashArray: '3, 3', // Garis putus-putus rapat
                  opacity: 0.9,
                  fillColor: '#06b6d4',
                  fillOpacity: 0.03,
                },
                onEachFeature: (feature, layer) => {
                  const desaName = feature.properties?.DESA || feature.properties?.desa || 'Desa'
                  const kecName = feature.properties?.KECAMATAN || feature.properties?.kecamatan || ''
                  layer.bindTooltip(`<strong>Desa ${desaName}</strong>${kecName ? ` (${kecName})` : ''}`, { sticky: true })
                  layer.bindPopup(`
                    <div style="font-family: inherit; padding: 4px;">
                      <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase;">
                        Batas Administrasi Desa
                      </div>
                      <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px;">
                        Desa/Kelurahan ${desaName}
                      </div>
                      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                        Kecamatan ${kecName} &bull; Banjarnegara
                      </div>
                    </div>
                  `)
                },
              })

              desaLayerRef.current = desaLayer
              if (initialShowDesa) {
                desaLayer.addTo(map)
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load desa geojson in plot view:', err)
        }

        // 3. Render Plots on top
        renderPlotsLayer(L, map)

        setIsMapLoaded(true)
        setTimeout(() => {
          map.invalidateSize()
        }, 200)
      } catch (err) {
        console.error('PlotMapView error:', err)
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
  }, [])

  // Sync plots whenever plots prop updates
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      import('leaflet').then((LModule) => {
        const L = LModule.default
        renderPlotsLayer(L, mapRef.current)
      })
    }
  }, [plots, isMapLoaded])

  // Basemap switch
  const handleSelectBasemap = async (bmId: string) => {
    const map = mapRef.current
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

    // Bring vector layers to front
    if (showKecamatan && kecamatanLayerRef.current) {
      kecamatanLayerRef.current.bringToFront()
    }
    if (showDesa && desaLayerRef.current) {
      desaLayerRef.current.bringToFront()
    }
    if (plotsLayerRef.current) {
      plotsLayerRef.current.bringToFront()
    }
  }

  // Toggle Kecamatan
  const handleToggleKecamatan = (visible: boolean) => {
    setShowKecamatan(visible)
    const map = mapRef.current
    const layer = kecamatanLayerRef.current
    if (!map || !layer) return

    if (visible) {
      if (!map.hasLayer(layer)) {
        layer.addTo(map)
        layer.bringToFront()
        if (plotsLayerRef.current) plotsLayerRef.current.bringToFront()
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
    const map = mapRef.current
    const layer = desaLayerRef.current
    if (!map || !layer) return

    if (visible) {
      if (!map.hasLayer(layer)) {
        layer.addTo(map)
        layer.bringToFront()
        if (plotsLayerRef.current) plotsLayerRef.current.bringToFront()
      }
    } else {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    }
  }

  const containerHeight = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`plot-map-wrapper ${className}`}
      style={{
        height: containerHeight,
        minHeight: '400px',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-subtle)',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            gap: '0.5rem',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
          }}
        >
          <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary-600)' }} />
          <span>Memuat Peta Spasial Plot & Administrasi...</span>
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
        />
      )}
    </div>
  )
}
