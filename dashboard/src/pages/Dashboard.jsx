import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import {
  Building2, FileText, AlertTriangle, CheckCircle2,
  Check, Download, Calendar
} from 'lucide-react'
import { formatDistanceToNow, format, isSameMonth } from 'date-fns'
import { de } from 'date-fns/locale'

const STATUS = {
  ok:       { cls: 'ok',       label: 'Alles OK' },
  hinweis:  { cls: 'warn',     label: 'Hinweis gemeldet' },
  dringend: { cls: 'dringend', label: 'Dringender Hinweis' },
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.ok
  return <span className={`badge ${s.cls}`}><span className="d" />{s.label}</span>
}

function letzteReinigung(obj) {
  const p = (obj.protokolle || []).slice().sort((a, b) => new Date(b.datum) - new Date(a.datum))[0]
  return p ? new Date(p.datum) : null
}

export default function Dashboard({ session }) {
  const [objekte, setObjekte] = useState([])
  const [loading, setLoading] = useState(true)
  const [kundeName, setKundeName] = useState('')
  const [view, setView] = useState('overview')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data: hvData } = await supabase
        .from('hausverwaltungen').select('id, name')
        .eq('user_id', session.user.id).maybeSingle()
      if (!hvData) { setLoading(false); return }
      setKundeName(hvData.name)
      const { data } = await supabase
        .from('objekte')
        .select(`id, name, adresse, status, groesse, turnus,
          protokolle ( id, datum, mitarbeiter, pdf_url ),
          schadensmeldungen ( id, titel, behoben, created_at )`)
        .eq('hausverwaltung_id', hvData.id)
        .order('name')
      setObjekte(data || [])
      setLoading(false)
    }
    load()
  }, [session])

  // abgeleitete Daten
  const alleProtokolle = objekte.flatMap(o =>
    (o.protokolle || []).map(p => ({ ...p, objektName: o.name, objektId: o.id, adresse: o.adresse }))
  ).sort((a, b) => new Date(b.datum) - new Date(a.datum))

  const offeneHinweise = objekte.flatMap(o =>
    (o.schadensmeldungen || []).filter(s => !s.behoben)
      .map(s => ({ ...s, objektName: o.name, objektId: o.id, adresse: o.adresse }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const stats = {
    objekte: objekte.length,
    protokolleMonat: alleProtokolle.filter(p => isSameMonth(new Date(p.datum), new Date())).length,
    offen: offeneHinweise.length,
    ok: objekte.filter(o => o.status === 'ok').length,
  }

  const now = new Date()
  const liveTs = `Letzte Aktualisierung: Heute ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} Uhr`

  const titles = {
    overview:   { tag: 'Objektübersicht', h1: 'Aktuelle Objekte' },
    objekte:    { tag: 'Alle Liegenschaften', h1: 'Objekte' },
    protokolle: { tag: 'Dokumentation', h1: 'Protokolle' },
    hinweise:   { tag: 'Offene Punkte', h1: 'Hinweise' },
  }
  const t = titles[view] || titles.overview

  return (
    <div className="app">
      <Sidebar
        session={session}
        view={view}
        onSelect={setView}
        kundeName={kundeName}
        openHinweise={stats.offen}
      />

      <main className="main">
        <div className="head">
          <div>
            <div className="head-tag">{t.tag}</div>
            <h1>{t.h1}</h1>
          </div>
          <div className="head-meta"><span className="live-dot" />{liveTs}</div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div className="spin" />
          </div>
        ) : (!kundeName ? (
          <div className="empty">Diesem Konto ist noch kein Kunde zugeordnet. Bitte wenden Sie sich an Nautilus Facility Cleaning.</div>
        ) : (
          <>
            {/* OVERVIEW */}
            {view === 'overview' && (
              <>
                <div className="stats">
                  <Stat icon={<Building2 />} bg="var(--cs)" col="var(--c)" value={stats.objekte} label="Objekte gesamt" />
                  <Stat icon={<FileText />} bg="rgba(16,185,129,.12)" col="var(--green)" value={stats.protokolleMonat} label="Protokolle diesen Monat" />
                  <Stat icon={<AlertTriangle />} bg="rgba(245,158,11,.13)" col="var(--yellow)" value={stats.offen} label={stats.offen === 1 ? 'Offener Hinweis' : 'Offene Hinweise'} />
                  <Stat icon={<CheckCircle2 />} bg="var(--cs)" col="var(--c)" value={stats.ok} label="Objekte ohne Befund" />
                </div>

                <ObjectGrid objekte={objekte} navigate={navigate} />

                <div className="sec-title">Letzte Reinigungen</div>
                <ProtocolTable rows={alleProtokolle.slice(0, 6)} navigate={navigate} />
              </>
            )}

            {/* OBJEKTE */}
            {view === 'objekte' && (
              objekte.length === 0
                ? <div className="empty">Noch keine Objekte hinterlegt.</div>
                : <ObjectGrid objekte={objekte} navigate={navigate} />
            )}

            {/* PROTOKOLLE */}
            {view === 'protokolle' && (
              alleProtokolle.length === 0
                ? <div className="empty">Noch keine Protokolle vorhanden.</div>
                : <ProtocolTable rows={alleProtokolle} navigate={navigate} withPdf />
            )}

            {/* HINWEISE */}
            {view === 'hinweise' && (
              offeneHinweise.length === 0
                ? <div className="empty">Keine offenen Hinweise. Alles im grünen Bereich.</div>
                : (
                  <div className="panel">
                    <div className="tbl-hdr"><span>Objekt</span><span>Hinweis</span><span className="c-date">Gemeldet</span><span className="c-stat">Status</span></div>
                    {offeneHinweise.map(h => (
                      <div key={h.id} className="tbl-row" onClick={() => navigate(`/objekt/${h.objektId}`)}>
                        <span><span className="tbl-obj">{h.objektName}</span><div className="tbl-sub">{h.adresse}</div></span>
                        <span>{h.titel}</span>
                        <span className="c-date">{format(new Date(h.created_at), 'dd.MM.yyyy', { locale: de })}</span>
                        <span className="c-stat"><span className="badge warn"><span className="d" />Offen</span></span>
                      </div>
                    ))}
                  </div>
                )
            )}
          </>
        ))}
      </main>
    </div>
  )
}

function Stat({ icon, bg, col, value, label }) {
  return (
    <div className="stat">
      <div className="stat-ic" style={{ background: bg, color: col }}>{icon}</div>
      <div><div className="stat-v">{value}</div><div className="stat-l">{label}</div></div>
    </div>
  )
}

function ObjectGrid({ objekte, navigate }) {
  return (
    <div className="obj-grid">
      {objekte.map(obj => {
        const lr = letzteReinigung(obj)
        const cardCls = obj.status === 'dringend' ? 'dringend' : obj.status === 'hinweis' ? 'warn' : ''
        return (
          <button key={obj.id} className={`obj-card ${cardCls}`} onClick={() => navigate(`/objekt/${obj.id}`)}>
            <div className="obj-top">
              <div>
                <div className="obj-name">{obj.name}</div>
                <div className="obj-addr">{obj.adresse}</div>
              </div>
              <div className="obj-ic"><Building2 strokeWidth={2} /></div>
            </div>
            <StatusBadge status={obj.status} />
            <div className="obj-foot">
              <span>Letzte Reinigung</span>
              <span className="m">
                {lr ? formatDistanceToNow(lr, { addSuffix: true, locale: de }) : 'noch keine'}
                {obj.groesse ? ` · ${obj.groesse}` : ''}
              </span>
            </div>
            {obj.turnus && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--mt)' }}>Turnus: <span style={{ color: 'var(--tx)' }}>{obj.turnus}</span></div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function ProtocolTable({ rows, navigate, withPdf }) {
  if (!rows.length) return <div className="empty">Noch keine Protokolle vorhanden.</div>
  return (
    <div className="panel">
      <div className="tbl-hdr">
        <span>Objekt</span><span>Mitarbeiter</span><span className="c-date">Datum</span><span className="c-stat">{withPdf ? 'PDF' : 'Status'}</span>
      </div>
      {rows.map(p => (
        <div key={p.id} className="tbl-row" onClick={() => navigate(`/objekt/${p.objektId}`)}>
          <span><span className="tbl-obj">{p.objektName}</span><div className="tbl-sub">{p.adresse}</div></span>
          <span>{p.mitarbeiter || 'Nautilus Team'}</span>
          <span className="c-date"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Calendar size={12} style={{ color: 'var(--c)' }} />{format(new Date(p.datum), 'dd.MM.yyyy', { locale: de })}</span></span>
          <span className="c-stat">
            {withPdf
              ? (p.pdf_url
                  ? <a href={p.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="chk" style={{ color: 'var(--c)' }}><Download size={13} />PDF</a>
                  : <span style={{ color: 'var(--mt)', fontSize: 12 }}>ausstehend</span>)
              : <span className="chk"><Check size={14} strokeWidth={3} />Erledigt</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
