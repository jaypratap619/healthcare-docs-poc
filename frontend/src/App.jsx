import React, { useEffect, useState } from 'react'
import { listDocuments, uploadDocument, deleteDocument, login, signup, setToken, clearToken, downloadDocumentFile } from './api'
import UploadForm from './components/UploadForm'
import DocumentList from './components/DocumentList'
import AuthForm from './components/AuthForm'
import Toast from './components/Toast'

export default function App() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [authed, setAuthed] = useState(!!localStorage.getItem('token'))
    const [toast, setToast] = useState({ message: '', type: 'success' })
    const [authMode, setAuthMode] = useState('login')

    const refresh = async () => {
        setLoading(true)
        try {
            const data = await listDocuments()
            setItems(data)
        } catch (e) {
            setMessage('Failed to load documents')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (authed) refresh()
    }, [authed])

    const handleUpload = async (file) => {
        await uploadDocument(file)
        setMessage('Upload successful')
        setToast({ message: 'Upload successful', type: 'success' })
        await refresh()
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this document?')) return
        try {
            await deleteDocument(id)
            setMessage('Deleted successfully')
            setToast({ message: 'Deleted successfully', type: 'success' })
            await refresh()
        } catch (e) {
            setMessage('Delete failed')
            setToast({ message: 'Delete failed', type: 'error' })
        }
    }

    const handleDownload = async (doc) => {
        try {
            const { blob, filename } = await downloadDocumentFile(doc.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (e) {
            setToast({ message: 'Download failed or unauthorized', type: 'error' })
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
            <nav className="bg-white/80 backdrop-blur border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-sky-800">Healthcare Document Manager</h1>
                    {authed ? (
                        <button className="text-sm text-gray-700 hover:text-gray-900" onClick={() => { clearToken(); setAuthed(false); setItems([]) }}>Log out</button>
                    ) : null}
                </div>
            </nav>
            <main className="max-w-6xl mx-auto p-6">
            {!authed ? (
                <AuthForm
                    mode={authMode}
                    switchMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    onSubmit={async (email, password) => {
                        if (authMode === 'signup') {
                            await signup(email, password)
                            setToast({ message: 'Account created. Please log in.', type: 'success' })
                        }
                        const r = await login(email, password)
                        setToken(r.token)
                        setAuthed(true)
                        setToast({ message: 'Logged in successfully', type: 'success' })
                    }}
                />
            ) : (
                <>
                    <section className="mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
                            <h3 className="text-lg font-semibold mb-2">Upload a PDF</h3>
                            <p className="text-sm text-gray-600 mb-3">Max size 10 MB.</p>
                            <UploadForm onUpload={handleUpload} />
                        </div>
                    </section>
                    <section>
                        <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold">Your Documents</h3>
                                {!loading && <span className="text-sm text-gray-600">{items.length} total</span>}
                            </div>
                            {loading ? <p className="text-gray-600">Loading...</p> : <DocumentList items={items} onDelete={handleDelete} onDownload={handleDownload} />}
                        </div>
                    </section>
                </>
            )}
            </main>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
        </div>
    )
}


