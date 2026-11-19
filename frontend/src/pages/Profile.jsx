import { useEffect, useState } from 'react'
import SubScreen, { field, Msg } from '../components/SubScreen'
import { get, patch, post, errMsg } from '../lib/api'

export default function Profile() {
  const [me, setMe] = useState(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [pin, setPin] = useState({ currentPin: '', newPin: '' })
  const [s, setS] = useState({})
  const [sp, setSp] = useState({})
  const [sn, setSn] = useState({})

  useEffect(() => { get('/api/account/me').then(u => { setMe(u); setForm({ name: u.name, email: u.email }) }).catch(e => setS({ error: errMsg(e) })) }, [])

  const run = (setState, fn, done) => async (e) => {
    e.preventDefault(); setState({})
    try { const r = await fn(); setState({ ok: done(r) }) } catch (err) { setState({ error: errMsg(err) }) }
  }
  const saveProfile = run(setS, () => patch('/api/account/profile', form), (u) => {
    localStorage.setItem('hfleet_user', JSON.stringify({ id: u.id, name: u.name, phone: u.phone, email: u.email })); setMe(u); return 'Saved'
  })

  return (
    <SubScreen title="Profile">
      {!me ? <><Msg error={s.error} />{!s.error && <p className="text-gray-400">Loading…</p>}</> : (<>
        <form onSubmit={saveProfile} className="bg-white rounded-3xl border p-5 space-y-3 mb-4">
          <Msg ok={s.ok} error={s.error} />
          <label className="block text-sm text-gray-700">Full name</label>
          <input className={field} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <label className="block text-sm text-gray-700">Email</label>
          <input className={field} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <label className="block text-sm text-gray-700">Phone (your H-Pesa number)</label>
          <input className={`${field} bg-gray-50 text-gray-500`} value={me.phone} disabled />
          <button className="w-full bg-bolt text-white py-3.5 rounded-2xl font-semibold">Save</button>
        </form>
        <form onSubmit={run(setSn, () => post('/api/account/change-pin', pin), (r) => { setPin({ currentPin: '', newPin: '' }); return r.message })} className="bg-white rounded-3xl border p-5 space-y-3 mb-4">
          <h2 className="font-bold">Change PIN</h2><Msg ok={sn.ok} error={sn.error} />
          <input className={field} type="password" inputMode="numeric" maxLength={4} placeholder="Current PIN" value={pin.currentPin} onChange={e => setPin({ ...pin, currentPin: e.target.value })} required />
          <input className={field} type="password" inputMode="numeric" maxLength={4} placeholder="New 4-digit PIN" value={pin.newPin} onChange={e => setPin({ ...pin, newPin: e.target.value })} required />
          <button className="w-full border border-bolt text-bolt py-3.5 rounded-2xl font-semibold">Change PIN</button>
        </form>
        <form onSubmit={run(setSp, () => post('/api/account/change-password', pw), (r) => { setPw({ currentPassword: '', newPassword: '' }); return r.message })} className="bg-white rounded-3xl border p-5 space-y-3">
          <h2 className="font-bold">Change password</h2><Msg ok={sp.ok} error={sp.error} />
          <input className={field} type="password" placeholder="Current password" value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} required />
          <input className={field} type="password" placeholder="New password (6+ characters)" value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} required />
          <button className="w-full border border-bolt text-bolt py-3.5 rounded-2xl font-semibold">Change password</button>
        </form>
      </>)}
    </SubScreen>
  )
}
