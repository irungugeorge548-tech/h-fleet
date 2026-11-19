// Place search and saved places.
// Search uses Photon (free, built on OpenStreetMap data) limited to Kenya, with Nominatim as a backup.
// Map data comes from OpenStreetMap, so a business only appears if someone has added it there.
const KENYA_BBOX = '33.9,-4.8,41.9,5.1'

const labelOf = (p) => {
  const title = p.name || [p.housenumber, p.street].filter(Boolean).join(' ') || p.district || p.city || 'Place'
  const subParts = [p.name ? [p.housenumber, p.street].filter(Boolean).join(' ') : '', p.district, p.city || p.county, p.state].filter(Boolean)
  const seen = new Set([title])
  const sub = subParts.filter(s => (seen.has(s) ? false : (seen.add(s), true))).join(', ')
  return { title, sub }
}

const kindOf = (p) => {
  const k = `${p.osm_key}:${p.osm_value}`
  if (/^(amenity|shop|tourism|leisure|office)/.test(k)) return 'business'
  if (/^building|^place:(house|apartments)|apartments|residential/.test(k)) return 'building'
  return 'place'
}

const fromPhoton = (f) => {
  const { title, sub } = labelOf(f.properties)
  return { name: title, sub, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], kind: kindOf(f.properties) }
}

export async function searchPlaces(q, bias, signal) {
  const near = bias ? `&lat=${bias.lat}&lon=${bias.lng}&location_bias_scale=0.4` : ''
  try {
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&bbox=${KENYA_BBOX}${near}`, { signal })
    if (!r.ok) throw new Error('photon')
    const d = await r.json()
    return (d.features || []).map(fromPhoton)
  } catch (e) {
    if (e.name === 'AbortError') throw e
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ke&limit=6&q=${encodeURIComponent(q)}`, { signal })
    if (!r.ok) throw new Error('search unavailable')
    const d = await r.json()
    return d.map(x => ({ name: x.name || x.display_name.split(',')[0], sub: x.display_name.split(',').slice(1, 3).join(',').trim(), lat: +x.lat, lng: +x.lon, kind: 'place' }))
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`)
    const d = await r.json()
    const f = d.features?.[0]
    if (f) { const { title, sub } = labelOf(f.properties); return { name: title, sub } }
  } catch { /* fall through */ }
  return { name: 'Pinned location', sub: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
}

// --- saved Home/Work and recent places (kept on this phone) ---
const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb } catch { return fb } }
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }
const isPlace = (p) => p && typeof p === 'object' && Number.isFinite(p.lat) && Number.isFinite(p.lng)

export const loadSaved = () => { const s = read('hfleet_places', {}); return { home: isPlace(s.home) ? s.home : null, work: isPlace(s.work) ? s.work : null } }
export const savePlaceAs = (key, place) => { write('hfleet_places', { ...loadSaved(), [key]: place }) }
export const clearSaved = (key) => { const s = loadSaved(); delete s[key]; write('hfleet_places', s) }
export const loadRecent = () => read('hfleet_recent', []).filter(isPlace)
export const addRecent = (p) => {
  const list = loadRecent().filter(x => !(Math.abs(x.lat - p.lat) < 1e-4 && Math.abs(x.lng - p.lng) < 1e-4))
  write('hfleet_recent', [{ name: p.name, sub: p.sub || '', lat: p.lat, lng: p.lng }, ...list].slice(0, 8))
}
export const clearRecent = () => write('hfleet_recent', [])
