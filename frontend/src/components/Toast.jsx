import React, { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  if (!message) return null
  const color = type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white shadow ${color}`}>
      <div className="flex items-center gap-3">
        <span className="text-sm">{message}</span>
        <button className="text-white/80 text-xs" onClick={onClose}>✕</button>
      </div>
    </div>
  )
}


