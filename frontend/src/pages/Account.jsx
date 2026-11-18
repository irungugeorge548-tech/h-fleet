import { useEffect, useState } from 'react'
import axios from 'axios'
import TabBar from '../components/TabBar'

const items = [
  { icon: '👤', title: 'Profile', sub: 'Personal information, documents' },
  { icon: '💳', title: 'Payment', sub: 'H-Pesa wallet, payment methods' },
  { icon: '💬', title: 'Support', sub: 'Help centre, chat with us' },
  { icon: '🛡', title: 'Safety', sub: 'Safety settings, emergency contacts' },
  { icon: '⚙️', title: 'Settings', sub: 'App preferences, notifications' },
]

export default function Account({ logout }) {
  const [rideCount, setRideCount] = useState(null)
  let user = {}
  try { user = JSON.parse(localStorage.getItem('hfleet_user')) || {} } catch {}
  const token = localStorage.getItem('hfleet_token')

  useEffect(() => {
    axios.get('/api/rides/history', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setRideCount(r.data.length))
      .catch(() => {})
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Account</h1>

        <div className="flex items-center gap-4 mt-5">
          <div className="w-20 h-20 rounded-full bg-bolt/15 text-bolt flex items-center justify-center text-3xl font-bold">
            {(user.name || '?')[0]}
          </div>
          <div>
            <p className="text-2xl font-extrabold">{user.name || 'Rider'}</p>
            <p className="text-sm text-gray-500">
              {user.phone}{rideCount !== null && ` • ${rideCount} ride${rideCount === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {items.map(i => (
            <div key={i.title} className="flex items-center gap-4 border rounded-2xl p-4 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-bolt/10 flex items-center justify-center text-lg">{i.icon}</div>
              <div className="flex-1">
                <p className="font-semibold">{i.title}</p>
                <p className="text-xs text-gray-500">{i.sub}</p>
              </div>
              <span className="text-gray-400">›</span>
            </div>
          ))}
        </div>

        <button onClick={logout} className="w-full mt-6 mb-6 border border-red-200 text-red-600 py-3 rounded-2xl font-semibold">
          Log out
        </button>
      </div>
      <TabBar />
    </div>
  )
}
