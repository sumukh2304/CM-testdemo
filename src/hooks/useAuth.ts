import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { BACKEND_URL } from '../config';
import { authAPI, User } from '../services/api';
import { createBackendUser } from '../lib/api';
import { sessionManager } from '../utils/sessionManager';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    country?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug user state changes
  useEffect(() => {
    console.log('👤 User state changed:', { user: !!user, userData: user });
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        const session = sessionManager.getSession();
        console.log('📋 Session data:', session);
        
        if (session) {
          console.log('✅ User found in session:', session.user);
          setUser(session.user);
          console.log('👤 User state set to:', session.user);
        } else {
          console.log('❌ No valid session found');
          setUser(null);
          console.log('👤 User state set to: null');
        }
        
        // Set loading to false after user state is set
        setLoading(false);
        console.log('🏁 Auth initialization complete');
      } catch (error) {
        console.error('Auth initialization failed:', error);
        sessionManager.clearSession();
        setUser(null);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auto-refresh session timestamp on user activity
  useEffect(() => {
    if (user) {
      const cleanup = sessionManager.setupActivityListener();

      // Listen for session expiration events (web only)
      const handleSessionExpired = () => {
        setUser(null);
      };

      const hasWindow = typeof window !== 'undefined' && !!(window as any).addEventListener;
      if (hasWindow) {
        window.addEventListener('sessionExpired', handleSessionExpired as any);
      }

      return () => {
        cleanup();
        if (hasWindow) {
          window.removeEventListener('sessionExpired', handleSessionExpired as any);
        }
      };
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login for:', email)

      // 1) Verify credentials first
      try {
        // Prefer Cognito verification on web (immediate feedback, no backend dependency)
        const { signIn: cognitoSignIn } = require('../lib/cognito')
        await cognitoSignIn(email, password)
        console.log('✅ Cognito password verified')
      } catch (e) {
        // As a fallback (or for environments where Cognito is not available), call backend /login
        const emsg = (e && (e as any).message) ? (e as any).message : String(e || '')
        console.warn('Cognito sign-in failed or unavailable, trying backend /login:', emsg)
        try {
          await authAPI.login(email, password)
          console.log('✅ Backend password verified')
        } catch (e2) {
          console.error('❌ Password verification failed')
          throw new Error('Invalid email or password')
        }
      }

      // 2) Fetch user profile to populate session (role, ids, etc.)
      const response = await fetch(`${BACKEND_URL}/users`)
      const data = await response.json()
      const users = data?.users || []
      const userData = users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase())

      if (!userData) {
        throw new Error('User not found')
      }

      console.log('👤 User data found:', userData)

      // 2.5) Enforce creator approval BEFORE creating a session
      try {
        if ((userData.role || '').toLowerCase() === 'creator') {
          const { getCreatorApproval } = require('../lib/api')
          const approval = await getCreatorApproval(userData.userId)
          const isApproved = (approval?.approved || '').toString().toLowerCase() === 'yes'
          if (!isApproved) {
            throw new Error('Creator account not approved yet')
          }
        }
      } catch (e) {
        // surface a clean message to UI
        const emsg = (e && (e as any).message) ? (e as any).message : 'Creator account not approved'
        throw new Error(emsg)
      }

      // 3) Store auth data with session management
      sessionManager.setSession(userData, userData.userId)
      setUser(userData)
      console.log('💾 Session stored successfully')
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    country?: string;
  }) => {
    try {
      // 1) Sign up in Cognito to create the identity
      const { signUp } = require('../lib/cognito');
      const roleToUse = (userData.role || 'viewer') as 'viewer' | 'creator' | 'admin';
      const signupRes = await signUp(userData.email, userData.password, roleToUse, userData.name);
      const userSub: string = signupRes?.userSub || signupRes?.UserSub || '';

      // 2) Create user in backend using Cognito sub as userId
      const created = await createBackendUser({
        userId: userSub || undefined,
        name: userData.name,
        email: userData.email,
        role: roleToUse,
        country: userData.country,
      });

      // 3) Store session
      sessionManager.setSession(created, created.userId);
      setUser(created);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    sessionManager.clearSession();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};
