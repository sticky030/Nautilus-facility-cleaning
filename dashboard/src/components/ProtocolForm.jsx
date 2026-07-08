import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SignaturePad from './SignaturePad'
import { generateProtocolPDF } from '../lib/generatePDF'
import { sendEmail } from '../lib/sendEmail'
import { Check } from 'lucide-react'

const BEREICHE = [
  { key: 'eingang',      label: 'Eingangsbereich / Haustür' },
  { key: 'treppenhaus',  label: 'Treppenhaus' },
  { key: 'aufzug',       label: 'Aufzug / Fahrstuhl' },
  { key: 'keller',       label: 'Keller / Kellergang' },
  { key: 'muellraum',    label: 'Müllraum' },
  { key: 'fahrradraum',  label: 'Fahrradraum' },
  { key: 'aussenanlage', label: 'Außenanlage / Gehweg' },
  { key: 'tiefgarage',   label: 'Tiefgarage / Stellplätze' },
  { key: 'waschraum',    label: 'Wasch- / Trockenraum' },
  { key: 'dachboden',    label: 'Dachboden / Gemeinschaftsraum' },
]

export default function ProtocolForm({ hausverwaltungen, onSuccess }) {
  const navigate = useNavigate()
  const [selectedHV, setSelectedHV] = useState('')
  const [selectedObjekt, setSelectedObjekt] = useState('')
  const [filteredObjekte, setFilteredObjekte] = useState([])
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0])
  const [zeitVon, setZeitVon] = useState('')
  const [zeitBis, setZeitBis] = useState('')
  const [mitarbeiter, setMitarbeiter] = useState('')
  const [bereiche, setBereiche] = useState(
    Object.fromEntries(BEREICHE.map(b => [b.key, { erledigt: false, notiz: '' }]))
  )
  const [gesamtNotizen, setGesamtNotizen] = useState('')
  const [maengel, setMaengel] = useState('')
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const sigRef = useRef(null)

  function handleHVChange(hvId) {
    setSelectedHV(hvId)
    setSelectedObjekt('')
    supabase.from('objekte').select('id, name, adresse')
      .eq('hausverwaltung_id', hvId)
      .then(({ data }) => setFilteredObjekte(data || []))
  }

  function toggleBereich(key) {
    setBereiche(prev => ({ ...prev, [key]: { ...prev[key], erledigt: !prev[key].erledigt } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedObjekt) return alert('Bitte ein Objekt auswählen.')
    if (sigRef.current?.isEmpty()) return alert('Bitte unterschreiben.')
    setLoading(true)

    try {
      const objekt = filteredObjekte.find(o => o.id === selectedObjekt)
      const signatureDataURL = sigRef.current.getDataURL()

      // Fortlaufende Protokoll-Nummer atomar aus der Datenbank
      const { data: nummer } = await supabase.rpc('next_beleg', { p_prefix: 'NFD' })

      const fotoUrls = []
      for (const foto of fotos) {
        const path = `protokolle/${selectedObjekt}/${Date.now()}_${foto.name}`
        const { data: up } = await supabase.storage.from('fotos').upload(path, foto)
        if (up) {
          const { data: url } = supabase.storage.from('fotos').getPublicUrl(path)
          fotoUrls.push(url.publicUrl)
        }
      }

      const pdfBlob = await generateProtocolPDF({
        objekt, datum, zeitVon, zeitBis, mitarbeiter,
        bereiche, gesamtNotizen, maengel, nummer, signatureDataURL, fotoUrls
      })

      const pdfPath = `protokolle/${selectedObjekt}/protokoll_${datum}_${Date.now()}.pdf`
      await supabase.storage.from('fotos').upload(pdfPath, pdfBlob, { contentType: 'application/pdf' })
      const { data: pdfUrl } = supabase.storage.from('fotos').getPublicUrl(pdfPath)

      await supabase.from('protokolle').insert({
        objekt_id: selectedObjekt, datum, mitarbeiter,
        notizen: gesamtNotizen, nummer, pdf_url: pdfUrl.publicUrl,
      })

      const hatMaengel = maengel.trim().length > 0
      await supabase.from('objekte').update({ status: hatMaengel ? 'hinweis' : 'ok' }).eq('id', selectedObjekt)

      const { data: hvFull } = await supabase.from('hausverwaltungen').select('email').eq('id', selectedHV).single()
      if (hvFull?.email) {
        await sendEmail({
          to: hvFull.email,
          subject: `Neues Reinigungsprotokoll, ${objekt.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
              <div style="background:#06101f;padding:22px 30px">
                <p style="color:#06b6d4;font-size:11px;letter-spacing:2px;margin:0">NAUTILUS FACILITY CLEANING</p>
              </div>
              <div style="padding:30px;border:1px solid #e2e8f0;border-top:none">
                <h2 style="margin:0 0 14px;font-size:19px">Neues Reinigungsprotokoll verfügbar</h2>
                <p style="color:#475569;margin:0 0 8px">Für Ihr Objekt <strong>${objekt.name}</strong> wurde ein neues Protokoll erstellt.</p>
                <p style="color:#475569;margin:0 0 22px">Datum: ${datum ? datum.split('-').reverse().join('.') : ''} | Mitarbeiter: ${mitarbeiter}</p>
                <a href="https://dashboard.nautilus-facility.de" style="background:#06b6d4;color:#04121f;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Im Portal ansehen</a>
                <p style="color:#94a3b8;font-size:12px;margin-top:30px">Nautilus Facility Cleaning · Berlin · kontakt@nautilus-facility.de</p>
              </div>
            </div>`
        })
      }
      onSuccess?.()
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      alert('Fehler beim Speichern: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div>
      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {['Grunddaten', 'Bereiche', 'Abschluss'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: step > i + 1 ? 'var(--c)' : step === i + 1 ? 'var(--c)' : 'var(--ink3)',
              color: step >= i + 1 ? '#04121f' : 'var(--mt)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, flexShrink: 0
            }}>{step > i + 1 ? <Check size={12} /> : i + 1}</div>
            <span style={{ fontSize: 12.5, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? 'var(--white)' : 'var(--mt)' }}>{s}</span>
            {i < 2 && <div style={{ width: 24, height: 1, background: 'var(--bd)' }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div>
                <label className="flabel">Kunde</label>
                <select value={selectedHV} onChange={e => handleHVChange(e.target.value)} required className="field">
                  <option value="">Wählen …</option>
                  {hausverwaltungen.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="flabel">Objekt</label>
                <select value={selectedObjekt} onChange={e => setSelectedObjekt(e.target.value)} required disabled={!selectedHV} className="field">
                  <option value="">Wählen …</option>
                  {filteredObjekte.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
              <div><label className="flabel">Datum</label><input type="date" value={datum} onChange={e => setDatum(e.target.value)} required className="field" /></div>
              <div><label className="flabel">Zeit von</label><input type="time" value={zeitVon} onChange={e => setZeitVon(e.target.value)} className="field" /></div>
              <div><label className="flabel">Zeit bis</label><input type="time" value={zeitBis} onChange={e => setZeitBis(e.target.value)} className="field" /></div>
            </div>
            <div>
              <label className="flabel">Mitarbeiter</label>
              <input type="text" value={mitarbeiter} onChange={e => setMitarbeiter(e.target.value)} placeholder="Name des Reinigungsmitarbeiters" required className="field" />
            </div>
            <button type="button" onClick={() => setStep(2)} className="btn-c" style={{ marginTop: 4 }}>Weiter zu Bereiche</button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {BEREICHE.map(b => {
                const on = bereiche[b.key].erledigt
                return (
                  <div key={b.key} style={{
                    padding: '11px 14px', borderRadius: 10,
                    border: `1px solid ${on ? 'rgba(6,182,212,.4)' : 'var(--bd)'}`,
                    background: on ? 'rgba(6,182,212,.06)' : 'rgba(255,255,255,.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <button type="button" onClick={() => toggleBereich(b.key)} style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        border: `2px solid ${on ? 'var(--c)' : 'var(--mt)'}`,
                        background: on ? 'var(--c)' : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{on && <Check size={13} color="#04121f" />}</button>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: on ? 'var(--white)' : 'var(--tx)' }}>{b.label}</span>
                      {on && (
                        <input type="text" placeholder="Notiz (optional)" value={bereiche[b.key].notiz}
                          onChange={e => setBereiche(prev => ({ ...prev, [b.key]: { ...prev[b.key], notiz: e.target.value } }))}
                          onClick={e => e.stopPropagation()}
                          className="field" style={{ marginLeft: 8, flex: 1, padding: '5px 9px', fontSize: 12.5, width: 'auto' }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="flabel">Mängel / Besonderheiten</label>
              <textarea value={maengel} onChange={e => setMaengel(e.target.value)} placeholder="Beschädigungen, Auffälligkeiten, offene Punkte" rows={3} className="field" style={{ resize: 'none' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="flabel">Allgemeine Notizen</label>
              <textarea value={gesamtNotizen} onChange={e => setGesamtNotizen(e.target.value)} placeholder="Sonstige Hinweise" rows={2} className="field" style={{ resize: 'none' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="flabel">Fotos (optional)</label>
              <input type="file" accept="image/*" multiple onChange={e => setFotos(Array.from(e.target.files))} style={{ fontSize: 13, color: 'var(--tx)' }} />
              {fotos.length > 0 && <p style={{ fontSize: 12, color: 'var(--c)', marginTop: 4 }}>{fotos.length} Foto{fotos.length > 1 ? 's' : ''} ausgewählt</p>}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setStep(1)} className="btn-line" style={{ flex: 1 }}>Zurück</button>
              <button type="button" onClick={() => setStep(3)} className="btn-c" style={{ flex: 2 }}>Weiter zu Unterschrift</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 15, background: 'rgba(255,255,255,.03)', border: '1px solid var(--bd)', borderRadius: 10, fontSize: 13, color: 'var(--tx)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--white)' }}>Zusammenfassung</strong>
              <div style={{ marginTop: 6 }}>
                Objekt: {filteredObjekte.find(o => o.id === selectedObjekt)?.name || 'nicht gewählt'}<br />
                Datum: {datum}{zeitVon && ` · ${zeitVon} bis ${zeitBis}`}<br />
                Mitarbeiter: {mitarbeiter}<br />
                Bereiche: {Object.values(bereiche).filter(b => b.erledigt).length} von {BEREICHE.length} erledigt
                {maengel && <><br />Mängel vermerkt</>}
              </div>
            </div>

            <SignaturePad ref={sigRef} label="Unterschrift Mitarbeiter" />

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setStep(2)} className="btn-line" style={{ flex: 1 }}>Zurück</button>
              <button type="submit" disabled={loading} className="btn-c" style={{ flex: 2 }}>
                {loading ? 'PDF wird erstellt …' : 'Protokoll abschließen und PDF'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
