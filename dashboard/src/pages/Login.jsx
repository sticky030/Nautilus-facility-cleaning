import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock } from 'lucide-react'

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
          <img src="/nautilus-logo-transparent.png" alt="Nautilus Facility Cleaning" className="auth-logo-img" />
          <div className="auth-eyebrow">Kundenportal</div>
        </div>

        <form onSubmit={handleLogin}>
          {error && <div className="auth-err">{error}</div>}

          <div>
            <label className="flabel">E-Mail</label>
            <div className="auth-field">
              <Mail size={17} className="ic" />
              <input type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ihre@email.de" className="auth-input" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label className="flabel">Passwort</label>
            <div className="auth-field">
              <Lock size={17} className="ic" />
              <input type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="auth-input" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Anmelden …' : 'Anmelden'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <a href="/passwort-vergessen" style={{ color: 'var(--c)', fontSize: 12.5, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
            Passwort vergessen?
          </a>
        </div>

        <div className="auth-foot">
          Bei Problemen: <a href="mailto:kontakt@nautilus-facility.de" style={{ color: 'var(--tx)' }}>kontakt@nautilus-facility.de</a>
        </div>
      </div>
    </div>
  )
}
