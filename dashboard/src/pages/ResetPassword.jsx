import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Lock, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)      // gueltige Recovery-Session vorhanden
  const [checked, setChecked] = useState(false)  // Pruefung abgeschlossen
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) { setReady(true); setChecked(true) }
    })
    // Falls die URL beim Laden schon geparst wurde
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      setTimeout(() => setChecked(true), 800)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return }
    if (password !== password2) { setError('Passwörter stimmen nicht überein.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError('Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.')
    else setDone(true)
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/nautilus-logo-transparent.png" alt="Nautilus Facility Cleaning" className="auth-logo-img" />
          <div className="auth-eyebrow">Kundenportal</div>
          <div className="auth-sub">Neues Passwort vergeben</div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--green)', display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <CheckCircle2 size={42} strokeWidth={2} />
            </div>
            <div className="auth-title" style={{ fontSize: 18 }}>Passwort geändert</div>
            <p className="auth-sub" style={{ marginTop: 10, lineHeight: 1.6 }}>
              Ihr neues Passwort ist aktiv. Sie können sich jetzt anmelden.
            </p>
            <button onClick={() => navigate('/dashboard')} className="auth-btn">Zum Portal</button>
          </div>
        ) : (!ready && checked) ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--yellow)', display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <AlertTriangle size={40} strokeWidth={2} />
            </div>
            <div className="auth-title" style={{ fontSize: 18 }}>Link ungültig</div>
            <p className="auth-sub" style={{ marginTop: 10, lineHeight: 1.6 }}>
              Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie über „Passwort vergessen" einen neuen an.
            </p>
            <button onClick={() => navigate('/login')} className="auth-btn">Zur Anmeldung</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="auth-err">{error}</div>}
            <div>
              <label className="flabel">Neues Passwort</label>
              <div className="auth-field">
                <Lock size={17} className="ic" />
                <input type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen" className="auth-input" />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="flabel">Passwort bestätigen</label>
              <div className="auth-field">
                <Lock size={17} className="ic" />
                <input type="password" required value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  placeholder="Passwort wiederholen" className="auth-input" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? 'Wird gespeichert …' : 'Passwort speichern'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
