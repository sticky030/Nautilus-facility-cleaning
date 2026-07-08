import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutGrid, FileText, AlertTriangle, Building2, Settings, LogOut } from 'lucide-react'

const NAV = [
  { key: 'overview',   label: 'Übersicht',  icon: LayoutGrid },
  { key: 'objekte',    label: 'Objekte',    icon: Building2 },
  { key: 'protokolle', label: 'Protokolle', icon: FileText },
  { key: 'hinweise',   label: 'Hinweise',   icon: AlertTriangle, badge: true },
]

export default function Sidebar({ session, view, onSelect, kundeName, openHinweise = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const email = session?.user?.email || ''
  const isAdmin = email === import.meta.env.VITE_ADMIN_EMAIL
  const onAdmin = location.pathname === '/admin'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="side-brand-logo">N</div>
        <div>
          <div className="side-brand-name">Nautilus Portal</div>
          <div className="side-brand-sub">Facility Cleaning</div>
        </div>
      </div>

      <div className="side-user">
        <div className="side-user-name">{kundeName || 'Ihr Konto'}</div>
        <div className="side-user-role">{isAdmin ? 'Administrator' : 'Kundenzugang'}</div>
        <div className="side-user-co">{email}</div>
      </div>

      <nav className="side-nav">
        <div className="side-lbl">Portal</div>
        {NAV.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            className={`nav-item${view === key ? ' active' : ''}`}
            onClick={() => onSelect(key)}
          >
            <Icon strokeWidth={2} />
            {label}
            {badge && openHinweise > 0 && <span className="nav-badge">{openHinweise}</span>}
          </button>
        ))}

        {isAdmin && (
          <>
            <div className="side-lbl">Verwaltung</div>
            <button className={`nav-item${onAdmin ? ' active' : ''}`} onClick={() => navigate('/admin')}>
              <Settings strokeWidth={2} /> Admin
            </button>
          </>
        )}
      </nav>

      <div className="side-foot">
        <button className="side-logout" onClick={handleLogout}>
          <LogOut strokeWidth={2} /> Abmelden
        </button>
      </div>
    </aside>
  )
}
