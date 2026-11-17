import { useEffect, useState } from 'react'

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="h-screen bg-bolt flex items-center justify-center">
      <h1 className="text-6xl font-bold text-white">H-Fleet</h1>
    </div>
  )
}
