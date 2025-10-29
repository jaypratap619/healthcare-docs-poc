import React, { useState } from 'react'

export default function UploadForm({ onUpload }) {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

  const onChange = (e) => {
        const f = e.target.files?.[0]
        setError('')
        if (!f) return setFile(null)
        if (f.type !== 'application/pdf') {
            setError('Only PDF files are allowed')
            return setFile(null)
        }
        if (f.size > 10 * 1024 * 1024) {
            setError('File too large (max 10MB)')
            return setFile(null)
        }
        setFile(f)
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!file) return
        setUploading(true)
        setError('')
        try {
            await onUpload(file)
            setFile(null)
            e.target.reset()
        } catch (err) {
            const msg = (err && err.message) || 'Upload failed'
            setError(msg === 'Document with this filename already exists' ? 'Already uploaded' : msg)
        } finally {
            setUploading(false)
        }
    }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap md:flex-nowrap items-center gap-3">
      <input data-testid="file-input" aria-label="Choose PDF" className="flex-1 min-w-0 text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer" type="file" accept="application/pdf" onChange={onChange} />
      <button className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 transition text-white disabled:opacity-50" type="submit" disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload PDF'}
      </button>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </form>
  )
}


