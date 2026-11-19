import { Link } from 'react-router-dom'
import Icon from './Icon'
import Mascot from './Mascot'
import { getUser } from '../lib/api'

const links = [
  { to: '/', label: 'Home', icon: 'pin' },
  { to: '/activity', label: 'Your rides', icon: 'clock' },
  { to: '/wallet', label: 'Wallet', icon: 'wallet' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/account/safety', label: 'Safety', icon: 'shield' },
  { to: '/account/support', label: 'Support', icon: 'chat' },
  { to: '/account/settings', label: 'Settings', icon: 'gear' },
]

export default function Drawer({ open, onClose, logout }) {
  const user = getUser()
  return (
    <div className={`fixed inset-0 z-[2500] ${open ? '' : 'pointer-events-none'}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside className={`absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/account/profile" onClick={onClose} className="bg-bolt text-white px-5 pt-10 pb-4 flex items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">{(user.name || '?')[0]}</span>
          <span className="min-w-0"><span className="block font-bold truncate">{user.name || 'Rider'}</span><span className="block text-sm text-white/80">{user.phone}</span></span>
        </Link>
        <nav className="flex-1 overflow-y-auto py-2">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={onClose} className="flex items-center gap-4 px-5 py-3.5 active:bg-gray-50">
              <Icon name={l.icon} size={22} className="text-gray-600" /><span className="font-medium">{l.label}</span>
            </Link>))}
        </nav>
        <div className="px-4 pb-2 opacity-90"><Mascot size={150} /></div>
        <button onClick={logout} className="m-4 mt-0 border border-red-200 text-red-600 py-3 rounded-2xl font-semibold">Log out</button>
      </aside>
    </div>
  )
}
