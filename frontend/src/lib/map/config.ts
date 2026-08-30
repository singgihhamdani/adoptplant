export interface MapCenterConfig {
  center: [number, number] // [lng, lat]
  zoom: number
  minZoom: number
  maxZoom: number
}

// Bounding box Banjarnegara: [minLon, minLat, maxLon, maxLat]
export const BANJARNEGARA_BOUNDS: [[number, number], [number, number]] = [
  [109.3614, -7.5407],
  [109.9177, -7.1623],
]

export const BANJARNEGARA_MAP_CONFIG: MapCenterConfig = {
  center: [109.64, -7.35],
  zoom: 10.5,
  minZoom: 7,
  maxZoom: 18,
}

const GLYPHS_URL = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'

export const BASEMAP_STYLES = {
  'esri-canvas': {
    id: 'esri-canvas',
    name: 'Clean Light Canvas',
    style: {
      version: 8,
      glyphs: GLYPHS_URL,
      sources: {
        'esri-canvas-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
        },
        'esri-canvas-ref': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'esri-canvas-layer',
          type: 'raster',
          source: 'esri-canvas-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: 'esri-canvas-labels',
          type: 'raster',
          source: 'esri-canvas-ref',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    style: {
      version: 8,
      glyphs: GLYPHS_URL,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  satellite: {
    id: 'satellite',
    name: 'Citra Satelit',
    style: {
      version: 8,
      glyphs: GLYPHS_URL,
      sources: {
        'esri-imagery': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics',
        },
      },
      layers: [
        {
          id: 'esri-imagery-layer',
          type: 'raster',
          source: 'esri-imagery',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  'esri-topo': {
    id: 'esri-topo',
    name: 'Topografi & Jalan',
    style: {
      version: 8,
      glyphs: GLYPHS_URL,
      sources: {
        'esri-topo-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '&copy; Esri &mdash; National Geographic, DeLorme, HERE, UNEP-WCMC, USGS',
        },
      },
      layers: [
        {
          id: 'esri-topo-layer',
          type: 'raster',
          source: 'esri-topo-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
}
