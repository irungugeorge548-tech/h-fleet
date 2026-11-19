import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MapView from '../components/MapView'
import Icon from '../components/Icon'
import { post, errMsg } from '../lib/api'
import { fareForKm, haversineKm } from '../lib/fare'

// Driving route from OSRM (free). Falls back to a straight line if it cannot be reached.
async function fetchRoute(a, b) {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`)
    const d = await r.json()
    const route = d.routes?.[0]
    if (!route) return null
    return { coords: route.geometry.coordinates, km: route.distance / 1000, mins: route.duration / 60 }
  } catch { return null }
}

export default function Ride() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState('confirm') // confirm | tracking | cancelled
  const [ride, setRide] = useState(null)
  const [route, setRoute] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [eta, setEta] = useState(4)

  const pickup = state?.pickup
  const dest = state?.dest
  useEffect(() => { if (!pickup || !dest) navigate('/', { replace: true }) }, [])
  useEffect(() => { if (pickup && dest) fetchRoute(pickup, dest).then(setRoute) }, [])
  useEffect(() => { if (pickup && dest) mapRef.current?.fit([pickup, dest], { top: 90, bottom: 400, left: 40, right: 40 }) }, [route])

  useEffect(() => {
    if (status !== 'tracking') return
    const t = setInterval(() => setEta(e => Math.max(1, e - 1)), 60000)
    return () => clearInterval(t)
  }, [status])

  if (!pickup || !dest) return null
  const km = route ? route.km : haversineKm(pickup, dest) * 1.3
  const fare = fareForKm(km)
  const point = (p) => ({ name: p.name, lat: p.lat, lng: p.lng })

  const confirm = async () => {
    setBusy(true); setError('')
    try {
      const r = await post('/api/rides/request', { pickup: point(pickup), destination: point(dest), distanceKm: km, pin })
      setRide(r); setStatus('tracking')
    } catch (err) { setError(errMsg(err, 'Could not book the ride')) } finally { setBusy(false) }
  }

  const cancel = async () => {
    if (!window.confirm('Cancel this ride? You will be refunded in full.')) return
    setBusy(true); setError('')
    try { const r = await post(`/api/rides/${ride.id}/cancel`); setInfo(r.message); setStatus('cancelled') }
    catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  const shareTrip = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${dest.lat},${dest.lng}`
    const text = `I'm on an H-Fleet ride from ${pickup.name} to ${dest.name}.${ride?.driverName ? ` Driver: ${ride.driverName}.` : ''}`
    if (navigator.share) { try { await navigator.share({ title: 'My H-Fleet trip', text, url }) } catch { /* cancelled */ } }
    else { try { await navigator.clipboard.writeText(`${text} ${url}`); setInfo('Trip details copied. Paste them to a friend.') } catch { window.prompt('Copy your trip details', `${text} ${url}`) } }
  }

  const [driverName, plate] = (ride?.driverName || 'Driver • KAA 000A').split('•').map(s => s.trim())

  return (
    <div className="h-screen relative">
      <MapView ref={mapRef} center={pickup} zoom={13} route={route?.coords || [[pickup.lng, pickup.lat], [dest.lng, dest.lat]]}
        markers={[{ kind: 'pickup', lat: pickup.lat, lng: pickup.lng }, { kind: 'dest', lat: dest.lat, lng: dest.lng }]} />

      <button onClick={() => navigate('/')} aria-label="Back" className="absolute top-4 left-4 z-[1000] w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"><Icon name="back" size={22} /></button>
      {status === 'tracking' && (
        <button onClick={() => navigate('/account/safety')} className="absolute top-4 right-4 z-[1000] bg-white shadow rounded-full px-4 py-2 text-sm font-medium flex items-center gap-1.5"><Icon name="shield" size={16} className="text-bolt" />Safety</button>)}

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-5 z-[1000] max-h-[70vh] overflow-y-auto">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-3">{error}</div>}

        {status === 'confirm' && (<>
          <h2 className="text-xl font-bold">Confirm ride</h2>
          <div className="mt-3 text-sm space-y-2">
            <p className="flex gap-2"><span className="w-2.5 h-2.5 mt-1.5 rounded-full bg-bolt flex-shrink-0" /><span className="min-w-0">{pickup.name}</span></p>
            <p className="flex gap-2"><span className="w-2.5 h-2.5 mt-1.5 bg-gray-900 flex-shrink-0" /><span className="min-w-0">{dest.name}</span></p>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-bold">KES {fare}</p>
            <p className="text-sm text-gray-500">{km.toFixed(1)} km{route ? ` · ${Math.round(route.mins)} min` : ' (estimate)'}</p>
          </div>
          <input type="password" inputMode="numeric" placeholder="H-Pesa PIN" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} className="w-full mt-4 px-4 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-bolt" />
          <button disabled={busy || pin.length < 4} onClick={confirm} className="w-full bg-bolt disabled:opacity-60 text-white py-4 rounded-2xl font-semibold mt-3 flex items-center justify-center gap-2"><Icon name="lock" size={18} />{busy ? 'Processing…' : `Confirm & pay KES ${fare}`}</button>
          <p className="text-center text-xs text-gray-500 mt-2">Paid from your H-Pesa wallet</p>
        </>)}

        {status === 'tracking' && (<>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-bolt" />Driver on the way</h2>
              <p className="text-sm text-gray-500">Arriving in {eta} min <span className="ml-1 text-[10px] bg-gray-100 rounded px-1.5 py-0.5">demo driver</span></p>
            </div>
            <div className="border rounded-xl px-3 py-1 text-center"><p className="text-xl font-bold text-bolt leading-none">{eta}</p><p className="text-[10px] text-gray-500">min ETA</p></div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-12 rounded-full bg-bolt/15 text-bolt flex items-center justify-center font-bold text-lg">{driverName?.[0]}</div>
            <div className="flex-1"><p className="font-semibold">{driverName}</p><p className="text-xs text-gray-500">Toyota Vitz · White</p></div>
            <div className="bg-green-800 text-white text-xs font-bold rounded-lg px-3 py-2 whitespace-nowrap">{plate}</div>
          </div>
          <div className="flex items-center justify-between border-t mt-4 pt-3 text-sm">
            <div className="min-w-0 pr-3"><p className="font-medium truncate">{ride?.pickup}</p><p className="text-gray-500 truncate">to {ride?.destination}</p></div>
            <div className="text-right"><p className="text-xs text-gray-500">Paid</p><p className="text-lg font-bold">KES {ride?.fare}</p></div>
          </div>
          {info && <p className="text-xs text-bolt mt-2">{info}</p>}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={shareTrip} className="border rounded-2xl py-3 font-medium flex items-center justify-center gap-2"><Icon name="share" size={18} />Share trip</button>
            <a href="tel:999" className="border border-red-200 text-red-600 rounded-2xl py-3 font-medium flex items-center justify-center gap-2"><Icon name="alert" size={18} />Emergency 999</a>
          </div>
          <button disabled={busy} onClick={cancel} className="w-full text-red-600 text-sm mt-3 py-2">Cancel ride</button>
          <button onClick={() => navigate('/')} className="w-full text-gray-500 text-sm">Done</button>
        </>)}

        {status === 'cancelled' && (<>
          <h2 className="text-xl font-bold">Ride cancelled</h2>
          <p className="text-sm text-gray-600 mt-2">{info}</p>
          <button onClick={() => navigate('/')} className="w-full bg-bolt text-white py-4 rounded-2xl font-semibold mt-4">Back to Home</button>
        </>)}
      </div>
    </div>
  )
}
