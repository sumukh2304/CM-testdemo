import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { confirmSignUp, resendConfirmation } from '../../lib/cognito'
import Toast from '../../components/Toast'
import Logo from '../../components/Logo'

export default function Verify() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    // Get email from session storage (set during registration)
    const storedEmail = sessionStorage.getItem('verifyEmail')
    if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !email) {
      setToast({ message: 'Please enter both email and verification code', type: 'error' })
      return
    }

    setLoading(true)
    try {
      await confirmSignUp(email, code)
      

      
      setToast({ message: 'Email verified successfully! You can now login.', type: 'success' })
      
      // Clear stored email
      sessionStorage.removeItem('verifyEmail')
      
      // Redirect to login after a delay
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      console.error('[Verify] Failed:', err)
      const errorMessage = err?.message || 'Verification failed'
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setToast({ message: 'Please enter your email first', type: 'error' })
      return
    }

    setLoading(true)
    try {
      await resendConfirmation(email)
      setToast({ message: 'Verification code resent to your email', type: 'success' })
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to resend code'
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
        
        <h1 className="auth-title">Verify Your Email</h1>
        <p className="auth-subtitle">Enter the 6-digit code sent to your email.</p>
        
        <form onSubmit={handleVerify} className="auth-form">
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
              placeholder="Verification Code" 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              disabled={loading}
            />
          </div>
          
          <button 
            className="auth-button" 
            disabled={loading}
            type="submit"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        
        <div className="auth-footer">
          <button 
            onClick={handleResendCode} 
            className="auth-link"
            disabled={loading}
          >
            Resend Code
          </button>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
          <button 
            onClick={() => navigate('/login')} 
            className="auth-link"
            disabled={loading}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
