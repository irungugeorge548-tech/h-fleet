import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import TabBar from '../components/TabBar'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LocationMarker({ setPos }) {
  const map = useMap()
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      setPos([latitude, longitude])
      map.setView([latitude, longitude], 15)
    })
  }, [map, setPos])
  return null
}

const loadPlaces = () => {
  try { return JSON.parse(localStorage.getItem('hfleet_places')) || {} } catch { return {} }
}

function Shortcut({ icon, label, onClick, active }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1 text-sm">
      <span className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${active ? 'bg-bolt text-white' : 'bg-bolt/10'}`}>{icon}</span>
      {label}
    </button>
  )
}

export default function Home() {
  const [pos, setPos] = useState([-1.286389, 36.817223])
  const [map, setMap] = useState(null)
  const [destination, setDestination] = useState('')
  const [places, setPlaces] = useState(loadPlaces)
  const [recent, setRecent] = useState([])
  const [panel, setPanel] = useState(null) // null | 'saved' | 'more'
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/rides/history', { headers: { Authorization: `Bearer ${localStorage.getItem('hfleet_token')}` } })
      .then(r => setRecent([...new Set(r.data.map(x => x.destination))].slice(0, 5)))
      .catch(() => {})
  }, [])

  const savePlace = (key, label) => {
    const v = window.prompt(`Enter your ${label} address`, places[key] || '')
    if (v && v.trim()) {
      const next = { ...places, [key]: v.trim() }
      setPlaces(next)
      localStorage.setItem('hfleet_places', JSON.stringify(next))
      setDestination(v.trim())
    }
    setPanel(null)
  }
  const usePlace = (key, label) => (places[key] ? setDestination(places[key]) : savePlace(key, label))

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(p => {
      const c = [p.coords.latitude, p.coords.longitude]
      setPos(c); map?.setView(c, 15)
    })
  }

  const request = () => {
    if (!destination.trim()) return alert('Enter destination')
    navigate('/ride', { state: { pickup: 'Current Location', destination: destination.trim(), fare: 350, pos } })
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-4 py-3 bg-white z-[1100] relative">
        <span className="text-2xl w-8">☰</span>
        <span className="text-2xl font-extrabold tracking-tight"><span className="text-bolt">⚡</span>H-Fleet</span>
        <span className="text-xl w-8 text-right">🔔</span>
      </header>

      <div className="flex-1 relative">
        <MapContainer ref={setMap} center={pos} zoom={14} zoomControl={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker setPos={setPos} />
          <Marker position={pos} />
        </MapContainer>
        <button onClick={locate} aria-label="Centre on my location"
          className="absolute right-4 bottom-12 z-[1000] w-11 h-11 rounded-full bg-white shadow flex items-center justify-center text-bolt text-lg">➤</button>
      </div>

      <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] px-5 pt-3 pb-4 -mt-8 relative z-[1100]">
        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
        <h2 className="text-2xl font-extrabold">Ready, set, ride <span className="text-bolt">⚡</span></h2>
        <p className="text-gray-500 text-sm mt-0.5">Let's get you there.</p>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex flex-col items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="w-3.5 h-3.5 rounded-full bg-bolt" />
            <span className="w-1 h-1 rounded-full bg-gray-300" />
          </div>
          <div className="flex-1 flex items-center border rounded-2xl px-4 py-3">
            <input value={destination} onChange={e => setDestination(e.target.value)} onKeyDown={e => e.key === 'Enter' && request()}
              placeholder="Where to?" className="flex-1 bg-transparent outline-none text-lg min-w-0" />
            {destination && <button onClick={() => setDestination('')} aria-label="Clear" className="text-gray-400 text-xl">✕</button>}
          </div>
        </div>

        <div className="flex items-start mt-4 divide-x">
          <Shortcut icon="★" label="Saved" active={panel === 'saved'} onClick={() => setPanel(panel === 'saved' ? null : 'saved')} />
          <Shortcut icon="🏠" label="Home" onClick={() => usePlace('home', 'Home')} />
          <Shortcut icon="💼" label="Work" onClick={() => usePlace('work', 'Work')} />
          <Shortcut icon="⋯" label="More" active={panel === 'more'} onClick={() => setPanel(panel === 'more' ? null : 'more')} />
        </div>

        {panel === 'saved' && (
          <div className="mt-3 border rounded-2xl divide-y text-sm">
            {recent.length === 0 && <p className="p-3 text-gray-500">Places you ride to will appear here.</p>}
            {recent.map(p => (
              <button key={p} onClick={() => { setDestination(p); setPanel(null) }} className="w-full text-left p-3">🕘 {p}</button>
            ))}
          </div>
        )}
        {panel === 'more' && (
          <div className="mt-3 border rounded-2xl divide-y text-sm">
            <button onClick={() => savePlace('home', 'Home')} className="w-full text-left p-3">🏠 {places.home ? 'Change Home address' : 'Set Home address'}</button>
            <button onClick={() => savePlace('work', 'Work')} className="w-full text-left p-3">💼 {places.work ? 'Change Work address' : 'Set Work address'}</button>
          </div>
        )}

        <button onClick={request} className="w-full mt-4 bg-bolt text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-between px-6">
          <span className="flex-1 text-center">Find a ride</span><span>→</span>
        </button>
        <p className="text-xs text-gray-500 mt-3">🛡 Safety first. Always.</p>
      </div>
      <TabBar />
    </div>
  )
}
