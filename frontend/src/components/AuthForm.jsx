import React, { useState } from 'react'

export default function AuthForm({ mode = 'login', onSubmit, switchMode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(email, password)
    } catch (err) {
      setError('Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">{mode === 'login' ? 'Log in' : 'Sign up'}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border rounded-md px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded-md px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full py-2 rounded-md bg-blue-600 text-white disabled:opacity-50" disabled={loading}>
          {loading ? 'Please wait...' : (mode === 'login' ? 'Log in' : 'Create account')}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
      <div className="mt-3 text-sm">
        {mode === 'login' ? (
          <button className="text-blue-600" onClick={switchMode}>Need an account? Sign up</button>
        ) : (
          <button className="text-blue-600" onClick={switchMode}>Already have an account? Log in</button>
        )}
      </div>
    </div>
  )
}


