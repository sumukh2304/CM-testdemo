import { Platform } from 'react-native';

// Session management constants
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_TIMESTAMP_KEY = 'cartoonflix_session_timestamp';
const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'user';
const SESSION_KEY = 'cartoonflix_session';

export interface SessionData {
  user: any;
  token: string;
  timestamp: number;
}

class SessionManager {
  private isSessionValid(): boolean {
    if (Platform.OS === 'web') {
      const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
      if (!timestamp) return false;
      
      const sessionTime = parseInt(timestamp);
      const currentTime = Date.now();
      const timeDiff = currentTime - sessionTime;
      
      return timeDiff < SESSION_TIMEOUT;
    }
    return true; // For mobile, assume valid for now
  }

  private updateSessionTimestamp(): void {
    if (Platform.OS === 'web') {
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    }
  }

  public setSession(user: any, token: string): void {
    if (Platform.OS === 'web') {
      console.log('💾 Setting session:', { user, token });
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      localStorage.setItem(SESSION_KEY, 'active');
      this.updateSessionTimestamp();
      console.log('✅ Session set successfully');
    }
  }

  public getSession(): SessionData | null {
    if (Platform.OS === 'web') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userData = localStorage.getItem(USER_DATA_KEY);
      const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
      
      console.log('🔍 Session check:', {
        hasToken: !!token,
        hasUserData: !!userData,
        hasTimestamp: !!timestamp,
        timestamp: timestamp,
        isSessionValid: this.isSessionValid()
      });
      
      if (!token || !userData || !this.isSessionValid()) {
        console.log('❌ Session invalid, clearing...');
        this.clearSession();
        return null;
      }
      
      // Update timestamp on access
      this.updateSessionTimestamp();
      
      const session = {
        user: JSON.parse(userData),
        token,
        timestamp: Date.now()
      };
      
      console.log('✅ Valid session found:', session);
      return session;
    }
    return null;
  }

  public clearSession(): void {
    if (Platform.OS === 'web') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    }
  }

  public isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  public refreshSession(): void {
    if (Platform.OS === 'web' && this.isSessionValid()) {
      this.updateSessionTimestamp();
    }
  }

  // Auto-refresh session on user activity
  public setupActivityListener(): () => void {
    if (Platform.OS === 'web') {
      const handleActivity = () => {
        if (this.isSessionValid()) {
          this.updateSessionTimestamp();
        } else {
          this.clearSession();
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('sessionExpired'));
        }
      };

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
    return () => {};
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
