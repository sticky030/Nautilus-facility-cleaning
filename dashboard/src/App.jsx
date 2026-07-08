import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PropertyDetail from './pages/PropertyDetail'
import Admin from './pages/Admin'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  const isAdmin = session.user?.email === import.meta.env.VITE_ADMIN_EMAIL
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-nautilus-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute session={session}>
          <Dashboard session={session} />
        </ProtectedRoute>
      } />
      <Route path="/objekt/:id" element={
        <ProtectedRoute session={session}>
          <PropertyDetail session={session} />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute session={session}>
          <Admin session={session} />
        </AdminRoute>
      } />
      <Route path="/signup" element={<Signup />} />
      <Route path="/passwort-vergessen" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}
