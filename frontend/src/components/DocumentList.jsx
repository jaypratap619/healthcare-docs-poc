import React from 'react'
import { downloadUrl } from '../api'

export default function DocumentList({ items, onDelete, onDownload }) {
  if (!items.length) return <p className="text-gray-600">No documents uploaded yet.</p>
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Filename</th>
            <th className="px-4 py-2 text-center font-semibold">Size</th>
            <th className="px-4 py-2 text-center font-semibold">Uploaded</th>
            <th className="px-4 py-2 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d, idx) => (
            <tr key={d.id} className={idx % 2 ? 'bg-gray-50' : ''}>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-sky-100 text-sky-700 text-xs">PDF</span>
                  <span title={d.filename} className="truncate max-w-[360px]">{d.filename}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-center">{Math.round(d.size_bytes / 1024)} KB</td>
              <td className="px-4 py-2 text-center">{new Date(d.created_at).toLocaleString()}</td>
              <td className="px-4 py-2 text-center space-x-2">
                <button className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => onDownload(d)}>⬇ Download</button>
                <button className="inline-flex items-center px-3 py-1.5 rounded-md text-white bg-rose-600 hover:bg-rose-700" onClick={() => onDelete(d.id)}>🗑 Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


