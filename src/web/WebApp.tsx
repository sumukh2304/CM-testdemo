import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '../hooks/useAuth'
import '../styles.css'
import Home from '../pages/Home'
import Dashboard from '../pages/Dashboard'
import SearchPage from '../pages/SearchPage'
import VideoPlayer from '../pages/viewer/VideoPlayer'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Verify from '../pages/auth/Verify'
import Creator from '../pages/creator/Creator'
import Admin from '../pages/admin/Admin'
import Navigation from '../components/Navigation'
import About from '../pages/static/About'
import Team from '../pages/static/Team'

export default function WebApp() {
  function ScrollToTop() {
    const location = useLocation()
    useEffect(() => {
      const root = document.getElementById('app-scroll-root')
      if (root) {
        root.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }
    }, [location.pathname])
    return null
  }
  // Local ProtectedRoute for WebApp
  function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          backgroundColor: '#000',
          color: 'white'
        }}>
          <div>Loading...</div>
        </div>
      )
    }
    if (!user) {
      return <Navigate to="/login" replace />
    }
    return <>{children}</>
  }

  return (
    <AuthProvider>
      <div id="app-scroll-root" className="min-h-screen w-full" style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={
              <div>
                <Home />
              </div>
            } />
            {/* Protected dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>
                  <Navigation />
                  <div style={{ paddingTop: 64 }}>
                    <Dashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            {/* Search results */}
            <Route path="/search" element={
              <ProtectedRoute>
                <div>
                  <Navigation />
                  <div style={{ paddingTop: 64 }}>
                    <SearchPage />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            {/* Backward compatibility */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/watch/:contentId" element={<VideoPlayer />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/creator" element={<Creator />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
            <Route path="/team" element={<Team />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  )
}
