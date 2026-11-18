import { useEffect } from 'react'

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="h-screen bg-bolt flex flex-col items-center justify-center">
      <h1 className="text-6xl font-extrabold text-white tracking-tight">H-Fleet</h1>
      <p className="text-white/80 mt-3 text-sm">Ride across Kenya</p>
    </div>
  )
}
