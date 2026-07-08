import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

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

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/nautilus-logo-transparent.png" alt="Nautilus Facility Cleaning" className="auth-logo-img" />
          <div className="auth-eyebrow">Kundenportal</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--green)', display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <CheckCircle2 size={42} strokeWidth={2} />
            </div>
            <div className="auth-title" style={{ fontSize: 18 }}>Prüfen Sie Ihr Postfach</div>
            <p className="auth-sub" style={{ marginTop: 10, lineHeight: 1.6 }}>
              Falls ein Konto mit <strong style={{ color: 'var(--c)' }}>{email}</strong> existiert, haben wir einen Link zum Zurücksetzen des Passworts geschickt.
            </p>
            <Link to="/login" className="auth-btn" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
              Zurück zur Anmeldung
            </Link>
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
              <Link to="/login" style={{ color: 'var(--tx)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Zurück zur Anmeldung
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
