import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Home from './pages/Home'
import Ride from './pages/Ride'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hfleet_token'))
  const login = (data) => {
    localStorage.setItem('hfleet_token', data.token)
    localStorage.setItem('hfleet_user', JSON.stringify(data.user))
    setToken(data.token)
  }
  const logout = () => { localStorage.clear(); setToken(null) }

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login onLogin={login} /> : <Navigate to="/" />} />
      <Route path="/" element={token ? <Home logout={logout} /> : <Navigate to="/login" />} />
      <Route path="/ride" element={token ? <Ride /> : <Navigate to="/login" />} />
    </Routes>
  )
}
