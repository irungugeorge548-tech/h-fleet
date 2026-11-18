import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Home from './pages/Home'
import Ride from './pages/Ride'
import Activity from './pages/Activity'
import Account from './pages/Account'
import Wallet from './pages/Wallet'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hfleet_token'))
  const [showSplash, setShowSplash] = useState(true)
  const login = (data) => {
    localStorage.setItem('hfleet_token', data.token)
    localStorage.setItem('hfleet_user', JSON.stringify(data.user))
    setToken(data.token)
  }
  const logout = () => { localStorage.clear(); setToken(null) }

  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login onLogin={login} /> : <Navigate to="/" />} />
      <Route path="/" element={token ? <Home logout={logout} /> : <Navigate to="/login" />} />
      <Route path="/ride" element={token ? <Ride /> : <Navigate to="/login" />} />
      <Route path="/activity" element={token ? <Activity /> : <Navigate to="/login" />} />
      <Route path="/wallet" element={token ? <Wallet /> : <Navigate to="/login" />} />
      <Route path="/account"element={token ? <Account logout={logout} /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
