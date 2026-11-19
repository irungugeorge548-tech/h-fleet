import { useEffect, useState } from 'react'
import SubScreen, { field, Msg } from '../components/SubScreen'
import Icon from '../components/Icon'
import { get, post, del, errMsg } from '../lib/api'

export default function Safety() {
  const [contacts, setContacts] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [s, setS] = useState({})
  const [sharing, setSharing] = useState(false)

  const load = () => get('/api/safety/contacts').then(setContacts).catch(e => { setContacts([]); setS({ error: errMsg(e) }) })
  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault(); setS({})
    try { await post('/api/safety/contacts', form); setForm({ name: '', phone: '' }); await load() } catch (err) { setS({ error: errMsg(err) }) }
  }
  const remove = async (id) => { try { await del(`/api/safety/contacts/${id}`); await load() } catch (err) { setS({ error: errMsg(err) }) } }

  // Opens the phone's messaging app with your location, ready to send to your first contact.
  const sendAlert = () => {
    if (!contacts?.length) return setS({ error: 'Add an emergency contact first.' })
    setSharing(true)
    const go = (loc) => {
      const where = loc ? ` My location: https://www.google.com/maps?q=${loc.lat},${loc.lng}` : ''
      window.location.href = `sms:${contacts[0].phone}?&body=${encodeURIComponent(`I need help. This is an H-Fleet safety alert.${where}`)}`
      setSharing(false)
    }
    if (!navigator.geolocation) return go(null)
    navigator.geolocation.getCurrentPosition(p => go({ lat: p.coords.latitude, lng: p.coords.longitude }), () => go(null), { timeout: 8000 })
  }

  return (
    <SubScreen title="Safety">
      <a href="tel:999" className="flex items-center gap-3 bg-red-600 text-white rounded-2xl p-4 mb-3 font-semibold"><Icon name="phone" size={22} />Call emergency services (999)</a>
      <button onClick={sendAlert} disabled={sharing} className="w-full flex items-center gap-3 border border-red-200 text-red-600 rounded-2xl p-4 mb-5 font-semibold bg-white"><Icon name="alert" size={22} />{sharing ? 'Getting your location…' : 'Send my location to my emergency contact'}</button>

      <h2 className="font-bold mb-2">Emergency contacts</h2>
      <Msg error={s.error} />
      <div className="bg-white rounded-2xl border divide-y mb-4">
        {contacts === null && <p className="p-4 text-gray-400 text-sm">Loading…</p>}
        {contacts?.length === 0 && <p className="p-4 text-gray-500 text-sm">No contacts yet. Add someone who should know when you travel.</p>}
        {contacts?.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-4">
            <span className="w-10 h-10 rounded-full bg-bolt/10 text-bolt flex items-center justify-center font-bold">{c.name[0]}</span>
            <div className="flex-1 min-w-0"><p className="font-medium truncate">{c.name}</p><p className="text-xs text-gray-500">{c.phone}</p></div>
            <a href={`tel:${c.phone}`} aria-label={`Call ${c.name}`} className="w-9 h-9 rounded-full border flex items-center justify-center"><Icon name="phone" size={16} /></a>
            <button onClick={() => remove(c.id)} aria-label={`Remove ${c.name}`} className="w-9 h-9 flex items-center justify-center text-gray-400"><Icon name="trash" size={18} /></button>
          </div>))}
      </div>

      {(contacts?.length ?? 0) < 3 && (
        <form onSubmit={add} className="bg-white rounded-2xl border p-4 space-y-3">
          <p className="font-medium">Add a contact (up to 3)</p>
          <input className={field} placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className={field} type="tel" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          <button className="w-full bg-bolt text-white py-3 rounded-2xl font-semibold">Save contact</button>
        </form>)}
      <p className="text-xs text-gray-500 mt-4">During a ride, use Share trip so a friend can follow your route.</p>
    </SubScreen>
  )
}
