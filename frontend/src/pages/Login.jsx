import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Mascot from '../components/Mascot'
import Icon from '../components/Icon'

const field = 'w-full px-4 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-bolt'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', pin: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const res = await axios.post(`/api/auth/${mode}`, mode === 'login' ? { phone: form.phone, password: form.password } : form)
      onLogin(res.data); navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || (err.request ? 'Could not reach the server. Check your connection.' : 'Something went wrong'))
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-bolt flex flex-col">
      <div className="flex flex-col items-center pt-8 pb-3 text-white">
        <Mascot kind="bike" size={200} ride />
        <h1 className="text-3xl font-extrabold mt-1">H-Fleet</h1>
      </div>
      <div className="bg-white rounded-t-3xl px-6 pt-7 pb-8 flex-1">
        <h2 className="text-xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="text-gray-500 text-sm mb-4">{mode === 'login' ? 'Log in with your H-Pesa account' : 'One account for H-Pesa, H-Fleet and H-Homes'}</p>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-3 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && <input className={field} placeholder="Full name" value={form.name} onChange={set('name')} required />}
          <input className={field} type="tel" placeholder="Phone number (07XX XXX XXX)" value={form.phone} onChange={set('phone')} required />
          {mode === 'register' && <input className={field} type="email" placeholder="Email" value={form.email} onChange={set('email')} required />}
          <input className={field} type="password" placeholder={mode === 'login' ? 'Password' : 'Password (6+ characters)'} value={form.password} onChange={set('password')} minLength={mode === 'register' ? 6 : undefined} required />
          {mode === 'register' && <input className={field} type="password" inputMode="numeric" placeholder="4-digit PIN (used to pay for rides)" maxLength={4} pattern="\d{4}" value={form.pin} onChange={set('pin')} required />}
          <button disabled={busy} className="w-full bg-bolt disabled:opacity-60 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2">
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}{!busy && <Icon name="arrow" size={20} />}
          </button>
        </form>
        <p className="text-center mt-5 text-sm">
          {mode === 'login' ? 'New here? ' : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="text-bolt font-semibold">{mode === 'login' ? 'Create account' : 'Log in'}</button>
        </p>
      </div>
    </div>
  )
}
