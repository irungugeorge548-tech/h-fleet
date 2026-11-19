import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import maplibregl from 'maplibre-gl/dist/maplibre-gl-csp'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url'
import 'maplibre-gl/dist/maplibre-gl.css'

// the map's background worker is bundled as its own file, so it also works on Vercel and when installed
maplibregl.setWorkerUrl(workerUrl)

// Vector map from OpenFreeMap (OpenStreetMap data: roads, buildings and place names).
// If that service cannot be reached, the plain OpenStreetMap tiles are used instead.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const RASTER_FALLBACK = {
  version: 8,
  sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

const markerEl = (kind) => {
  const el = document.createElement('div')
  if (kind === 'me') {
    el.innerHTML = '<div style="width:18px;height:18px;border-radius:50%;background:#2f7df6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,125,246,.25)"></div>'
  } else {
    const c = kind === 'pickup' ? '#32BB78' : '#111'
    el.innerHTML = `<svg width="34" height="44" viewBox="0 0 34 44"><path d="M17 43C17 43 3 28 3 17a14 14 0 0 1 28 0c0 11-14 26-14 26z" fill="${c}" stroke="#fff" stroke-width="2.500"/><circle cx="17" cy="17" r="5.500" fill="#fff"/></svg>`
    el.style.transform = 'translateY(-14px)'
  }
  return el
}

const MapView = forwardRef(function MapView({ center, zoom = 14, markers = [], route = null, onTap, onMoveEnd, padding }, ref) {
  const box = useRef(null)
  const map = useRef(null)
  const live = useRef([])
  const tap = useRef(onTap)
  const moved = useRef(onMoveEnd)
  const routeRef = useRef(route)
  tap.current = onTap
  moved.current = onMoveEnd
  routeRef.current = route

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, z = 15) => map.current?.flyTo({ center: [lng, lat], zoom: z, duration: 700 }),
    fit: (points, pad) => {
      if (!map.current || !points?.length) return
      const b = new maplibregl.LngLatBounds()
      points.forEach(p => b.extend([p.lng, p.lat]))
      map.current.fitBounds(b, { padding: pad || padding || 60, maxZoom: 16, duration: 700 })
    },
    center: () => { const c = map.current?.getCenter(); return c ? { lat: c.lat, lng: c.lng } : null },
  }))

  useEffect(() => {
    const m = new maplibregl.Map({ container: box.current, style: STYLE_URL, center: [center.lng, center.lat], zoom, attributionControl: { compact: true } })
    map.current = m
    let fellBack = false
    m.on('error', (e) => {
      const msg = String(e?.error?.message || '')
      if (!fellBack && (/style|Failed to fetch|NetworkError/i.test(msg)) && !m.isStyleLoaded()) { fellBack = true; m.setStyle(RASTER_FALLBACK) }
    })
    const drawRoute = () => {
      const r = routeRef.current
      if (!m.getStyle()) return
      if (m.getSource('trip')) m.getSource('trip').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: r || [] } })
      else if (r) {
        m.addSource('trip', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: r } } })
        m.addLayer({ id: 'trip-casing', type: 'line', source: 'trip', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': 10 } })
        m.addLayer({ id: 'trip-line', type: 'line', source: 'trip', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1f9d63', 'line-width': 6 } })
      }
    }
    m.on('styledata', drawRoute)
    m.on('load', drawRoute)
    m.on('click', (e) => {
      // tapping a named place (shop, hospital, apartments...) picks that place; anything else picks the spot
      const hit = m.queryRenderedFeatures(e.point).find(f => f.properties && (f.properties.name || f.properties['name:en']) && /poi|housenumber|building|place/.test(f.sourceLayer || f.layer?.id || ''))
      const name = hit ? (hit.properties['name:en'] || hit.properties.name) : null
      tap.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng, name })
    })
    m.on('moveend', () => { const c = m.getCenter(); moved.current?.({ lat: c.lat, lng: c.lng }) })
    return () => { m.remove(); map.current = null }
  }, [])

  // markers
  useEffect(() => {
    if (!map.current) return
    live.current.forEach(x => x.remove())
    live.current = markers.filter(k => Number.isFinite(k.lat) && Number.isFinite(k.lng)).map(k =>
      new maplibregl.Marker({ element: markerEl(k.kind), anchor: k.kind === 'me' ? 'center' : 'bottom' }).setLngLat([k.lng, k.lat]).addTo(map.current))
  }, [JSON.stringify(markers)])

  // route line
  useEffect(() => {
    const m = map.current
    if (!m || !m.getStyle()) return
    const src = m.getSource('trip')
    if (src) src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: route || [] } })
    else if (route && m.isStyleLoaded()) m.fire('styledata')
  }, [route])

  return <div ref={box} className="h-full w-full" />
})

export default MapView
