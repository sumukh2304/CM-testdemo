// Copy this file to config.ts and fill in your actual values

export const config = {
  // Backend API URL
  BACKEND_URL: 'http://localhost:8000',
  
  // AWS Cognito Configuration
  AWS_REGION: 'us-east-1',
  COGNITO_USER_POOL_ID: 'your_user_pool_id_here',
  COGNITO_CLIENT_ID: 'your_client_id_here',
  COGNITO_CLIENT_SECRET: 'your_client_secret_here', // Optional
}

// For web (Vite) environment variables:
// Create a .env file in the root directory with:
// VITE_BACKEND_URL=http://localhost:8000
// VITE_AWS_REGION=us-east-1
// VITE_COGNITO_USER_POOL_ID=your_user_pool_id
// VITE_COGNITO_CLIENT_ID=your_client_id
// VITE_COGNITO_CLIENT_SECRET=your_client_secret

// For mobile (Expo) environment variables:
// Use the same .env file with EXPO_PUBLIC_ prefix:
// EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
// EXPO_PUBLIC_AWS_REGION=us-east-1
// EXPO_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
// EXPO_PUBLIC_COGNITO_CLIENT_ID=your_client_id
// EXPO_PUBLIC_COGNITO_CLIENT_SECRET=your_client_secret

