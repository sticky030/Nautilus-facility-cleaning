import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('E-Mail oder Passwort nicht korrekt.')
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">N</div>
          <div className="auth-title">Nautilus Portal</div>
          <div className="auth-sub">Kundenzugang zu Ihren Objekten</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div className="auth-err">{error}</div>}

          <div>
            <label className="flabel">E-Mail</label>
            <input type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ihre@email.de" className="field" />
          </div>

          <div>
            <label className="flabel">Passwort</label>
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className="field" />
          </div>

          <button type="submit" disabled={loading} className="btn-c" style={{ width: '100%', marginTop: '4px' }}>
            {loading ? 'Anmelden …' : 'Anmelden'}
          </button>
        </form>

        <div className="auth-foot">
          Noch kein Zugang? <Link to="/signup" style={{ color: 'var(--c)' }}>Konto einrichten</Link>
          <div style={{ marginTop: '8px' }}>
            Bei Problemen: <a href="mailto:kontakt@nautilus-facility.de" style={{ color: 'var(--tx)' }}>kontakt@nautilus-facility.de</a>
          </div>
        </div>
      </div>
    </div>
  )
}
