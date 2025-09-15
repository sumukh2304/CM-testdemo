import React, { useEffect } from 'react'
import { Platform } from 'react-native'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (Platform.OS === 'web') {
    return (
      <div className={`toast ${type}`}>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button 
            onClick={onClose}
            className="ml-4 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Native version
  return (
    <div style={{
      position: 'absolute',
      top: 50,
      right: 20,
      backgroundColor: type === 'success' ? '#708238' : type === 'error' ? '#CC5500' : '#2563eb',
      padding: 16,
      borderRadius: 8,
      color: 'white',
      fontWeight: '500',
      maxWidth: 300,
      zIndex: 1000,
    }}>
      {message}
    </div>
  )
}

