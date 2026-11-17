import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LocationMarker({ setPos }) {
  const map = useMap()
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      setPos([latitude, longitude])
      map.setView([latitude, longitude], 15)
    })
  }, [map, setPos])
  return null
}

export default function Home({ logout }) {
  const [pos, setPos] = useState([-1.286389, 36.817223])
  const [destination, setDestination] = useState('')
  const navigate = useNavigate()

  const request = () => {
    if (!destination) return alert('Enter destination')
    navigate('/ride', { state: { pickup: 'Current Location', destination, fare: 350, pos } })
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={pos} zoom={14} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker setPos={setPos} />
          <Marker position={pos} />
        </MapContainer>
      </div>

      {/* Bottom sheet like Bolt */}
      <div className="bg-white rounded-t-3xl shadow-2xl p-5 -mt-6 relative z-10">
        <h2 className="text-2xl font-bold mb-4">Ready, set, ride.</h2>
        <div className="bg-gray-100 rounded-2xl p-4 flex items-center mb-4">
          <span className="text-xl mr-3">🔍</span>
          <input
            value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder="Where to?"
            className="flex-1 bg-transparent outline-none text-lg"
          />
        </div>
        <button onClick={request} className="w-full bg-bolt text-white py-4 rounded-2xl font-semibold text-lg">
          Request Ride
        </button>
        <div className="flex justify-around mt-6 text-sm text-gray-500">
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  )
}
