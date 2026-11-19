import { useEffect, useState } from 'react'
import SubScreen, { field, Msg } from '../components/SubScreen'
import Icon from '../components/Icon'
import { get, post, errMsg } from '../lib/api'

const FAQ = [
  ['How do I pay for a ride?', 'Rides are paid from your H-Pesa wallet. After you choose a destination, enter your 4-digit H-Pesa PIN to confirm. Your wallet is charged once, even if the connection drops.'],
  ['My payment failed. Was I charged?', 'If a payment fails, you are not charged. If a ride cannot be booked after you paid, the payment is refunded automatically. Check Wallet and Activity to confirm.'],
  ['How do I cancel a ride?', 'Open the ride after booking and tap Cancel ride. You are refunded in full to your H-Pesa wallet.'],
  ['How do I top up my wallet?', 'Open H-Pesa and use Deposit. Your balance here updates straight away.'],
  ['My pickup is not my current location.', 'On Home, tap From and search a place, or choose it on the map.'],
  ['I cannot find my building or shop.', 'Map data comes from OpenStreetMap, so a new business may be missing. Search a nearby landmark, or choose the spot on the map.'],
]

export default function Support() {
  const [open, setOpen] = useState(null)
  const [form, setForm] = useState({ subject: '', message: '' })
  const [s, setS] = useState({})
  const [sent, setSent] = useState([])
  const load = () => get('/api/support').then(setSent).catch(() => {})
  useEffect(() => { load() }, [])

  const send = async (e) => {
    e.preventDefault(); setS({})
    try { await post('/api/support', form); setForm({ subject: '', message: '' }); setS({ ok: 'Message sent. We will get back to you.' }); load() } catch (err) { setS({ error: errMsg(err) }) }
  }

  return (
    <SubScreen title="Support">
      <h2 className="font-bold mb-2">Help centre</h2>
      <div className="bg-white rounded-2xl border divide-y mb-5">
        {FAQ.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-3 p-4 text-left"><span className="flex-1 font-medium">{q}</span><Icon name="chev" size={16} className={`text-gray-400 transition-transform ${open === i ? 'rotate-90' : ''}`} /></button>
            {open === i && <p className="px-4 pb-4 text-sm text-gray-600">{a}</p>}
          </div>))}
      </div>

      <form onSubmit={send} className="bg-white rounded-2xl border p-4 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><Icon name="chat" size={18} />Contact us</h2>
        <Msg ok={s.ok} error={s.error} />
        <input className={field} placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} maxLength={80} required />
        <textarea className={`${field} h-28`} placeholder="Tell us what happened" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} maxLength={1000} required />
        <button className="w-full bg-bolt text-white py-3 rounded-2xl font-semibold">Send message</button>
      </form>

      {sent.length > 0 && (<>
        <h2 className="font-bold mt-5 mb-2">Your messages</h2>
        <div className="bg-white rounded-2xl border divide-y">
          {sent.map(m => (<div key={m.id} className="p-4"><p className="font-medium">{m.subject}</p><p className="text-xs text-gray-500 mt-0.5">{new Date(m.createdAt).toLocaleDateString('en-GB')} · {m.status === 'OPEN' ? 'Received' : m.status}</p></div>))}
        </div>
      </>)}
    </SubScreen>
  )
}
