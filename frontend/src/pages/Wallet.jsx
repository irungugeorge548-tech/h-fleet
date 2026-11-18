import { useEffect, useState } from 'react'
import axios from 'axios'
import TabBar from '../components/TabBar'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Wallet() {
  const [balance, setBalance] = useState(undefined) // undefined = loading, null = unavailable
  const [rides, setRides] = useState([])
  const headers = { Authorization: `Bearer ${localStorage.getItem('hfleet_token')}` }

  useEffect(() => {
    axios.get('/api/wallet/balance', { headers })
      .then(r => setBalance(r.data.balance))
      .catch(() => setBalance(null))
    axios.get('/api/rides/history', { headers })
      .then(r => setRides(r.data))
      .catch(() => {})
  }, [])

  const spent = rides.reduce((s, r) => s + (r.fare || 0), 0)

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Wallet</h1>

        <div className="mt-5 rounded-3xl bg-bolt text-white p-6 shadow-lg">
          <p className="text-sm text-white/80">H-Pesa balance</p>
          <p className="text-4xl font-extrabold mt-1">
            {balance === undefined ? '…' : balance === null ? '—' : `KES ${Number(balance).toLocaleString()}`}
          </p>
          {balance === null && <p className="text-xs text-white/80 mt-2">Balance unavailable right now. H-Pesa could not be reached.</p>}
          <p className="text-xs text-white/70 mt-4">Rides are paid from your H-Pesa wallet.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500">Spent on rides</p>
            <p className="text-xl font-bold mt-1">KES {spent.toLocaleString()}</p>
          </div>
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500">Rides paid</p>
            <p className="text-xl font-bold mt-1">{rides.length}</p>
          </div>
        </div>

        <h2 className="font-bold mt-6 mb-2">Recent payments</h2>
        {rides.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">No payments yet.</p>}
        {rides.slice(0, 6).map(r => (
          <div key={r.id} className="flex items-center gap-3 py-3 border-b">
            <div className="w-10 h-10 rounded-full bg-bolt/15 text-bolt flex items-center justify-center font-bold">H</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">Ride to {r.destination}</p>
              <p className="text-xs text-gray-500">{fmtDate(r.createdAt)}</p>
            </div>
            <p className="font-bold">− KES {r.fare}</p>
          </div>
        ))}
        <div className="h-6" />
      </div>
      <TabBar />
    </div>
  )
}
