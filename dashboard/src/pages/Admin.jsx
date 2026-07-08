import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateSchadenPDF } from '../lib/generatePDF'
import { sendEmail } from '../lib/sendEmail'
import Sidebar from '../components/Sidebar'
import ProtocolForm from '../components/ProtocolForm'
import { FileText, AlertTriangle, Building2, Users, Check } from 'lucide-react'

export default function Admin({ session }) {
  const [activeSection, setActiveSection] = useState('protokoll')
  const [kunden, setKunden] = useState([])
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Hinweis form
  const [selectedHV, setSelectedHV] = useState('')
  const [selectedObjekt, setSelectedObjekt] = useState('')
  const [objekte, setObjekte] = useState([])
  const [schadenTitel, setSchadenTitel] = useState('')
  const [schadenBeschreibung, setSchadenBeschreibung] = useState('')
  const [schadenFotos, setSchadenFotos] = useState([])

  // Kunde form
  const [hvName, setHvName] = useState('')
  const [hvEmail, setHvEmail] = useState('')
  const [hvRegistrierLink, setHvRegistrierLink] = useState('')

  // Objekt form
  const [objektName, setObjektName] = useState('')
  const [objektAdresse, setObjektAdresse] = useState('')
  const [objektGroesse, setObjektGroesse] = useState('')
  const [objektTurnus, setObjektTurnus] = useState('')

  useEffect(() => {
    supabase.from('hausverwaltungen').select('id, name').then(({ data }) => setKunden(data || []))
  }, [])

  useEffect(() => {
    if (!selectedHV) { setObjekte([]); setSelectedObjekt(''); return }
    supabase.from('objekte').select('id, name').eq('hausverwaltung_id', selectedHV)
      .then(({ data }) => setObjekte(data || []))
  }, [selectedHV])

  function showSuccess(msg) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 4000)
  }

  async function handleSchadenseintrag(e) {
    e.preventDefault(); setLoading(true)
    try {
      const fotoUrls = []
      for (const foto of schadenFotos) {
        const path = `schaeden/${selectedObjekt}/${Date.now()}_${foto.name}`
        const { data: up } = await supabase.storage.from('fotos').upload(path, foto)
        if (up) fotoUrls.push(supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl)
      }

      const objekt = objekte.find(o => o.id === selectedObjekt)
      const hv = kunden.find(h => h.id === selectedHV)

      // Fortlaufende Hinweis-Nummer atomar aus der Datenbank
      const { data: nummer } = await supabase.rpc('next_beleg', { p_prefix: 'NFS' })

      const pdfBlob = await generateSchadenPDF({
        objekt, hausverwaltung: hv?.name, titel: schadenTitel,
        beschreibung: schadenBeschreibung, nummer,
        datum: new Date().toISOString().split('T')[0], fotoUrls,
      })
      const pdfPath = `schaeden/${selectedObjekt}/hinweis_${Date.now()}.pdf`
      await supabase.storage.from('fotos').upload(pdfPath, pdfBlob, { contentType: 'application/pdf' })

      await supabase.from('schadensmeldungen').insert({
        objekt_id: selectedObjekt, titel: schadenTitel,
        beschreibung: schadenBeschreibung, nummer,
        foto_url: fotoUrls[0] || null, foto_urls: fotoUrls, behoben: false
      })
      await supabase.from('objekte').update({ status: 'hinweis' }).eq('id', selectedObjekt)

      const { data: hvFull } = await supabase.from('hausverwaltungen').select('email').eq('id', selectedHV).single()
      if (hvFull?.email) {
        await sendEmail({
          to: hvFull.email,
          subject: `Neuer Hinweis, ${objekt?.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
              <div style="background:#06101f;padding:22px 30px">
                <p style="color:#06b6d4;font-size:11px;letter-spacing:2px;margin:0">NAUTILUS FACILITY CLEANING</p>
              </div>
              <div style="padding:30px;border:1px solid #e2e8f0;border-top:none">
                <h2 style="margin:0 0 14px;font-size:19px">Neuer Hinweis eingegangen</h2>
                <p style="color:#475569;margin:0 0 8px">Für Ihr Objekt <strong>${objekt?.name}</strong> wurde ein Hinweis erfasst.</p>
                <div style="background:#fff7ed;border-left:3px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:4px">
                  <p style="margin:0;font-weight:600;color:#b45309">${schadenTitel}</p>
                  ${schadenBeschreibung ? `<p style="margin:8px 0 0;color:#475569;font-size:14px">${schadenBeschreibung}</p>` : ''}
                </div>
                <a href="https://dashboard.nautilus-facility.de" style="background:#06b6d4;color:#04121f;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Im Portal ansehen</a>
                <p style="color:#94a3b8;font-size:12px;margin-top:30px">Nautilus Facility Cleaning · Berlin · kontakt@nautilus-facility.de</p>
              </div>
            </div>`
        })
      }

      setSchadenTitel(''); setSchadenBeschreibung(''); setSchadenFotos([])
      showSuccess('Hinweis und PDF gespeichert.')
    } catch (err) {
      showSuccess('Fehler: ' + err.message)
    }
    setLoading(false)
  }

  async function handleNeuerKunde(e) {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('hausverwaltungen').insert({ name: hvName, email: hvEmail })
    if (!error) {
      setHvRegistrierLink(`${window.location.origin}/signup`)
      showSuccess('Kunde angelegt. Registrierungslink kopieren.')
    } else {
      showSuccess('Fehler: ' + (error?.message || 'Unbekannt'))
    }
    setLoading(false)
  }

  async function handleNeuesObjekt(e) {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('objekte').insert({
      hausverwaltung_id: selectedHV, name: objektName, adresse: objektAdresse,
      groesse: objektGroesse || null, turnus: objektTurnus || null, status: 'ok'
    })
    if (error) {
      showSuccess('Fehler: ' + (error.message || 'Unbekannt'))
    } else {
      setObjektName(''); setObjektAdresse(''); setObjektGroesse(''); setObjektTurnus('')
      showSuccess('Objekt angelegt.')
    }
    setLoading(false)
  }

  const sections = [
    { id: 'protokoll', label: 'Protokoll erstellen', icon: <FileText size={15} /> },
    { id: 'schaden', label: 'Hinweis melden', icon: <AlertTriangle size={15} /> },
    { id: 'objekt', label: 'Neues Objekt', icon: <Building2 size={15} /> },
    { id: 'hv', label: 'Neuer Kunde', icon: <Users size={15} /> },
  ]

  return (
    <div className="app">
      <Sidebar session={session} view={null} onSelect={() => navigate('/dashboard')} />

      <main className="main" style={{ maxWidth: 900 }}>
        <div className="head" style={{ marginBottom: 22 }}>
          <div>
            <div className="head-tag">Verwaltung</div>
            <h1>Admin</h1>
          </div>
        </div>

        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 15px', marginBottom: 18,
            background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)',
            borderRadius: 10, color: 'var(--green)', fontSize: 13.5
          }}>
            <Check size={15} /> {success}
          </div>
        )}

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {sections.map(s => {
            const active = activeSection === s.id
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 10,
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  border: '1px solid', borderColor: active ? 'var(--c)' : 'var(--bd)',
                  background: active ? 'var(--cs)' : 'transparent',
                  color: active ? 'var(--c)' : 'var(--mt)', transition: 'all .15s'
                }}>
                {s.icon} {s.label}
              </button>
            )
          })}
        </div>

        <div className="panel" style={{ padding: 24 }}>
          {activeSection === 'protokoll' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Reinigungsprotokoll erstellen</h2>
              <ProtocolForm hausverwaltungen={kunden} onSuccess={() => showSuccess('Protokoll erstellt und PDF gespeichert.')} />
            </div>
          )}

          {activeSection === 'schaden' && (
            <form onSubmit={handleSchadenseintrag} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Hinweis erfassen</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div>
                  <label className="flabel">Kunde</label>
                  <select value={selectedHV} onChange={e => setSelectedHV(e.target.value)} required className="field">
                    <option value="">Wählen …</option>
                    {kunden.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flabel">Objekt</label>
                  <select value={selectedObjekt} onChange={e => setSelectedObjekt(e.target.value)} required disabled={!selectedHV} className="field">
                    <option value="">Wählen …</option>
                    {objekte.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="flabel">Titel</label>
                <input type="text" value={schadenTitel} onChange={e => setSchadenTitel(e.target.value)}
                  placeholder="z.B. Glühbirne defekt, Flur 2.OG" required className="field" />
              </div>
              <div>
                <label className="flabel">Beschreibung</label>
                <textarea value={schadenBeschreibung} onChange={e => setSchadenBeschreibung(e.target.value)}
                  rows={3} className="field" style={{ resize: 'none' }} />
              </div>
              <div>
                <label className="flabel">Fotos</label>
                <input type="file" accept="image/*" multiple onChange={e => setSchadenFotos(Array.from(e.target.files))}
                  style={{ fontSize: 13, color: 'var(--tx)' }} />
                {schadenFotos.length > 0 && <p style={{ fontSize: 12, color: 'var(--c)', marginTop: 4 }}>{schadenFotos.length} Foto{schadenFotos.length > 1 ? 's' : ''} ausgewählt</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-c">{loading ? 'Speichern …' : 'Hinweis melden'}</button>
            </form>
          )}

          {activeSection === 'objekt' && (
            <form onSubmit={handleNeuesObjekt} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Neues Objekt anlegen</h2>
              <div>
                <label className="flabel">Kunde</label>
                <select value={selectedHV} onChange={e => setSelectedHV(e.target.value)} required className="field">
                  <option value="">Wählen …</option>
                  {kunden.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="flabel">Objektname</label>
                <input type="text" value={objektName} onChange={e => setObjektName(e.target.value)}
                  placeholder="z.B. Agentur Mitte" required className="field" />
              </div>
              <div>
                <label className="flabel">Adresse</label>
                <input type="text" value={objektAdresse} onChange={e => setObjektAdresse(e.target.value)}
                  placeholder="Straße, PLZ Berlin" required className="field" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div>
                  <label className="flabel">Größe (optional)</label>
                  <input type="text" value={objektGroesse} onChange={e => setObjektGroesse(e.target.value)}
                    placeholder="z.B. 320 m²" className="field" />
                </div>
                <div>
                  <label className="flabel">Turnus (optional)</label>
                  <input type="text" value={objektTurnus} onChange={e => setObjektTurnus(e.target.value)}
                    placeholder="z.B. Di + Fr" className="field" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-c">{loading ? 'Speichern …' : 'Objekt anlegen'}</button>
            </form>
          )}

          {activeSection === 'hv' && (
            <form onSubmit={handleNeuerKunde} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Neuen Kunden anlegen</h2>
              <p style={{ fontSize: 13, color: 'var(--tx)', background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '11px 14px', border: '1px solid var(--bd)' }}>
                Firmenname und E-Mail eintragen. Der Kunde registriert sich dann selbst über den Registrierungslink.
              </p>
              <div>
                <label className="flabel">Firmenname</label>
                <input type="text" value={hvName} onChange={e => setHvName(e.target.value)}
                  placeholder="Muster GmbH" required className="field" />
              </div>
              <div>
                <label className="flabel">E-Mail des Kunden</label>
                <input type="email" value={hvEmail} onChange={e => setHvEmail(e.target.value)}
                  placeholder="kunde@firma.de" required className="field" />
              </div>
              <button type="submit" disabled={loading} className="btn-c">{loading ? 'Speichern …' : 'Kunde anlegen'}</button>
              {hvRegistrierLink && (
                <div style={{ padding: 14, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 6, letterSpacing: '.08em', textTransform: 'uppercase' }}>Registrierungslink für den Kunden</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code style={{ fontSize: 12.5, background: 'rgba(0,0,0,.25)', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--bd)', flex: 1, wordBreak: 'break-all', color: 'var(--tx)' }}>{hvRegistrierLink}</code>
                    <button type="button" onClick={() => navigator.clipboard.writeText(hvRegistrierLink)} className="btn-c" style={{ padding: '7px 12px', fontSize: 12 }}>Kopieren</button>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--mt)', marginTop: 6 }}>
                    Der Kunde registriert sich mit <strong style={{ color: 'var(--tx)' }}>{hvEmail}</strong>, das System verknüpft ihn automatisch.
                  </p>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
