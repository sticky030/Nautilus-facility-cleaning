import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, Calendar, Download, CheckCheck } from 'lucide-react'
import { generateSchadenPDF } from '../lib/generatePDF'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const STATUS = {
  ok:       { cls: 'ok',       label: 'Alles OK' },
  hinweis:  { cls: 'warn',     label: 'Hinweis gemeldet' },
  dringend: { cls: 'dringend', label: 'Dringender Hinweis' },
}

function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '10px 4px', marginRight: 24, fontSize: 14, fontWeight: 600,
        background: 'none', border: 'none', borderBottom: '2px solid',
        borderColor: active ? 'var(--c)' : 'transparent',
        color: active ? 'var(--white)' : 'var(--mt)',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s'
      }}>
      {children}
    </button>
  )
}

export default function PropertyDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [objekt, setObjekt] = useState(null)
  const [protokolle, setProtokolle] = useState([])
  const [schaeden, setSchaeden] = useState([])
  const [tab, setTab] = useState('protokolle')
  const [loading, setLoading] = useState(true)
  const isAdmin = session?.user?.email === import.meta.env.VITE_ADMIN_EMAIL

  useEffect(() => {
    async function load() {
      const [{ data: obj }, { data: proto }, { data: sch }] = await Promise.all([
        supabase.from('objekte').select('*').eq('id', id).single(),
        supabase.from('protokolle').select('*').eq('objekt_id', id).order('datum', { ascending: false }),
        supabase.from('schadensmeldungen').select('*').eq('objekt_id', id).order('created_at', { ascending: false }),
      ])
      setObjekt(obj); setProtokolle(proto || []); setSchaeden(sch || [])
      setLoading(false)
    }
    load()
  }, [id])

  const st = STATUS[objekt?.status] || STATUS.ok

  return (
    <div className="app">
      <Sidebar session={session} view={null} onSelect={() => navigate('/dashboard')} />

      <main className="main">
        <button onClick={() => navigate('/dashboard')} className="btn-line" style={{ padding: '8px 14px', fontSize: 13, marginBottom: 22 }}>
          <ArrowLeft size={15} /> Zurück zur Übersicht
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><div className="spin" /></div>
        ) : (
          <>
            <div className="head" style={{ marginBottom: 20 }}>
              <div>
                <div className="head-tag">Objekt</div>
                <h1>{objekt?.name}</h1>
                <p style={{ color: 'var(--mt)', fontSize: 13, marginTop: 4 }}>{objekt?.adresse}</p>
              </div>
              <span className={`badge ${st.cls}`}><span className="d" />{st.label}</span>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid var(--bd)', marginBottom: 22 }}>
              <Tab active={tab === 'protokolle'} onClick={() => setTab('protokolle')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><FileText size={15} /> Protokolle ({protokolle.length})</span>
              </Tab>
              <Tab active={tab === 'schaden'} onClick={() => setTab('schaden')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><AlertTriangle size={15} /> Hinweise ({schaeden.length})</span>
              </Tab>
            </div>

            {tab === 'protokolle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {protokolle.length === 0
                  ? <div className="empty">Noch keine Protokolle vorhanden.</div>
                  : protokolle.map(p => (
                    <div key={p.id} className="panel" style={{ padding: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Calendar size={14} style={{ color: 'var(--c)' }} />
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{format(new Date(p.datum), 'dd. MMMM yyyy', { locale: de })}</span>
                          {p.nummer && <span style={{ fontSize: 11, color: 'var(--mt)', fontFamily: 'monospace' }}>{p.nummer}</span>}
                        </div>
                        {p.notizen && <p style={{ fontSize: 13, color: 'var(--tx)', marginTop: 6 }}>{p.notizen}</p>}
                        {p.mitarbeiter && <p style={{ fontSize: 12, color: 'var(--mt)', marginTop: 4 }}>Mitarbeiter: {p.mitarbeiter}</p>}
                      </div>
                      {p.pdf_url && (
                        <a href={p.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-line" style={{ padding: '7px 13px', fontSize: 12, flexShrink: 0 }}>
                          <Download size={13} /> PDF
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {tab === 'schaden' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {schaeden.length === 0
                  ? <div className="empty"><CheckCircle2 size={30} style={{ color: 'var(--green)', margin: '0 auto 8px', display: 'block' }} />Keine Hinweise vorhanden.</div>
                  : schaeden.map(s => (
                    <div key={s.id} className="panel" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.behoben ? 'var(--green)' : 'var(--yellow)' }} />
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{s.titel}</span>
                            {s.nummer && <span style={{ fontSize: 11, color: 'var(--mt)', fontFamily: 'monospace' }}>{s.nummer}</span>}
                          </div>
                          {s.beschreibung && <p style={{ fontSize: 13, color: 'var(--tx)', marginTop: 4 }}>{s.beschreibung}</p>}
                          <p style={{ fontSize: 12, color: 'var(--mt)', marginTop: 6 }}>Gemeldet: {format(new Date(s.created_at), 'dd.MM.yyyy', { locale: de })}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span className={`badge ${s.behoben ? 'ok' : 'warn'}`}><span className="d" />{s.behoben ? 'Behoben' : 'Offen'}</span>
                          {isAdmin && !s.behoben && (
                            <button
                              onClick={async () => {
                                await supabase.from('schadensmeldungen').update({ behoben: true }).eq('id', s.id)
                                await supabase.from('objekte').update({ status: 'ok' }).eq('id', id)
                                setSchaeden(prev => prev.map(x => x.id === s.id ? { ...x, behoben: true } : x))
                              }}
                              className="btn-line" style={{ padding: '7px 13px', fontSize: 12, color: 'var(--green)', borderColor: 'rgba(16,185,129,.3)' }}>
                              <CheckCheck size={13} /> Als behoben
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              const blob = await generateSchadenPDF({
                                objekt, hausverwaltung: '', titel: s.titel, nummer: s.nummer,
                                beschreibung: s.beschreibung, datum: s.created_at?.split('T')[0],
                                behoben: s.behoben,
                                fotoUrls: (s.foto_urls && s.foto_urls.length) ? s.foto_urls : (s.foto_url ? [s.foto_url] : [])
                              })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url; a.download = `Hinweis_${s.titel?.slice(0, 20)}.pdf`
                              a.click(); URL.revokeObjectURL(url)
                            }}
                            className="btn-line" style={{ padding: '7px 13px', fontSize: 12 }}>
                            <Download size={13} /> PDF
                          </button>
                        </div>
                      </div>
                      {(() => {
                        const gal = (s.foto_urls && s.foto_urls.length) ? s.foto_urls : (s.foto_url ? [s.foto_url] : [])
                        if (!gal.length) return null
                        return (
                          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: gal.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
                            {gal.map((u, i) => (
                              <a key={i} href={u} target="_blank" rel="noopener noreferrer">
                                <img src={u} alt={`Hinweis Foto ${i + 1}`} style={{ borderRadius: 12, width: '100%', objectFit: 'cover', maxHeight: gal.length === 1 ? 400 : 220, border: '1px solid var(--bd)' }} />
                              </a>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
