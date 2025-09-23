import axios from 'axios';
import { BACKEND_URL } from '../config';

const API_BASE_URL = BACKEND_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = (config.url || '').toLowerCase();

    // Do NOT attach auth header for public endpoints
    const isPublic =
      url.startsWith('/content') ||
      url.startsWith('/genres') ||
      url.startsWith('/languages') ||
      url === '/login' ||
      url === '/register' ||
      url === '/users' && config.method?.toLowerCase() === 'post';

    // Set Content-Type only for non-GET requests to avoid CORS preflight on GET
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get') {
      config.headers = {
        ...(config.headers || {}),
        'Content-Type': 'application/json',
      } as any;
    } else if (config.headers && 'Content-Type' in config.headers) {
      try { delete (config.headers as any)['Content-Type']; } catch {}
    }

    // Avoid attaching Authorization for GET watchlist/watch-history/recommendations to prevent CORS preflight on web
    const noAuthForThisGet = method === 'get' && /\/users\/[^/]+\/(watchlist|watch-history|recommendations)$/.test(url)
    if (token && !isPublic && !noAuthForThisGet) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  } catch {
    return config;
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do NOT hard-redirect on 401 here; let UI handle it based on auth context
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } catch {}
    }
    return Promise.reject(error);
  }
);

export interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  country: string;
  createdAt: string;
}

export interface Content {
  contentId: string;
  title: string;
  type: string;
  status: string;
  releaseDate: string;
  ageRating: string;
  duration: string;
  expirationDate: string;
  thumbnailUrl: string;
  genre: string;
  language: string;
  uploadedBy: string;
  description?: string;
  rating?: number;
  approved?: 'Yes' | 'No' | string;
}

export interface StreamingUrl {
  streamId: string;
  contentId: string;
  resolutions: {
    '1080p'?: string;
    '720p'?: string;
    '540p'?: string;
    '360p'?: string;
    '270p'?: string;
    // Backwards compatibility
    '480p'?: string;
  };
  createdAt?: string;
  contentTitle?: string;
  contentType?: string;
}

export interface WatchlistItem {
  contentId: string;
  title: string;
  type: string;
  status: string;
  genre: string;
  language: string;
  addedAt: string;
}

export interface WatchHistoryItem {
  watchId: string;
  contentId: string;
  title: string;
  type: string;
  status: string;
  lastWatched: string;
  lastPosition: string;
}

export interface Recommendation {
  recId: string;
  contentId: string;
  title: string;
  type: string;
  status: string;
  genre: string;
  language: string;
  score: number;
  reason: string;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },
  
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    country?: string;
  }): Promise<User> => {
    const response = await api.post('/users', {
      name: userData.name,
      email: userData.email,
      role: (userData.role || 'viewer'),
      country: userData.country,
    });
    return response.data;
  },
  
  getProfile: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
};

// Content API
export const contentAPI = {
  getContent: async (params?: {
    type?: string;
    status?: string;
    genre?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ content: Content[]; count: number; limit: number; offset: number }> => {
    const response = await api.get('/content', { params });
    return response.data;
  },
  
  getContentById: async (contentId: string): Promise<Content> => {
    const response = await api.get(`/content/${contentId}`);
    return response.data;
  },
  
  getStreamingUrls: async (contentId: string): Promise<{
    contentId: string;
    streaming: StreamingUrl[];
    count: number;
  }> => {
    const response = await api.get(`/content/${contentId}/streaming`);
    return response.data;
  }
};

// Genres and Languages API
export const metadataAPI = {
  getGenres: async (): Promise<{ genres: Array<{ genreId: string; genre: string }>; count: number }> => {
    const response = await api.get('/genres');
    return response.data;
  },
  
  getLanguages: async (): Promise<{ languages: Array<{ langId: string; lang: string }>; count: number }> => {
    const response = await api.get('/languages');
    return response.data;
  }
};

// User-specific APIs
export const userAPI = {
  getWatchlist: async (userId: string): Promise<{
    userId: string;
    watchlist: WatchlistItem[];
    count: number;
  }> => {
    const response = await api.get(`/users/${userId}/watchlist`);
    return response.data;
  },
  
  getWatchHistory: async (userId: string): Promise<{
    userId: string;
    history: WatchHistoryItem[];
    count: number;
  }> => {
    const response = await api.get(`/users/${userId}/watch-history`);
    return response.data;
  },

  upsertWatchHistory: async (payload: { userId: string; contentId: string; lastPosition: string }): Promise<{
    watchId: string;
    userId: string;
    contentId: string;
    lastPosition: string;
    lastWatched: string;
    status: 'created' | 'updated';
  }> => {
    const response = await api.post('/watch-history', payload);
    return response.data;
  },
  
  getRecommendations: async (userId: string): Promise<{
    userId: string;
    recommendations: Recommendation[];
    count: number;
  }> => {
    const response = await api.get(`/users/${userId}/recommendations`);
    return response.data;
  },
  
  addToWatchlist: async (userId: string, contentId: string): Promise<{ userId: string; contentId: string; status: string }> => {
    const response = await api.post(`/users/${userId}/watchlist`, { contentId });
    return response.data;
  },

  removeFromWatchlist: async (userId: string, contentId: string): Promise<void> => {
    await api.delete(`/users/${userId}/watchlist/${contentId}`);
  },
  
  getProfiles: async (userId: string): Promise<{
    userId: string;
    profiles: Array<{ profileId: string; name: string; age: number }>;
    count: number;
  }> => {
    const response = await api.get(`/users/${userId}/profiles`);
    return response.data;
  }
};

export default api;
