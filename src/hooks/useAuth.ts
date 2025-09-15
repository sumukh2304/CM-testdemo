import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { BACKEND_URL } from '../config';
import { authAPI, User } from '../services/api';
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
      console.log('🔐 Starting login for:', email);
      // Use the working user lookup instead of problematic /login endpoint
      const response = await fetch(`${BACKEND_URL}/users`);
      const data = await response.json();
      const users = data?.users || [];
      const userData = users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());
      
      if (!userData) {
        throw new Error('User not found');
      }
      
      console.log('👤 User data found:', userData);
      
      // Store auth data with session management
      sessionManager.setSession(userData, userData.userId);
      setUser(userData);
      
      console.log('💾 Session stored successfully');
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    country?: string;
  }) => {
    try {
      const newUser = await authAPI.register(userData);
      
      // Auto-login after registration with session management
      sessionManager.setSession(newUser, newUser.userId);
      setUser(newUser);
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
