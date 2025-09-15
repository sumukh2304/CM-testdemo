import React from 'react'
import { Platform } from 'react-native'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Load global styles only on web
if (Platform.OS === 'web') {
  try {
    require('./styles.css')
  } catch {}
}

// Import pages
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/auth/Login'
import Register from './pages/auth/Register'
import Verify from './pages/auth/Verify'
import VideoPlayerPage from './pages/VideoPlayerPage'
import Creator from './pages/creator/Creator'
import About from './pages/static/About'
import Team from './pages/static/Team'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  console.log('🛡️ ProtectedRoute check:', { user: !!user, loading, userData: user });
  
  if (loading) {
    console.log('⏳ ProtectedRoute: Still loading...');
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
    );
  }
  
  if (!user) {
    console.log('❌ ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />
  }
  
  console.log('✅ ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>
}

function CreatorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: '#000', color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'creator') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function ViewerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: '#000', color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'creator') return <Navigate to="/creator" replace />
  return <>{children}</>
}

// Main App Content
function AppContent() {
  const { user } = useAuth()
  
  console.log('🏠 AppContent render:', { user: !!user, userData: user });
  
  if (Platform.OS === 'web') {
    console.log('🌐 Web platform detected, rendering routes...');
    console.log('📍 Current location:', window.location.pathname);
    
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <Routes>
          {/* Public landing page */}
          <Route path="/register" element={
            <div>
              <Register />
            </div>
          } />
          <Route path="/verify" element={
            <div>
              <Verify />
            </div>
          } />
          <Route path="/login" element={
            <div>
              <LoginPage />
            </div>
          } />
          <Route path="/about" element={
            <div>
              <About />
            </div>
          } />
          <Route path="/team" element={
            <div>
              <Team />
            </div>
          } />
          <Route path="/" element={
            <div>
              <Home />
            </div>
          } />
          {/* Protected dashboard (viewer-only) */}
          <Route path="/dashboard" element={
            <div>
              <ViewerRoute>
                <div>
                  <Dashboard />
                </div>
              </ViewerRoute>
            </div>
          } />
          {/* Creator Studio (creator-only) */}
          <Route path="/creator" element={
            <div>
              <CreatorRoute>
                <div>
                  <Creator />
                </div>
              </CreatorRoute>
            </div>
          } />
          {/* Backward compatibility: /home -> /dashboard */}
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/watch/:contentId" element={
            <ProtectedRoute>
              <VideoPlayerPage 
                contentId={window.location.pathname.split('/')[2]} 
                autoplay={new URLSearchParams(window.location.search).get('autoplay') === '1'}
                fullscreen={new URLSearchParams(window.location.search).get('fs') === '1'}
              />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    )
  } else {
    // For React Native, you would use React Navigation
    return user ? <Dashboard /> : <LoginPage />
  }
}

export default function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <AuthProvider>
      {Platform.OS === 'web' ? (
        <Router>
          <AppContent />
        </Router>
      ) : (
        <AppContent />
      )}
    </AuthProvider>
  )
}
