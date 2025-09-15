import { Platform } from 'react-native'

export interface AuthUser {
  username: string
  email: string
  attributes: {
    email: string
    name?: string
  }
}

export interface AuthSession {
  accessToken: string
  idToken: string
  refreshToken: string
  user: AuthUser
}

// In-memory storage for mobile fallback
let memoryStorage: { [key: string]: string } = {}

// Cross-platform storage implementation
const crossPlatformStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return Promise.resolve(localStorage.getItem(key))
      }
    }
    // Use in-memory storage for mobile
    return Promise.resolve(memoryStorage[key] || null)
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
      }
    } else {
      // Use in-memory storage for mobile
      memoryStorage[key] = value
    }
    return Promise.resolve()
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
      }
    } else {
      // Remove from in-memory storage for mobile
      delete memoryStorage[key]
    }
    return Promise.resolve()
  }
}

// Get storage based on platform
const getStorage = () => {
  return crossPlatformStorage
}

// Sign up a new user (real AWS Cognito implementation)
export const signUp = async (email: string, password: string) => {
  try {
    console.log('[Auth] Real Cognito sign up for:', email)
    
    if (Platform.OS === 'web') {
      // Use web Cognito implementation
      const { signUp: webSignUp } = require('../../lib/cognito')
      return await webSignUp(email, password, 'viewer', email.split('@')[0])
    } else {
      // Use AWS SDK for mobile
      const { CognitoIdentityProviderClient, SignUpCommand } = require('@aws-sdk/client-cognito-identity-provider')
      const { config } = require('../config')
      
      const client = new CognitoIdentityProviderClient({ 
        region: config.cognito.region || 'us-east-1' 
      })
      
      const command = new SignUpCommand({
        ClientId: config.cognito.userPoolWebClientId || '3s8eta17u7a6a9en57ubmdktmo',
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email }
        ]
      })
      
      const result = await client.send(command)
      console.log('[Auth] Cognito signup successful:', result.UserSub)
      return { userSub: result.UserSub, user: { username: email } }
    }
  } catch (error) {
    console.error('[Auth] Sign up error:', error)
    throw error
  }
}

// Confirm sign up with verification code (real AWS Cognito implementation)
export const confirmSignUp = async (email: string, code: string) => {
  try {
    console.log('[Auth] Real Cognito confirm sign up for:', email)
    
    if (Platform.OS === 'web') {
      // Use web Cognito implementation
      const { confirmSignUp: webConfirmSignUp } = require('../../lib/cognito')
      return await webConfirmSignUp(email, code)
    } else {
      // Use AWS SDK for mobile
      const { CognitoIdentityProviderClient, ConfirmSignUpCommand } = require('@aws-sdk/client-cognito-identity-provider')
      const { config } = require('../config')
      
      const client = new CognitoIdentityProviderClient({ 
        region: config.cognito.region || 'us-east-1' 
      })
      
      const command = new ConfirmSignUpCommand({
        ClientId: config.cognito.userPoolWebClientId || '3s8eta17u7a6a9en57ubmdktmo',
        Username: email,
        ConfirmationCode: code
      })
      
      const result = await client.send(command)
      console.log('[Auth] Cognito confirmation successful')
      return result
    }
  } catch (error) {
    console.error('[Auth] Confirm sign up error:', error)
    throw error
  }
}

// Sign in user - now handled by backend login
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  try {
    console.log('[Auth] Sign in for:', email)
    
    // Create user object for compatibility
    const user: AuthUser = {
      username: email,
      email: email,
      attributes: {
        email: email,
        name: email.split('@')[0]
      }
    }
    
    return user
  } catch (error) {
    console.error('[Auth] Sign in error:', error)
    throw error
  }
}

// Sign out user
export const signOut = async () => {
  try {
    const storage = getStorage()
    await storage.removeItem('userSession')
    
    // Clear session timestamp
    if (Platform.OS === 'web') {
      localStorage.removeItem(SESSION_TIMESTAMP_KEY)
    }
    
    console.log('[Auth] Signed out successfully')
  } catch (error) {
    console.error('[Auth] Sign out error:', error)
    throw error
  }
}

// Get current authenticated user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const session = await getStoredSession()
    return session?.user || null
  } catch (error) {
    console.log('[Auth] No authenticated user')
    return null
  }
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getStoredSession()
    return !!session?.user
  } catch (error) {
    return false
  }
}

// Get current session
export const getCurrentSession = async (): Promise<AuthSession | null> => {
  try {
    return await getStoredSession()
  } catch (error) {
    console.log('[Auth] No current session')
    return null
  }
}

// Session timeout management
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_TIMESTAMP_KEY = 'cartoonflix_session_timestamp';

const isSessionValid = (): boolean => {
  if (Platform.OS === 'web') {
    const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const sessionTime = parseInt(timestamp);
    const currentTime = Date.now();
    const timeDiff = currentTime - sessionTime;
    
    return timeDiff < SESSION_TIMEOUT;
  }
  return true; // For mobile, assume valid for now
};

const updateSessionTimestamp = () => {
  if (Platform.OS === 'web') {
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  }
};

// Store session locally
export const storeSession = async (session: AuthSession) => {
  try {
    const storage = getStorage()
    await storage.setItem('userSession', JSON.stringify(session))
    updateSessionTimestamp()
  } catch (error) {
    console.error('[Auth] Error storing session:', error)
  }
}

// Get stored session
export const getStoredSession = async (): Promise<AuthSession | null> => {
  try {
    const storage = getStorage()
    const sessionString = await storage.getItem('userSession')
    
    if (!sessionString) return null;
    
    const session = JSON.parse(sessionString);
    
    // Check if session is still valid
    if (!isSessionValid()) {
      await storage.removeItem('userSession')
      return null;
    }
    
    // Update timestamp on access
    updateSessionTimestamp();
    
    return session;
  } catch (error) {
    console.error('[Auth] Error getting stored session:', error)
    return null
  }
}
