import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle2 } from 'lucide-react'

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
          <div className="auth-logo">N</div>
          <div className="auth-title">Nautilus Portal</div>
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
            <button onClick={() => navigate('/login')} className="btn-c" style={{ width: '100%', marginTop: 20 }}>
              Zur Anmeldung
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  placeholder="Mindestens 8 Zeichen" className="field" />
              </div>
              <div>
                <label className="flabel">Passwort bestätigen</label>
                <input type="password" required value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  placeholder="Passwort wiederholen" className="field" />
              </div>
              <button type="submit" disabled={loading} className="btn-c" style={{ width: '100%', marginTop: 4 }}>
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
