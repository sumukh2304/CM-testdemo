import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

interface SiteHeaderProps {
  navigation?: any
  mode?: 'default' | 'creator'
}

export default function SiteHeader({ navigation, mode = 'default' }: SiteHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    if (Platform.OS === 'web') {
      window.addEventListener('scroll', handleScroll)
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        window.removeEventListener('scroll', handleScroll)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [])

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
    return (
      <header className={`site-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => handleNavigation('/')} className="header-logo">
              <Logo />
            </button>
            <nav className="header-nav"></nav>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => handleNavigation('/')}
                  style={{
                    color: '#FFFFFF',
                    padding: '9px 16px',
                    borderRadius: 9999,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'transparent',
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    transition: 'background-color 150ms ease, border-color 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)';
                  }}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigation('/login')}
                  style={{
                    background: 'linear-gradient(135deg, #CC5500 0%, #FF7A1A 100%)',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: 9999,
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 6px 18px rgba(204,85,0,0.35)',
                    fontWeight: 800,
                    letterSpacing: 0.3,
                    transition: 'transform 150ms ease, box-shadow 150ms ease, filter 150ms ease',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 24px rgba(204,85,0,0.45)';
                    (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.03)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 18px rgba(204,85,0,0.35)';
                    (e.currentTarget as HTMLButtonElement).style.filter = 'none';
                  }}
                >
                  Login
                </button>
              </div>
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
