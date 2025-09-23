import axios from 'axios'
import { BACKEND_URL } from '../config'

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
})

// Add request interceptor to handle headers properly
api.interceptors.request.use((config) => {
  // Only set Content-Type for non-GET requests to avoid unnecessary CORS preflight
  const method = (config.method || 'get').toLowerCase()
  if (method !== 'get') {
    const hdrs: any = config.headers || {}
    // Axios v1 can provide AxiosHeaders (with set) or a plain object
    if (typeof hdrs.set === 'function') {
      hdrs.set('Content-Type', 'application/json')
    } else {
      hdrs['Content-Type'] = 'application/json'
      config.headers = hdrs
    }
  }
  return config
})

export type BackendUser = {
  userId: string
  name: string
  email: string
  role: 'viewer' | 'creator' | 'admin'
  country?: string
  approved?: 'Yes' | 'No' | string
}

export const createBackendUser = (payload: {
  userId?: string
  name: string
  email: string
  role: 'viewer' | 'creator' | 'admin'
  country?: string
}) => api.post('/users', payload).then(r => r.data)

export const getContent = (params?: { type?: string; status?: string; genre?: string; limit?: number; offset?: number }) =>
  api.get('/content', { params }).then(r => r.data)

export const createContent = (payload: any) => api.post('/content', payload).then(r => r.data)

// Genres
export const getGenres = () => api.get('/genres').then(r => r.data)
export const createGenre = (genre: string) => api.post('/genres', { genre }).then(r => r.data)

// Languages
export const getLanguages = () => api.get('/languages').then(r => r.data)
export const createLanguage = (lang: string) => api.post('/languages', { lang }).then(r => r.data)

// Streaming for a content (updated schema)
export const createStreaming = (contentId: string, payload: {
  resolution_1080p?: string
  resolution_720p?: string
  resolution_540p?: string
  resolution_360p?: string
  resolution_270p?: string
}) => api.post(`/content/${contentId}/streaming`, payload).then(r => r.data)

// S3 presigned upload
export const getPresignedUpload = (type: 'video' | 'thumbnail', filename: string, contentType: string) =>
  api.post('/upload/presign', { type, filename, contentType }).then(r => r.data)

// Creator analytics
export const getCreatorAnalytics = (userId: string, days?: number) =>
  api.get(`/creators/${userId}/analytics`, { params: days ? { days } : undefined }).then(r => r.data)

export const loginByEmail = (email: string) =>
  api.get('/users').then(r => {
    const list = r.data?.users || []
    const found = list.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (!found) throw new Error('User not found')
    return found
  })

// Creator approval status
export const getCreatorApproval = (userId: string): Promise<{ userId: string; approved: 'Yes' | 'No' | string }> =>
  api.get(`/creators/${userId}/approval`).then(r => r.data)

