import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle2, Mail, Lock } from 'lucide-react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== password2) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return }
    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) setError(signUpError.message)
    else setDone(true)
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/nautilus-logo-transparent.png" alt="Nautilus Facility Cleaning" className="auth-logo-img" />
          <div className="auth-eyebrow">Kundenportal</div>
          <div className="auth-sub">Kundenkonto einrichten</div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--green)', display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <CheckCircle2 size={44} strokeWidth={2} />
            </div>
            <div className="auth-title" style={{ fontSize: 18 }}>Fast geschafft</div>
            <p className="auth-sub" style={{ marginTop: 10, lineHeight: 1.6 }}>
              Wir haben eine Bestätigungsmail an <strong style={{ color: 'var(--c)' }}>{email}</strong> geschickt.
              Bitte bestätigen Sie Ihre Adresse, danach können Sie sich anmelden.
            </p>
            <button onClick={() => navigate('/login')} className="auth-btn">
              Zur Anmeldung
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
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
                {loading ? 'Registrieren …' : 'Konto erstellen'}
              </button>
            </form>

            <div className="auth-foot">
              Registrieren Sie sich mit der E-Mail, die Nautilus für Sie hinterlegt hat.
              <div style={{ marginTop: 8 }}>
                Bereits registriert? <Link to="/login" style={{ color: 'var(--c)' }}>Zur Anmeldung</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
