import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours
const SESSION_TIMESTAMP_KEY = 'cartoonflix_session_timestamp'
const AUTH_TOKEN_KEY = 'authToken'
const USER_DATA_KEY = 'user'
const SESSION_KEY = 'cartoonflix_session'

// Note: Avoid using NativeEventEmitter without a proper native module that
// implements addListener/removeListeners. We keep native session checks simple
// and provide a no-op activity listener to prevent warnings.

export interface SessionData {
  user: any
  token: string
  timestamp: number
}

class SessionManagerNative {
  private async isSessionValid(): Promise<boolean> {
    try {
      const tsStr = await AsyncStorage.getItem(SESSION_TIMESTAMP_KEY)
      if (!tsStr) return false
      const sessionTime = parseInt(tsStr || '0', 10)
      const timeDiff = Date.now() - sessionTime
      return timeDiff < SESSION_TIMEOUT
    } catch {
      return false
    }
  }

  private async updateSessionTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString())
    } catch {}
  }

  public async setSession(user: any, token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token)
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
      await AsyncStorage.setItem(SESSION_KEY, 'active')
      await this.updateSessionTimestamp()
    } catch {}
  }

  public async getSession(): Promise<SessionData | null> {
    try {
      const [token, userData, valid] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
        this.isSessionValid(),
      ])
      if (!token || !userData || !valid) {
        await this.clearSession()
        return null
      }
      await this.updateSessionTimestamp()
      return { user: JSON.parse(userData), token, timestamp: Date.now() }
    } catch {
      return null
    }
  }

  public async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        USER_DATA_KEY,
        SESSION_KEY,
        SESSION_TIMESTAMP_KEY,
      ])
    } catch {}
  }

  public async isAuthenticated(): Promise<boolean> {
    const s = await this.getSession()
    return s !== null
  }

  public setupActivityListener(): () => void {
    // No-op for now on native; hook into AppState or gestures if needed
    return () => {}
  }
}

export const sessionManager = new SessionManagerNative()
