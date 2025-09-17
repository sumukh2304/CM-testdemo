import { Platform } from 'react-native'

// Environment configuration
export const config = {
  // Backend URL based on platform
  backendUrl: Platform.OS === 'web' 
    ? process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'
    : 'http://192.168.1.6:8000', // Mobile uses network IP
  
  // AWS Cognito configuration
  cognito: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || '',
  },
  
  // Video streaming configuration
  video: {
    // HLS proxy endpoint for Shaka Player
    hlsProxyUrl: Platform.OS === 'web' 
      ? `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/proxy-hls`
      : `http://192.168.1.6:8000/proxy-hls`,
    
    // Default video sources for testing
    defaultSources: {
      bigBuckBunny: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      sintel: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
  },
  
  // App configuration
  app: {
    name: 'Cartoon Movie',
    version: '1.0.0',
    supportEmail: 'support@cartoonmovie.com',
  },
  
  // Feature flags
  features: {
    enableRegistration: true,
    enableSocialLogin: false,
    enableOfflineMode: Platform.OS !== 'web',
    enablePushNotifications: Platform.OS !== 'web',
  },
}

// Validation helper
export const validateConfig = () => {
  const required = [
    'cognito.userPoolId',
    'cognito.userPoolWebClientId',
  ]
  
  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], config)
    return !value
  })
  
  if (missing.length > 0) {
    console.warn('[Config] Missing required configuration:', missing)
  }
  
  return missing.length === 0
}

export default config
