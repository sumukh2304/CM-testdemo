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
          
          <div className="auth-input-group">
            <input 
              className="auth-input" 
              placeholder="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
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
