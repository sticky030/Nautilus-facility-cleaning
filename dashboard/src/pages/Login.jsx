import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const [view, setView] = useState('login') // 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('E-Mail oder Passwort nicht korrekt.')
    setLoading(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // Aus Sicherheitsgruenden immer Erfolg zeigen (keine Auskunft, ob E-Mail existiert)
    if (error && !/rate|limit/i.test(error.message)) setError('Es gab ein Problem. Bitte später erneut versuchen.')
    else setSent(true)
    setLoading(false)
  }

  function backToLogin() {
    setView('login'); setSent(false); setError(''); setPassword('')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/nautilus-logo-transparent.png" alt="Nautilus Facility Cleaning" className="auth-logo-img" />
          <div className="auth-eyebrow">Kundenportal</div>
          <div className="auth-sub">
            {view === 'login' ? 'Zugang zu Ihren Objekten und Protokollen' : 'Passwort zurücksetzen'}
          </div>
        </div>

        {view === 'login' && (
          <>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="flabel" style={{ marginBottom: 0 }}>Passwort</label>
                  <button type="button" onClick={() => { setView('forgot'); setError('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--c)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                    Passwort vergessen?
                  </button>
                </div>
                <div className="auth-field" style={{ marginTop: 7 }}>
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

            <div className="auth-foot">
              Bei Problemen: <a href="mailto:kontakt@nautilus-facility.de" style={{ color: 'var(--tx)' }}>kontakt@nautilus-facility.de</a>
            </div>
          </>
        )}

        {view === 'forgot' && (
          sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--green)', display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <CheckCircle2 size={42} strokeWidth={2} />
              </div>
              <div className="auth-title" style={{ fontSize: 18 }}>Prüfen Sie Ihr Postfach</div>
              <p className="auth-sub" style={{ marginTop: 10, lineHeight: 1.6 }}>
                Falls ein Konto mit <strong style={{ color: 'var(--c)' }}>{email}</strong> existiert, haben wir einen Link zum Zurücksetzen des Passworts geschickt.
              </p>
              <button onClick={backToLogin} className="auth-btn">Zurück zur Anmeldung</button>
            </div>
          ) : (
            <>
              <form onSubmit={handleReset}>
                {error && <div className="auth-err">{error}</div>}
                <p className="auth-sub" style={{ marginTop: 0, marginBottom: 18, textAlign: 'center' }}>
                  Geben Sie Ihre E-Mail ein. Wir senden Ihnen einen Link, um ein neues Passwort zu vergeben.
                </p>
                <div>
                  <label className="flabel">E-Mail</label>
                  <div className="auth-field">
                    <Mail size={17} className="ic" />
                    <input type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ihre@email.de" className="auth-input" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="auth-btn">
                  {loading ? 'Wird gesendet …' : 'Link zum Zurücksetzen senden'}
                </button>
              </form>

              <div className="auth-foot">
                <button type="button" onClick={backToLogin}
                  style={{ background: 'none', border: 'none', color: 'var(--tx)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={14} /> Zurück zur Anmeldung
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}
