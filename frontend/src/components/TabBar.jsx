import { NavLink } from 'react-router-dom'

const icons = {
  home: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z" />
      <circle cx="12" cy="9.500" r="2.500" />
    </>
  ),
  activity: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13v4" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <circle cx="16.500" cy="13.500" r="1.200" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.400 3.600-7 8-7s8 2.600 8 7" />
    </>
  ),
}

const tabs = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/activity', label: 'Activity', icon: 'activity' },
  { to: '/wallet', label: 'Wallet', icon: 'wallet' },
  { to: '/account', label: 'Account', icon: 'account' },
]

export default function TabBar() {
  return (
    <nav className="bg-white border-t flex justify-around pt-2 pb-3 z-[1200] relative">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.end}
          className={({ isActive }) => `flex flex-col items-center gap-0.5 text-xs w-20 ${isActive ? 'text-bolt font-semibold' : 'text-gray-500'}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {icons[t.icon]}
          </svg>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
