import { useEffect, useState } from 'react'
import { get, post, getHpesaToken, setHpesaToken, HPESA_URL } from '../lib/api'
import TabBar from '../components/TabBar'
import ConnectHpesa from '../components/ConnectHpesa'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// "Top up" must open the SAME H-Pesa account that is connected here. With the wallet token we sign that
// account in directly; otherwise we open H-Pesa's login with the connected number filled in.
const topUpUrl = (phone) => {
  const t = getHpesaToken()
  if (t) return `${HPESA_URL}/#sso=${encodeURIComponent(t)}&next=/deposit`
  return `${HPESA_URL}/login${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`
}

export default function Wallet() {
  const [w, setW] = useState(undefined) // undefined = loading, null = unavailable, else { linked, reconnect?, balance? }
  const balance = w === undefined ? undefined : w === null || w.balance === undefined ? null : w.balance
  const [rides, setRides] = useState([])

  const load = () => {
    get('/api/wallet/balance').then(setW).catch(() => setW(null))
    get('/api/rides/history').then(setRides).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const paid = rides.filter(r => r.status !== 'CANCELLED')
  const spent = paid.reduce((s, r) => s + (r.fare || 0), 0)

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Wallet</h1>

        {w && w.linked === false && <div className="mt-5"><ConnectHpesa light onDone={() => { setW(undefined); load() }} /></div>}
        {w && w.linked && w.reconnect && <div className="mt-5"><ConnectHpesa light reconnect onDone={() => { setW(undefined); load() }} /></div>}
        {!(w && (w.linked === false || w.reconnect)) && (
        <div className="mt-5 rounded-3xl bg-bolt text-white p-6 shadow-lg">
          <p className="text-sm text-white/80">H-Pesa balance</p>
          <p className="text-4xl font-extrabold mt-1">
            {balance === undefined ? '…' : balance === null ? '—' : `KES ${Number(balance).toLocaleString()}`}
          </p>
          {balance === null && <p className="text-xs text-white/80 mt-2">Balance unavailable right now. H-Pesa could not be reached.</p>}
          {balance === null && <button onClick={() => { setW(undefined); load() }} className="mt-3 bg-white/20 rounded-full px-4 py-1.5 text-sm">Try again</button>}
          <p className="text-xs text-white/70 mt-4">Rides are paid from your connected H-Pesa wallet.</p>
          <div className="flex gap-2 flex-wrap">
            {HPESA_URL && <a href={topUpUrl(w?.phone)} className="inline-block mt-3 bg-white text-bolt font-semibold rounded-full px-5 py-2 text-sm">Top up in H-Pesa</a>}
            {w?.linked && <button onClick={async () => { if (!window.confirm('Disconnect H-Pesa from H-Fleet? Your H-Fleet account stays.')) return; try { await post('/api/hpesa/unlink'); setHpesaToken(null); setW(undefined); load() } catch { /* ignore */ } }} className="mt-3 bg-white/20 rounded-full px-4 py-2 text-sm">Disconnect</button>}
          </div>
        </div>)}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500">Spent on rides</p>
            <p className="text-xl font-bold mt-1">KES {spent.toLocaleString()}</p>
          </div>
          <div className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500">Rides paid</p>
            <p className="text-xl font-bold mt-1">{paid.length}</p>
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
            <p className="font-bold">{r.status === 'CANCELLED' ? <span className="text-gray-500">Refunded</span> : `− KES ${r.fare}`}</p>
          </div>
        ))}
        <div className="h-6" />
      </div>
      <TabBar />
    </div>
  )
}
