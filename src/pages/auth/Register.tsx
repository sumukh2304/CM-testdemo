import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../../lib/cognito'
import { createBackendUser } from '../../lib/api'
import Toast from '../../components/Toast'
import Logo from '../../components/Logo'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'viewer' | 'creator'>('viewer')
  const [country, setCountry] = useState('')
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setToast(null)
    
    try {
      console.log('[Register] Starting registration process')
      
      // Cognito sign up
      const signupRes = await signUp(email, password, role, name)
      const userSub = signupRes?.userSub || signupRes?.UserSub || ''
      console.log('[Register] Cognito signup success, userSub:', userSub)
      
      // Pre-fill verify screen
      sessionStorage.setItem('verifyEmail', email)
      setToast({ message: 'Verification email sent. Redirecting...', type: 'success' })

      // Create backend user
      await createBackendUser({ 
        userId: userSub || undefined, 
        name, 
        email, 
        role, 
        country 
      })
      console.log('[Register] Backend user created successfully')

      // Redirect to verify
      setTimeout(() => navigate('/verify'), 1000)
      
    } catch (err: any) {
      console.error('[Register] Failed', err)
      const errorMessage = err?.message || 'Registration failed'
      setToast({ message: errorMessage, type: 'error' })
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
        
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Cartoon Movie today!</p>
        
        <form onSubmit={onSubmit} className="auth-form">
          <div className="auth-input-group">
            <input 
              className="auth-input" 
              placeholder="Full Name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
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
          
          <div className="auth-input-group">
            <select 
              className="auth-select" 
              value={role} 
              onChange={(e) => setRole(e.target.value as 'viewer' | 'creator')}
              disabled={loading}
            >
              <option value="viewer">Viewer</option>
              <option value="creator">Creator</option>
            </select>
          </div>
          
          <div className="auth-input-group">
            <input 
              className="auth-input" 
              placeholder="Country (optional)" 
              type="text" 
              value={country} 
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button 
            className="auth-button" 
            disabled={loading}
            type="submit"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/login')} 
            className="auth-link"
            disabled={loading}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
