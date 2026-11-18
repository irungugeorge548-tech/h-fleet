import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Driving route from OSRM (free). Falls back to a straight line if it fails.
async function fetchRoute(from, to) {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`)
    const d = await r.json()
    const route = d.routes?.[0]
    if (!route) return null
    return { points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), km: route.distance / 1000, mins: route.duration / 60 }
  } catch { return null }
}

// Zooms the map so the whole trip is visible above the bottom sheet
function FitRoute({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points && points.length > 1) map.fitBounds(points, { paddingTopLeft: [30, 70], paddingBottomRight: [30, 380] })
  }, [points, map])
  return null
}

export default function Ride() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState('confirm')
  const [ride, setRide] = useState(null)
  const [destPos, setDestPos] = useState(null)
  const [route, setRoute] = useState(null)
  const [busy, setBusy] = useState(false)
  const [eta, setEta] = useState(3)
  const token = localStorage.getItem('hfleet_token')

  const pickup = state?.pos || [-1.286389, 36.817223]

  useEffect(() => {
    if (!state?.destination) return
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(state.destination)}&limit=1`)
      .then(r => r.json())
      .then(data => { if (data[0]) setDestPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]) })
      .catch(() => {})
  }, [state])

  useEffect(() => {
    if (destPos) fetchRoute(pickup, destPos).then(setRoute)
  }, [destPos])

  // Demo ETA countdown (no live driver tracking yet)
  useEffect(() => {
    if (status !== 'tracking') return
    const t = setInterval(() => setEta(e => Math.max(1, e - 1)), 60000)
    return () => clearInterval(t)
  }, [status])

  const confirm = async () => {
    setBusy(true)
    try {
      const res = await axios.post('/api/rides/request', {
        pickup: state.pickup, destination: state.destination, fare: state.fare, pin
      }, { headers: { Authorization: `Bearer ${token}` } })
      setRide(res.data)
      setStatus('tracking')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    } finally { setBusy(false) }
  }

  const [driverName, plate] = (ride?.driverName || 'Driver • KAA 000A').split('•').map(s => s.trim())
  const line = route?.points || (destPos ? [pickup, destPos] : null)

  return (
    <div className="h-screen relative">
      <MapContainer center={pickup} zoom={14} zoomControl={false} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitRoute points={line} />
        <Marker position={pickup} />
        {destPos && <Marker position={destPos} />}
        {line && <Polyline positions={line} color="#32BB78" weight={6} />}
      </MapContainer>

      <button onClick={() => navigate('/')} className="absolute top-4 left-4 z-[1000] w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-xl">←</button>
      {status === 'tracking' && (
        <div className="absolute top-4 right-4 z-[1000] bg-white shadow rounded-full px-4 py-2 text-sm font-medium">🛡 Safety</div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-5 z-[1000]">
        {status === 'confirm' && (
          <>
            <h2 className="text-xl font-bold">Confirm ride</h2>
            <div className="mt-3 text-sm space-y-1">
              <p><span className="text-bolt">●</span> {state?.pickup}</p>
              <p><span className="text-gray-800">●</span> {state?.destination}</p>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <p className="text-3xl font-bold">KES {state?.fare}</p>
              {route && <p className="text-sm text-gray-500">{route.km.toFixed(1)} km · {Math.round(route.mins)} min</p>}
            </div>
            <input type="password" inputMode="numeric" placeholder="H-Pesa PIN" maxLength="4" value={pin} onChange={e => setPin(e.target.value)} className="w-full mt-4 px-4 py-3 border rounded-2xl" />
            <button disabled={busy} onClick={confirm} className="w-full bg-bolt disabled:opacity-60 text-white py-4 rounded-2xl font-semibold mt-3">{busy ? 'Processing…' : 'Confirm & Pay'}</button>
          </>
        )}

        {status === 'tracking' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><span className="text-bolt text-xs">●</span> Driver on the way</h2>
                <p className="text-sm text-gray-500">Arriving in {eta} min</p>
              </div>
              <div className="border rounded-xl px-3 py-1 text-center">
                <p className="text-xl font-bold text-bolt leading-none">{eta}</p>
                <p className="text-[10px] text-gray-500">min ETA</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-12 rounded-full bg-bolt/15 text-bolt flex items-center justify-center font-bold text-lg">{driverName?.[0]}</div>
              <div className="flex-1">
                <p className="font-semibold">{driverName}</p>
                <p className="text-xs text-gray-500 whitespace-nowrap">Toyota Vitz · White · ★ 4.9</p>
              </div>
              <a href="tel:+254700000000" className="w-10 h-10 rounded-full border flex items-center justify-center">📞</a>
              <div className="bg-green-800 text-white text-xs font-bold rounded-lg px-3 py-2 whitespace-nowrap">{plate}</div>
            </div>

            <div className="flex items-center justify-between border-t mt-4 pt-3 text-sm">
              <div>
                <p className="font-medium">{ride?.pickup}</p>
                <p className="text-gray-500">→ {ride?.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Trip fare</p>
                <p className="text-lg font-bold">KES {ride?.fare}</p>
              </div>
            </div>

            <button className="w-full bg-green-800 text-white py-3 rounded-2xl font-semibold mt-3">💬 Chat with driver</button>
            <button onClick={() => navigate('/')} className="w-full text-gray-500 text-sm mt-2">Done</button>
            <p className="text-center text-[11px] text-gray-400 mt-1">Your ride is tracked for safety</p>
          </>
        )}
      </div>
    </div>
  )
}
