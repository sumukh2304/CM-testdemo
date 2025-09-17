import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { sessionManager } from '../../utils/sessionManager'
import Toast from '../../components/Toast'
import Logo from '../../components/Logo'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log('[Login] Attempting login', { email })
    try {
      await login(email, password)
      console.log('[Login] AuthProvider login success')
      setToast({ message: 'Login successful', type: 'success' })
      // After login, use actual session role for redirect
      const session = sessionManager.getSession()
      const role = session?.user?.role
      if (role === 'creator') navigate('/creator')
      else navigate('/dashboard')
    } catch (err: any) {
      console.error('[Login] Failed', err)
      setToast({ message: err?.message || 'Login failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="auth-background"></div>
      
      <div className="auth-card">
        <div className="auth-logo">
          <Logo />
        </div>
        
        <h1 className="auth-title">Welcome back!</h1>
        <p className="auth-subtitle">Log in to explore fresh cartoons and movies.</p>
        
        <form onSubmit={onSubmit} className="auth-form">
          <div className="auth-input-group">
            <input 
              className="auth-input" 
              placeholder="Email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="auth-input-group" style={{ position: 'relative' }}>
            <input 
              className="auth-input" 
              placeholder="Password" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                padding: 6,
                cursor: 'pointer',
                color: '#cfcfcf'
              }}
            >
              {showPassword ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.022-2.86 3.09-5.2 5.74-6.6M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-.51 1.43-1.3 2.73-2.3 3.82M1 1l22 22" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          
          <button 
            className="auth-button" 
            disabled={loading}
            type="submit"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          New here?{' '}
          <button 
            onClick={() => navigate('/register')} 
            className="auth-link"
            disabled={loading}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}
