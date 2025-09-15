import 'react-native-get-random-values'
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js'
import CryptoJS from 'react-native-crypto-js'
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from '../config'

// Mobile-compatible secret hash computation using CryptoJS
const computeSecretHash = (username: string) => {
  if (!COGNITO_CLIENT_SECRET) return undefined
  const message = username + COGNITO_CLIENT_ID
  const hash = CryptoJS.HmacSHA256(message, COGNITO_CLIENT_SECRET)
  return CryptoJS.enc.Base64.stringify(hash)
}

export const getUserPool = () => {
  if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    const msg = 'Cognito not configured: set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in config'
    console.error(msg, {
      hasUserPoolId: Boolean(COGNITO_USER_POOL_ID),
      hasClientId: Boolean(COGNITO_CLIENT_ID),
    })
    throw new Error(msg)
  }
  const poolConfig: any = { UserPoolId: COGNITO_USER_POOL_ID, ClientId: COGNITO_CLIENT_ID }
  return new CognitoUserPool(poolConfig)
}

export const signUp = (
  email: string,
  password: string,
  role: 'viewer' | 'creator',
  name?: string,
  username?: string,
) =>
  new Promise((resolve, reject) => {
    const pool = getUserPool()
    // Send only minimal attributes to avoid schema issues
    const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })]
    
    pool.signUp(email, password, attributes, [], (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })

export const signIn = (email: string, password: string) =>
  new Promise((resolve, reject) => {
    console.log('[Cognito Mobile] Starting authentication for:', email)
    
    try {
      const pool = getUserPool()
      const user = new CognitoUser({ Username: email, Pool: pool })
      const authDetails = new AuthenticationDetails({ Username: email, Password: password })
      
      user.authenticateUser(authDetails, {
        onSuccess: (result) => {
          console.log('[Cognito Mobile] Authentication successful')
          resolve({ user, result })
        },
        onFailure: (err) => {
          console.error('[Cognito Mobile] Authentication failed:', err)
          reject(err)
        },
        mfaRequired: () => {
          console.error('[Cognito Mobile] MFA not supported')
          reject(new Error('MFA not supported in this demo'))
        },
      })
    } catch (error) {
      console.error('[Cognito Mobile] Authentication error:', error)
      reject(error)
    }
  })

export const getSessionToken = () =>
  new Promise<string | null>((resolve) => {
    try {
      const pool = getUserPool()
      const current = pool.getCurrentUser()
      if (!current) return resolve(null)
      
      current.getSession((err: any, session: any) => {
        if (err || !session) return resolve(null)
        resolve(session.getIdToken().getJwtToken())
      })
    } catch (error) {
      console.error('[Cognito Mobile] Get session error:', error)
      resolve(null)
    }
  })

export const confirmSignUp = (email: string, code: string) =>
  new Promise((resolve, reject) => {
    try {
      const pool = getUserPool()
      const user = new CognitoUser({ Username: email, Pool: pool })
      user.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    } catch (error) {
      console.error('[Cognito Mobile] Confirm signup error:', error)
      reject(error)
    }
  })

export const resendConfirmation = (email: string) =>
  new Promise((resolve, reject) => {
    try {
      const pool = getUserPool()
      const user = new CognitoUser({ Username: email, Pool: pool })
      user.resendConfirmationCode((err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    } catch (error) {
      console.error('[Cognito Mobile] Resend confirmation error:', error)
      reject(error)
    }
  })
