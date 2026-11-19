import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, getUser } from '../lib/api'
import TabBar from '../components/TabBar'
import Icon from '../components/Icon'

const items = [
  { icon: 'user', title: 'Profile', sub: 'Personal information, documents', to: '/account/profile' },
  { icon: 'wallet', title: 'Payment', sub: 'H-Pesa wallet, payment methods', to: '/wallet' },
  { icon: 'chat', title: 'Support', sub: 'Help centre, chat with us', to: '/account/support' },
  { icon: 'shield', title: 'Safety', sub: 'Safety settings, emergency contacts', to: '/account/safety' },
  { icon: 'gear', title: 'Settings', sub: 'App preferences, notifications', to: '/account/settings' },
]

export default function Account({ logout }) {
  const [rideCount, setRideCount] = useState(null)
  const user = getUser()
  useEffect(() => { get('/api/rides/history').then(r => setRideCount(r.length)).catch(() => {}) }, [])

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Account</h1>
        <div className="flex items-center gap-4 mt-5">
          <div className="w-20 h-20 rounded-full bg-bolt/15 text-bolt flex items-center justify-center text-3xl font-bold">{(user.name || '?')[0]}</div>
          <div>
            <p className="text-2xl font-extrabold">{user.name || 'Rider'}</p>
            <p className="text-sm text-gray-500">{user.phone}{rideCount !== null && ` • ${rideCount} ride${rideCount === 1 ? '' : 's'}`}</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {items.map(i => (
            <Link key={i.title} to={i.to} className="flex items-center gap-4 border rounded-2xl p-4 shadow-sm active:bg-gray-50">
              <div className="w-11 h-11 rounded-full bg-bolt/10 text-bolt flex items-center justify-center"><Icon name={i.icon} size={22} /></div>
              <div className="flex-1"><p className="font-semibold">{i.title}</p><p className="text-xs text-gray-500">{i.sub}</p></div>
              <Icon name="chev" size={18} className="text-gray-400" />
            </Link>))}
        </div>
        <button onClick={logout} className="w-full mt-6 mb-6 border border-red-200 text-red-600 py-3 rounded-2xl font-semibold">Log out</button>
      </div>
      <TabBar />
    </div>
  )
}
