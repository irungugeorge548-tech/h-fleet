import { useEffect, useState } from 'react'
import axios from 'axios'
import TabBar from '../components/TabBar'

const TABS = ['Rides', 'Payments', 'Reservations']

const statusLabel = (s) => ({
  COMPLETED: 'Ride completed',
  ACCEPTED: 'Driver assigned',
  SEARCHING: 'Finding a driver',
}[s] || s)

const fmtDate = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })} • ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

// Small decorative route thumbnail, drawn deterministically from the ride id
function RouteThumb({ id }) {
  const n = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7)
  const x1 = 14 + (n % 18), y1 = 52 - (n % 14)
  const x2 = 56 - (n % 20), y2 = 12 + (n % 16)
  const mx = 30 + ((n >> 2) % 16)
  return (
    <svg viewBox="0 0 72 64" className="w-[72px] h-16 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0">
      <path d="M0 30 H72 M36 0 V64" stroke="#fff" strokeWidth="5" />
      <path d={`M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} stroke="#32BB78" strokeWidth="2.5" fill="none" />
      <circle cx={x1} cy={y1} r="3.5" fill="#32BB78" />
      <circle cx={x2} cy={y2} r="3.5" fill="#32BB78" />
    </svg>
  )
}

function Empty({ text }) {
  return <p className="text-center text-gray-500 text-sm py-16 px-8">{text}</p>
}

export default function Activity() {
  const [tab, setTab] = useState('Rides')
  const [rides, setRides] = useState(null)
  const [error, setError] = useState('')
  const token = localStorage.getItem('hfleet_token')

  useEffect(() => {
    axios.get('/api/rides/history', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setRides(r.data))
      .catch(() => setError('Could not load your activity. Check your connection and try again.'))
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="px-5 pt-5 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Activity</h1>
        <span className="text-xl">🔔</span>
      </header>

      <div className="flex border-b mt-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${tab === t ? 'text-bolt border-bolt' : 'text-gray-500 border-transparent'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && <Empty text={error} />}
        {!error && rides === null && <Empty text="Loading…" />}

        {!error && rides && tab === 'Rides' && (
          <>
            <h2 className="font-bold px-5 pt-4 pb-2">Past rides</h2>
            {rides.length === 0 && <Empty text="No rides yet. Request your first ride from Home." />}
            {rides.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3 border-b">
                <RouteThumb id={r.id} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.destination}</p>
                  <p className="text-xs text-gray-500">{fmtDate(r.createdAt)}</p>
                  <p className="text-xs text-bolt mt-1">✓ {statusLabel(r.status)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-bolt">KES {r.fare}</p>
                  <p className="text-xs text-gray-500">Economy</p>
                </div>
              </div>
            ))}
          </>
        )}

        {!error && rides && tab === 'Payments' && (
          <>
            <h2 className="font-bold px-5 pt-4 pb-2">Payments</h2>
            {rides.length === 0 && <Empty text="No payments yet." />}
            {rides.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-4 border-b">
                <div className="w-10 h-10 rounded-full bg-bolt/15 text-bolt flex items-center justify-center font-bold">H</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">H-Pesa</p>
                  <p className="text-xs text-gray-500 truncate">Ride to {r.destination} · {fmtDate(r.createdAt)}</p>
                </div>
                <p className="font-bold">− KES {r.fare}</p>
              </div>
            ))}
          </>
        )}

        {!error && rides && tab === 'Reservations' && (
          <Empty text="No reservations yet. Scheduled rides are coming soon." />
        )}
      </div>

      <TabBar />
    </div>
  )
}
