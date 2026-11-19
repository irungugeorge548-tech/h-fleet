import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { searchPlaces, loadSaved, loadRecent } from '../lib/places'

const kindIcon = { business: 'work', building: 'home', place: 'pin' }

// Full-screen place chooser used for pickup, destination and saving Home/Work.
export default function PlaceSearch({ title, placeholder, bias, allowCurrent, onCurrent, onMap, onPick, onClose, showSaved = true }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [state, setState] = useState('idle') // idle | loading | error
  const input = useRef(null)
  const saved = loadSaved()
  const recent = loadRecent()

  useEffect(() => { input.current?.focus() }, [])

  useEffect(() => {
    const text = q.trim()
    if (text.length < 2) { setResults(null); setState('idle'); return }
    setState('loading')
    const ctl = new AbortController()
    const t = setTimeout(async () => {
      try { setResults(await searchPlaces(text, bias, ctl.signal)); setState('idle') }
      catch (e) { if (e.name !== 'AbortError') { setResults([]); setState('error') } }
    }, 350)
    return () => { clearTimeout(t); ctl.abort() }
  }, [q])

  const Row = ({ icon, title, sub, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-5 py-3 text-left active:bg-gray-50">
      <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0"><Icon name={icon} size={20} /></span>
      <span className="min-w-0"><span className="block font-medium truncate">{title}</span>{sub && <span className="block text-xs text-gray-500 truncate">{sub}</span>}</span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-[3000] bg-white flex flex-col">
      <div className="flex items-center gap-2 px-3 py-3 border-b">
        <button onClick={onClose} aria-label="Back" className="w-10 h-10 flex items-center justify-center"><Icon name="back" /></button>
        <div className="flex-1 flex items-center border rounded-2xl px-3 bg-gray-50">
          <Icon name="search" size={18} className="text-gray-400" />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} className="flex-1 bg-transparent outline-none px-2 py-3 min-w-0" />
          {q && <button onClick={() => setQ('')} aria-label="Clear"><Icon name="close" size={18} className="text-gray-400" /></button>}
        </div>
      </div>
      <p className="px-5 pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>

      <div className="flex-1 overflow-y-auto pb-6">
        {results === null && (<>
          {allowCurrent && <Row icon="locate" title="Use my current location" onClick={onCurrent} />}
          <Row icon="map" title="Choose on map" sub="Move the map and drop a pin" onClick={onMap} />
          {showSaved && saved.home && <Row icon="home" title="Home" sub={saved.home.name} onClick={() => onPick(saved.home)} />}
          {showSaved && saved.work && <Row icon="work" title="Work" sub={saved.work.name} onClick={() => onPick(saved.work)} />}
          {recent.length > 0 && <p className="px-5 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent</p>}
          {recent.map(p => <Row key={p.lat + ',' + p.lng} icon="clock" title={p.name} sub={p.sub} onClick={() => onPick(p)} />)}
          {recent.length === 0 && <p className="px-5 pt-6 text-sm text-gray-500">Type a place, estate, building or business name.</p>}
        </>)}
        {results !== null && (<>
          {state === 'loading' && <p className="px-5 py-4 text-sm text-gray-500">Searching…</p>}
          {state === 'error' && <p className="px-5 py-4 text-sm text-red-600">Search is not available right now. You can still choose on the map.</p>}
          {state === 'idle' && results.length === 0 && <p className="px-5 py-4 text-sm text-gray-500">No match found. Try a nearby landmark, or choose on the map.</p>}
          {results.map((p, i) => <Row key={i} icon={kindIcon[p.kind] || 'pin'} title={p.name} sub={p.sub} onClick={() => onPick(p)} />)}
          <Row icon="map" title="Choose on map" onClick={onMap} />
        </>)}
      </div>
    </div>
  )
}
