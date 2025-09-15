import { Platform } from 'react-native'
import { getCurrentSession } from '../auth'

import { config } from '../config'

const BACKEND_URL = config.backendUrl

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  role: 'admin' | 'creator' | 'viewer'
  country: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'creator' | 'viewer'
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  userId: string
  name: string
  email: string
  role: 'viewer' | 'creator' | 'admin'
  country?: string
  createdAt?: string
  message?: string
}

// Generic API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const session = await getCurrentSession()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error: ${response.status} - ${errorText}`)
  }
  
  return response.json()
}

// Auth API calls
export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  // Backend now expects email and password in JSON body
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Add Cognito password validation for mobile
export const validatePassword = async (data: LoginRequest): Promise<{ valid: boolean; message?: string }> => {
  try {
    // Make a request to validate password against Cognito
    return apiRequest<{ valid: boolean; message?: string }>('/validate-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (error: any) {
    return { valid: false, message: error.message || 'Password validation failed' }
  }
}

export const registerUser = async (data: RegisterRequest): Promise<User> => {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const getCurrentUserProfile = async (): Promise<User> => {
  return apiRequest<User>('/auth/me')
}

// Content API calls - Updated to match web API structure
export interface Content {
  contentId: string
  title: string
  description?: string
  thumbnailUrl?: string
  type: 'movie' | 'series' | 'short'
  genre?: string
  duration?: string
  ageRating?: string
  rating?: number
  status: 'published' | 'draft' | 'archived'
  createdAt: string
  updatedAt?: string
}

export interface ContentResponse {
  content: Content[]
  total: number
  page: number
  limit: number
}

export const getContent = async (params?: {
  status?: string
  limit?: number
  page?: number
  type?: string
  genre?: string
}): Promise<ContentResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.append('status', params.status)
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.type) queryParams.append('type', params.type)
  if (params?.genre) queryParams.append('genre', params.genre)
  
  const endpoint = queryParams.toString() ? `/content?${queryParams}` : '/content'
  return apiRequest<ContentResponse>(endpoint)
}

export const getContentStreaming = async (contentId: string): Promise<{ streaming: Array<{ quality: string; cloudFrontUrl: string }> }> => {
  return apiRequest<{ streaming: Array<{ quality: string; cloudFrontUrl: string }> }>(`/content/${contentId}/streaming`)
}

export const getContentById = async (contentId: string): Promise<Content> => {
  return apiRequest<Content>(`/content/${contentId}`)
}

export const createContent = async (data: Partial<Content>): Promise<Content> => {
  return apiRequest<Content>('/content', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const updateContent = async (contentId: string, data: Partial<Content>): Promise<Content> => {
  return apiRequest<Content>(`/content/${contentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const deleteContent = async (contentId: string): Promise<void> => {
  return apiRequest<void>(`/content/${contentId}`, {
    method: 'DELETE',
  })
}
