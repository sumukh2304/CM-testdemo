// User types
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'creator' | 'viewer'
  createdAt: string
  updatedAt: string
}

// Auth types
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

// Content types
export interface Content {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  duration: number
  category: string
  createdAt: string
  updatedAt: string
}

// API request/response types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  role: 'admin' | 'creator' | 'viewer'
}

export interface LoginResponse {
  user: User
  token: string
}

// Navigation types for React Navigation
export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  Creator: undefined
  Admin: undefined
  VideoPlayer: { contentId: string }
}

// Video player types
export interface VideoPlayerProps {
  src: string
  autoPlay?: boolean
  controls?: boolean
  onPlay?: () => void
  onPause?: () => void
  onError?: (error: any) => void
  onLoadStart?: () => void
  onLoad?: () => void
}
