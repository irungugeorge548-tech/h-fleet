import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState('0712345678')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post('/api/auth/login', { phone, password })
      onLogin(res.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed')
    }
  }

  return (
    <div className="min-h-screen bg-bolt flex items-center justify-center p-4">
      <form onSubmit={handle} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-4xl font-bold text-center text-bolt">H-Fleet</h1>
        <p className="text-center text-gray-500 text-sm">Ride like Bolt</p>
        {error && <div className="bg-red-100 text-red-600 p-2 rounded text-sm">{error}</div>}
        <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 border rounded-2xl" placeholder="Phone" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-2xl" placeholder="Password" />
        <button className="w-full bg-bolt text-white py-3 rounded-2xl font-semibold text-lg">Continue</button>
      </form>
    </div>
  )
}
