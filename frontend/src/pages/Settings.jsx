import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubScreen from '../components/SubScreen'
import Icon from '../components/Icon'
import { loadSaved, clearSaved, clearRecent } from '../lib/places'
import { HPESA_URL } from '../lib/api'

export default function Settings() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(loadSaved)
  const [note, setNote] = useState('')
  const [installEvt, setInstallEvt] = useState(null)
  const installed = window.matchMedia?.('(display-mode: standalone)').matches

  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const Row = ({ icon, title, sub, onClick, href }) => {
    const inner = (<>
      <span className="w-10 h-10 rounded-full bg-bolt/10 text-bolt flex items-center justify-center flex-shrink-0"><Icon name={icon} size={20} /></span>
      <span className="flex-1 min-w-0 text-left"><span className="block font-medium">{title}</span>{sub && <span className="block text-xs text-gray-500 truncate">{sub}</span>}</span>
    </>)
    return href
      ? <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4">{inner}</a>
      : <button onClick={onClick} className="w-full flex items-center gap-3 p-4">{inner}</button>
  }

  return (
    <SubScreen title="Settings">
      {note && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-3">{note}</div>}
      <h2 className="font-bold mb-2">Saved places</h2>
      <div className="bg-white rounded-2xl border divide-y mb-5">
        <Row icon="home" title="Home" sub={saved.home ? saved.home.name : 'Not set. Set it from the Home screen, under More.'} onClick={() => navigate('/')} />
        {saved.home && <Row icon="trash" title="Remove Home" onClick={() => { clearSaved('home'); setSaved(loadSaved()); setNote('Home address removed') }} />}
        <Row icon="work" title="Work" sub={saved.work ? saved.work.name : 'Not set. Set it from the Home screen, under More.'} onClick={() => navigate('/')} />
        {saved.work && <Row icon="trash" title="Remove Work" onClick={() => { clearSaved('work'); setSaved(loadSaved()); setNote('Work address removed') }} />}
        <Row icon="clock" title="Clear recent places" onClick={() => { clearRecent(); setNote('Recent places cleared') }} />
      </div>

      <h2 className="font-bold mb-2">App</h2>
      <div className="bg-white rounded-2xl border divide-y mb-5">
        {!installed && installEvt && <Row icon="download" title="Install H-Fleet" sub="Add it to your home screen" onClick={async () => { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null) }} />}
        {!installed && !installEvt && <Row icon="download" title="Install H-Fleet" sub="Open your browser menu and choose Install app" onClick={() => setNote('In Chrome: open the menu and tap Install app.')} />}
        {installed && <Row icon="check" title="Installed" sub="H-Fleet is on your home screen" onClick={() => {}} />}
        {HPESA_URL && <Row icon="wallet" title="Open H-Pesa" sub="Top up and manage your wallet" href={HPESA_URL} />}
        <Row icon="shield" title="Safety settings" sub="Emergency contacts" onClick={() => navigate('/account/safety')} />
      </div>
      <p className="text-center text-xs text-gray-400">H-Fleet · Ride across Kenya</p>
    </SubScreen>
  )
}
