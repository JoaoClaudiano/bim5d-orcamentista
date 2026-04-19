// src/components/UploadZone.jsx
import { useState, useRef } from 'react'

export default function UploadZone({ onFile, loading }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onClick={() => !loading && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={`
        relative cursor-pointer rounded-2xl p-10 text-center transition-all duration-300
        border-2 border-dashed
        ${drag
          ? 'border-brand-400 bg-brand-950/50 scale-[1.01]'
          : 'border-white/10 hover:border-brand-500/50 hover:bg-white/[0.02]'}
        ${loading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      {/* Icon */}
      <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-brand-900/50 border border-brand-700/40 flex items-center justify-center">
        {loading ? (
          <svg className="w-7 h-7 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        ) : (
          <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
        )}
      </div>

      <p className="text-white/80 font-medium text-base mb-1">
        {loading ? 'Processando schedule…' : 'Upload do Schedule do Revit'}
      </p>
      <p className="text-white/40 text-sm">
        {loading ? 'Aguarde, mapeando composições SINAPI…' : 'CSV ou Excel (.xlsx) — arraste ou clique'}
      </p>

      <div className="mt-5 flex justify-center gap-2 flex-wrap">
        {['.csv (Revit Schedule)', '.xlsx (Revit Schedule)'].map(ext => (
          <span key={ext} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
            {ext}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
