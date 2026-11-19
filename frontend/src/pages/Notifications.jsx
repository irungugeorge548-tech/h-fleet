import { useEffect, useState } from 'react'
import SubScreen from '../components/SubScreen'
import Icon from '../components/Icon'
import { get } from '../lib/api'

const when = (iso) => { const d = new Date(iso); return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }

// Updates about your rides and payments
export default function Notifications() {
  const [rides, setRides] = useState(null)
  useEffect(() => { get('/api/rides/history').then(setRides).catch(() => setRides([])) }, [])
  const items = (rides || []).flatMap(r => {
    const out = [{ id: r.id + 'p', at: r.createdAt, icon: 'wallet', title: `Paid KES ${r.fare}`, sub: `Ride to ${r.destination}` }]
    if (r.status === 'CANCELLED') out.unshift({ id: r.id + 'c', at: r.createdAt, icon: 'check', title: 'Ride cancelled', sub: `KES ${r.fare} refunded to your H-Pesa wallet` })
    else out.unshift({ id: r.id + 'a', at: r.createdAt, icon: 'pin', title: 'Driver assigned', sub: r.driverName || '' })
    return out
  })
  return (
    <SubScreen title="Notifications">
      {rides === null && <p className="text-gray-400">Loading…</p>}
      {rides && items.length === 0 && <p className="text-center text-gray-500 text-sm py-16">Nothing yet. Updates about your rides and payments will appear here.</p>}
      <div className="bg-white rounded-2xl border divide-y">
        {items.map(n => (
          <div key={n.id} className="flex items-center gap-3 p-4">
            <span className="w-10 h-10 rounded-full bg-bolt/10 text-bolt flex items-center justify-center"><Icon name={n.icon} size={20} /></span>
            <div className="flex-1 min-w-0"><p className="font-medium">{n.title}</p><p className="text-xs text-gray-500 truncate">{n.sub}</p></div>
            <span className="text-[11px] text-gray-400 whitespace-nowrap">{when(n.at)}</span>
          </div>))}
      </div>
    </SubScreen>
  )
}
