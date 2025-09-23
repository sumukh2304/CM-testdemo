// Environment configuration for React Native + React Native Web
// This file handles environment variables across all platforms

interface Config {
  BACKEND_URL: string
  AWS_REGION: string
  COGNITO_USER_POOL_ID: string
  COGNITO_CLIENT_ID: string
  COGNITO_CLIENT_SECRET?: string
}

// Get environment variables safely across platforms
const getEnvVar = (key: string): string | undefined => {
  // For React Native Web, try to access environment variables
  // Since .env files aren't automatically loaded, we'll use a different approach
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  
  // Fallback for other environments
  return undefined
}



// Helper: normalize base URL (remove trailing slashes)
const normalizeBase = (u?: string) => {
  if (!u) return ''
  return u.replace(/\/+$/, '')
}

// Build configuration from environment variables or hardcoded values
export const config: Config = {
  BACKEND_URL: (() => {
    const fromEnv = getEnvVar('VITE_BACKEND_URL') || getEnvVar('EXPO_PUBLIC_BACKEND_URL')
    if (fromEnv) return normalizeBase(fromEnv)
    // Use Lambda Function URL instead of API Gateway
    return normalizeBase('https://w3w905927g.execute-api.us-east-1.amazonaws.com/prod')
  })(),
  
  AWS_REGION: getEnvVar('VITE_AWS_REGION') || 
              getEnvVar('EXPO_PUBLIC_AWS_REGION') || 
              'us-east-1',
  
  COGNITO_USER_POOL_ID: getEnvVar('VITE_COGNITO_USER_POOL_ID') || 
                        getEnvVar('EXPO_PUBLIC_COGNITO_USER_POOL_ID') || 
                        'us-east-1_rvjiyRABU',
  
  COGNITO_CLIENT_ID: getEnvVar('VITE_COGNITO_CLIENT_ID') || 
                     getEnvVar('EXPO_PUBLIC_COGNITO_CLIENT_ID') || 
                     '3s8eta17u7a6a9en57ubmdktmo',
  
  COGNITO_CLIENT_SECRET: getEnvVar('VITE_COGNITO_CLIENT_SECRET') || 
                         getEnvVar('EXPO_PUBLIC_COGNITO_CLIENT_SECRET') || 
                         '100ss4hml00v5g3efg0jkkacbj122uouh3momt19gvpbtac5nrku',
}

// Validation
export const validateConfig = (): void => {
  console.log('Config validation - Current config:', config)
  
  const required = ['COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID']
  const missing = required.filter(key => !config[key as keyof Config])
  
  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing)
    console.warn('Please set these in your .env file or environment')
  } else {
    console.log('✅ Configuration validation passed')
  }
}

// Export individual values for convenience
export const {
  BACKEND_URL,
  AWS_REGION,
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
} = config
