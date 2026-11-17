import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'

export default function Ride() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState('confirm')
  const [ride, setRide] = useState(null)
  const [destPos, setDestPos] = useState(null)
  const token = localStorage.getItem('hfleet_token')

  const pickup = state?.pos || [-1.286389, 36.817223]

  useEffect(() => {
    if (state?.destination) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(state.destination)}&limit=1`)
        .then(r => r.json())
        .then(data => {
          if (data[0]) setDestPos([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        })
    }
  }, [state])

  const confirm = async () => {
    try {
      const res = await axios.post('/api/rides/request', {
        pickup: state.pickup,
        destination: state.destination,
        fare: state.fare,
        pin
      }, { headers: { Authorization: `Bearer ${token}` } })
      setRide(res.data)
      setStatus('tracking')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed')
    }
  }

  return (
    <div className="h-screen relative">
      <MapContainer center={pickup} zoom={14} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={pickup} />
        {destPos && <Marker position={destPos} />}
        {destPos && <Polyline positions={[pickup, destPos]} color="#32BB78" weight={5} />}
      </MapContainer>

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 z-[1000]">
        {status === 'confirm' && (
          <>
            <h2 className="text-xl font-bold">Confirm Ride</h2>
            <p className="text-gray-500 mt-1">{state?.destination}</p>
            <p className="text-2xl font-bold text-bolt mt-2">KES {state?.fare}</p>
            <input type="password" placeholder="H-Pesa PIN" maxLength="4" value={pin} onChange={e => setPin(e.target.value)} className="w-full mt-4 px-4 py-3 border rounded-2xl" />
            <button onClick={confirm} className="w-full bg-bolt text-white py-4 rounded-2xl font-semibold mt-3">Confirm & Pay</button>
          </>
        )}
        {status === 'tracking' && (
          <>
            <h2 className="text-xl font-bold text-bolt">Driver on the way</h2>
            <p className="mt-1">{ride?.driverName}</p>
            <p className="text-sm text-gray-500 mt-2">Arriving soon</p>
            <button onClick={() => navigate('/')} className="w-full bg-gray-200 py-3 rounded-2xl mt-4">Done</button>
          </>
        )}
      </div>
    </div>
  )
}
