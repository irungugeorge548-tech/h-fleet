import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MapView from '../components/MapView'
import PlaceSearch from '../components/PlaceSearch'
import Drawer from '../components/Drawer'
import Mascot from '../components/Mascot'
import TabBar from '../components/TabBar'
import Icon from '../components/Icon'
import { reverseGeocode, loadSaved, savePlaceAs, loadRecent, addRecent, clearRecent } from '../lib/places'

const NAIROBI = { lat: -1.286389, lng: 36.817223 }

function Shortcut({ icon, label, onClick, active }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1 text-sm">
      <span className={`w-12 h-12 rounded-full flex items-center justify-center ${active ? 'bg-bolt text-white' : 'bg-bolt/10 text-bolt'}`}><Icon name={icon} size={22} /></span>
      {label}
    </button>
  )
}

export default function Home({ logout }) {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [me, setMe] = useState(null)               // real GPS position, if allowed
  const [locNote, setLocNote] = useState('')
  const [pickup, setPickup] = useState(null)       // { name, sub, lat, lng, current }
  const [dest, setDest] = useState(null)
  const [search, setSearch] = useState(null)       // 'from' | 'to' | 'home' | 'work'
  const [pin, setPin] = useState(null)             // map pin mode: { target, lat, lng, name }
  const [panel, setPanel] = useState(null)         // 'saved' | 'more'
  const [drawer, setDrawer] = useState(false)
  const [saved, setSaved] = useState(loadSaved)
  const [recent, setRecent] = useState(loadRecent)

  const locate = (andFly = true) => {
    if (!navigator.geolocation) { setLocNote('This device cannot share its location. Choose a pickup on the map.'); return }
    navigator.geolocation.getCurrentPosition(p => {
      const c = { lat: p.coords.latitude, lng: p.coords.longitude }
      setMe(c); setLocNote('')
      setPickup(cur => (cur && !cur.current ? cur : { name: 'Current location', lat: c.lat, lng: c.lng, current: true }))
      if (andFly) mapRef.current?.flyTo(c.lat, c.lng, 15)
    }, () => setLocNote('Location is off. Turn it on, or choose your pickup yourself.'), { enableHighAccuracy: true, timeout: 10000 })
  }
  useEffect(() => { locate() }, [])

  // keep both ends of the trip in view
  useEffect(() => { if (pickup && dest) mapRef.current?.fit([pickup, dest], { top: 110, bottom: 380, left: 50, right: 50 }) }, [pickup?.lat, pickup?.lng, dest?.lat, dest?.lng])

  const choose = (place, target) => {
    const p = { name: place.name, sub: place.sub || '', lat: place.lat, lng: place.lng }
    if (target === 'from') setPickup({ ...p, current: false })
    else if (target === 'to') { setDest(p); addRecent(p); setRecent(loadRecent()) }
    else { savePlaceAs(target, p); setSaved(loadSaved()) }
    setSearch(null); setPin(null)
    if (target !== 'home' && target !== 'work') mapRef.current?.flyTo(p.lat, p.lng, 15)
  }

  const startPin = (target) => {
    setSearch(null)
    const c = mapRef.current?.center() || me || NAIROBI
    setPin({ target, lat: c.lat, lng: c.lng, name: 'Move the map to place the pin' })
    reverseGeocode(c.lat, c.lng).then(r => setPin(x => x && ({ ...x, name: r.name, sub: r.sub })))
  }
  const pinOn = useRef(false)
  pinOn.current = !!pin
  const onMoveEnd = (c) => {
    if (!pinOn.current) return
    setPin(cur => cur && ({ ...cur, lat: c.lat, lng: c.lng, name: 'Finding address…', sub: '' }))
    reverseGeocode(c.lat, c.lng).then(r => setPin(x => x && x.lat === c.lat ? { ...x, name: r.name, sub: r.sub } : x))
  }

  // tapping the map (or a named place on it) sets the destination
  const onTap = async (pt) => {
    if (pin || search) return
    const named = pt.name ? { name: pt.name, sub: '' } : await reverseGeocode(pt.lat, pt.lng)
    choose({ ...named, lat: pt.lat, lng: pt.lng }, 'to')
  }

  const useShortcut = (key) => {
    if (saved[key]) choose(saved[key], 'to')
    else setSearch(key)
  }

  const request = () => {
    if (!pickup) return alert('Choose where you want to be picked up.')
    if (!dest) return setSearch('to')
    navigate('/ride', { state: { pickup, dest } })
  }

  const markers = [
    ...(me ? [{ kind: 'me', lat: me.lat, lng: me.lng }] : []),
    ...(pickup && !pickup.current ? [{ kind: 'pickup', lat: pickup.lat, lng: pickup.lng }] : []),
    ...(dest ? [{ kind: 'dest', lat: dest.lat, lng: dest.lng }] : []),
  ]
  const bias = me || pickup || NAIROBI

  return (
    <div className="h-screen flex flex-col bg-white">
      <Drawer open={drawer} onClose={() => setDrawer(false)} logout={logout} />

      <header className="bg-white z-[1100] relative">
        <div className="flex items-center justify-between px-4 pt-3">
          <button onClick={() => setDrawer(true)} aria-label="Menu" className="w-9 h-9 flex items-center"><Icon name="menu" size={28} /></button>
          <span className="text-2xl font-extrabold tracking-tight flex items-center gap-1"><Icon name="bolt" size={22} fill className="text-bolt" />H-Fleet</span>
          <button onClick={() => navigate('/notifications')} aria-label="Notifications" className="w-9 h-9 flex items-center justify-end"><Icon name="bell" size={26} /></button>
        </div>
        {/* the H-Fleet car drives along the top of the screen */}
        <div className="relative h-14 overflow-hidden" style={{ background: "#32BB78" }}>
          <div className="absolute bottom-1 left-0 right-0 h-px bg-white/50" />
          <div className="absolute bottom-0" style={{ animation: 'cruise 18s linear infinite' }}><Mascot kind="car" size={84} ride /></div>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapView ref={mapRef} center={me || NAIROBI} zoom={14} markers={markers} onTap={onTap} onMoveEnd={onMoveEnd} />
        {!pin && (
          <button onClick={() => locate()} aria-label="Centre on my location" className="absolute right-4 bottom-12 z-[1000] w-11 h-11 rounded-full bg-white shadow flex items-center justify-center text-bolt"><Icon name="locate" size={22} /></button>)}
        {locNote && !pin && <div className="absolute top-3 left-3 right-3 z-[1000] bg-white shadow rounded-xl px-3 py-2 text-xs text-gray-700">{locNote}</div>}

        {pin && (<>
          <div className="absolute left-1/2 top-1/2 z-[1000] pointer-events-none" style={{ transform: 'translate(-50%,-100%)' }}>
            <svg width="38" height="50" viewBox="0 0 34 44"><path d="M17 43C17 43 3 28 3 17a14 14 0 0 1 28 0c0 11-14 26-14 26z" fill={pin.target === 'from' ? '#32BB78' : '#111'} stroke="#fff" strokeWidth="2.500" /><circle cx="17" cy="17" r="5.500" fill="#fff" /></svg>
          </div>
          <div className="absolute left-3 right-3 bottom-3 z-[1100] bg-white rounded-2xl shadow-xl p-4">
            <p className="text-xs text-gray-500">{pin.target === 'from' ? 'Pickup' : 'Destination'}</p>
            <p className="font-semibold truncate">{pin.name}</p>
            {pin.sub && <p className="text-xs text-gray-500 truncate">{pin.sub}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setPin(null)} className="flex-1 border rounded-xl py-3 font-medium">Cancel</button>
              <button onClick={() => choose({ name: pin.name, sub: pin.sub, lat: pin.lat, lng: pin.lng }, pin.target)} className="flex-1 bg-bolt text-white rounded-xl py-3 font-semibold">Confirm</button>
            </div>
          </div>
        </>)}
      </div>

      {!pin && (
        <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] px-5 pt-3 pb-4 -mt-8 relative z-[1100] max-h-[60vh] overflow-y-auto">
          <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
          <h2 className="text-2xl font-extrabold flex items-center gap-2">Ready, set, ride <Icon name="bolt" size={22} fill className="text-bolt" /></h2>
          <p className="text-gray-500 text-sm mt-0.5">Let's get you there.</p>

          <div className="flex gap-3 mt-3">
            <div className="flex flex-col items-center py-4 gap-1">
              <span className="w-3 h-3 rounded-full bg-bolt" />
              <span className="flex-1 w-px bg-gray-300" />
              <span className="w-3 h-3 bg-gray-900" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <button onClick={() => setSearch('from')} className="w-full text-left border rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="flex-1 min-w-0"><span className="block text-[11px] text-gray-500 leading-none">From</span><span className="block truncate font-medium">{pickup ? pickup.name : 'Choose pickup'}</span></span>
                <Icon name="chev" size={16} className="text-gray-400" />
              </button>
              <div className="flex items-center border rounded-2xl pr-3">
                <button onClick={() => setSearch('to')} className="flex-1 min-w-0 text-left px-4 py-3">
                  <span className="block text-[11px] text-gray-500 leading-none">To</span>
                  <span className={`block truncate text-lg ${dest ? 'font-medium' : 'text-gray-400'}`}>{dest ? dest.name : 'Where to?'}</span>
                </button>
                {dest && <button onClick={() => setDest(null)} aria-label="Clear destination" className="text-gray-400"><Icon name="close" size={20} /></button>}
              </div>
            </div>
          </div>

          <div className="flex items-start mt-4 divide-x">
            <Shortcut icon="star" label="Saved" active={panel === 'saved'} onClick={() => setPanel(panel === 'saved' ? null : 'saved')} />
            <Shortcut icon="home" label="Home" onClick={() => useShortcut('home')} />
            <Shortcut icon="work" label="Work" onClick={() => useShortcut('work')} />
            <Shortcut icon="more" label="More" active={panel === 'more'} onClick={() => setPanel(panel === 'more' ? null : 'more')} />
          </div>

          {panel === 'saved' && (
            <div className="mt-3 border rounded-2xl divide-y text-sm">
              {recent.length === 0 && <p className="p-3 text-gray-500">Places you search for will appear here.</p>}
              {recent.map(p => (
                <button key={p.lat + p.lng} onClick={() => { choose(p, 'to'); setPanel(null) }} className="w-full text-left p-3 flex items-center gap-3"><Icon name="clock" size={18} className="text-gray-500" /><span className="truncate">{p.name}</span></button>))}
            </div>)}
          {panel === 'more' && (
            <div className="mt-3 border rounded-2xl divide-y text-sm">
              <button onClick={() => { setSearch('home'); setPanel(null) }} className="w-full text-left p-3 flex items-center gap-3"><Icon name="home" size={18} />{saved.home ? 'Change Home address' : 'Set Home address'}</button>
              <button onClick={() => { setSearch('work'); setPanel(null) }} className="w-full text-left p-3 flex items-center gap-3"><Icon name="work" size={18} />{saved.work ? 'Change Work address' : 'Set Work address'}</button>
              <button onClick={() => { clearRecent(); setRecent([]); setPanel(null) }} className="w-full text-left p-3 flex items-center gap-3"><Icon name="trash" size={18} />Clear recent places</button>
            </div>)}

          <button onClick={request} className="w-full mt-4 bg-bolt text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-between px-6">
            <span className="flex-1 text-center">{dest ? 'Find a ride' : 'Where to?'}</span><Icon name="arrow" size={22} />
          </button>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1"><Icon name="shield" size={14} />Safety first. Always.</p>
        </div>)}

      {!pin && <TabBar />}

      {search && (
        <PlaceSearch
          title={{ from: 'Pickup location', to: 'Destination', home: 'Set Home address', work: 'Set Work address' }[search]}
          placeholder={search === 'from' ? 'Search pickup' : 'Search a place, building or business'}
          bias={bias}
          allowCurrent={search === 'from'}
          showSaved={search === 'to' || search === 'from'}
          onCurrent={() => { setSearch(null); setPickup(null); locate() }}
          onMap={() => startPin(search === 'from' ? 'from' : search === 'to' ? 'to' : search)}
          onPick={(p) => choose(p, search)}
          onClose={() => setSearch(null)}
        />)}
    </div>
  )
}
