import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Home from './pages/Home'
import Ride from './pages/Ride'
import Activity from './pages/Activity'
import Account from './pages/Account'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import Safety from './pages/Safety'
import Support from './pages/Support'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hfleet_token'))
  // the splash plays when the app is opened, not on every page change or refresh
  const [showSplash, setShowSplash] = useState(() => { try { return !sessionStorage.getItem('hfleet_splash') } catch { return true } })
  const login = (data) => {
    localStorage.setItem('hfleet_token', data.token)
    localStorage.setItem('hfleet_user', JSON.stringify(data.user))
    setToken(data.token)
  }
  const logout = () => { localStorage.removeItem('hfleet_token'); localStorage.removeItem('hfleet_user'); setToken(null) }

  if (showSplash) return <Splash onDone={() => { try { sessionStorage.setItem('hfleet_splash', '1') } catch { /* ignore */ } setShowSplash(false) }} />

  const guard = (el) => (token ? el : <Navigate to="/login" />)
  return (
    <Routes>
      <Route path="/login" element={!token ? <Login onLogin={login} /> : <Navigate to="/" />} />
      <Route path="/" element={guard(<Home logout={logout} />)} />
      <Route path="/ride" element={guard(<Ride />)} />
      <Route path="/activity" element={guard(<Activity />)} />
      <Route path="/wallet" element={guard(<Wallet />)} />
      <Route path="/notifications" element={guard(<Notifications />)} />
      <Route path="/account" element={guard(<Account logout={logout} />)} />
      <Route path="/account/profile" element={guard(<Profile />)} />
      <Route path="/account/safety" element={guard(<Safety />)} />
      <Route path="/account/support" element={guard(<Support />)} />
      <Route path="/account/settings" element={guard(<Settings />)} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
