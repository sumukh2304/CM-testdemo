import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

interface SiteHeaderProps {
  navigation?: any
  mode?: 'default' | 'creator'
}

export default function SiteHeader({ navigation, mode = 'default' }: SiteHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      // Close dropdown on scroll interactions
      setShowProfileDropdown(false)
    }

    const handleGlobalPointer = (event: Event) => {
      const target = event.target as Node | null
      if (!profileRef.current) return
      if (!target || !profileRef.current.contains(target)) {
        setShowProfileDropdown(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowProfileDropdown(false)
    }

    if (Platform.OS === 'web') {
      window.addEventListener('scroll', handleScroll, { passive: true })
      // Use multiple events for reliability across browsers/devices
      document.addEventListener('mousedown', handleGlobalPointer, true)
      document.addEventListener('touchstart', handleGlobalPointer, true)
      document.addEventListener('click', handleGlobalPointer, true)
      document.addEventListener('keydown', handleKey)
      return () => {
        window.removeEventListener('scroll', handleScroll)
        document.removeEventListener('mousedown', handleGlobalPointer, true)
        document.removeEventListener('touchstart', handleGlobalPointer, true)
        document.removeEventListener('click', handleGlobalPointer, true)
        document.removeEventListener('keydown', handleKey)
      }
    }
  }, [])

  // Close the dropdown on route changes
  useEffect(() => {
    setShowProfileDropdown(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    if (Platform.OS === 'web') {
      navigate('/')
    } else if (navigation) {
      navigation.replace('Home')
    }
  }

  const handleNavigation = (route: string) => {
    if (Platform.OS === 'web') {
      navigate(route)
    } else if (navigation) {
      navigation.navigate(route)
    }
  }

  // Web version
  if (Platform.OS === 'web') {
    const hideHome = location.pathname === '/about' || location.pathname === '/team'
    return (
      <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => handleNavigation('/')} className="header-logo">
              <Logo />
            </button>
            <nav className="header-nav">
              {!hideHome && (
                <button
                  onClick={() => handleNavigation('/')}
                  className="header-nav-item"
                >
                  Home
                </button>
              )}
            </nav>
          </div>
          
          <div className="header-right">
            <button 
              onClick={() => handleNavigation('/team')}
              className="header-nav-item"
              style={{ marginRight: 8 }}
            >
            </button>
            {user ? (
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="user-profile"
                >
                  {user.name?.charAt(0) || 'U'}
                </button>
                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <div className="profile-dropdown-avatar">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div className="profile-dropdown-info">
                        <div className="profile-dropdown-name">{user.name || 'User'}</div>
                        <div className="profile-dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="profile-dropdown-divider"></div>
                    
                    <div className="profile-dropdown-menu">
                      <button 
                        onClick={() => {
                          setShowProfileDropdown(false)
                          console.log('User profile:', user)
                        }}
                        className="profile-dropdown-item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </button>
                      
                      <button 
                        onClick={() => {
                          setShowProfileDropdown(false)
                          handleLogout()
                        }}
                        className="profile-dropdown-item text-orange-400 hover:text-orange-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => handleNavigation('/login')}
                className="bg-streaming-primary hover:bg-orange-700 text-white px-6 py-2 rounded transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>
    )
  }

  // Native version
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => handleNavigation('HomeViewer')}>
          <Logo />
        </TouchableOpacity>
      </View>
      
      <View style={styles.centerSection}>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('About')}>
          <Text style={styles.navText}>About</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightSection}>
        {user ? (
          <View style={styles.userSection}>
            <TouchableOpacity style={styles.profileButton} onPress={() => console.log('User profile:', user)}>
              <Text style={styles.profileText}>{user.name?.charAt(0) || 'U'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={() => handleNavigation('Login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#0f0f14',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CC5500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#CC5500',
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#CC5500',
    borderRadius: 8,
  },
  loginText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})
