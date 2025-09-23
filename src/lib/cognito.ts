import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js'
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { BACKEND_URL, AWS_REGION, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from '../config'

// Helpers for SECRET_HASH when a client secret is configured
const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

const computeSecretHash = async (username: string) => {
  if (!COGNITO_CLIENT_SECRET) return undefined
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(COGNITO_CLIENT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const data = new TextEncoder().encode(username + COGNITO_CLIENT_ID)
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return toBase64(signature)
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
    // If client secret present, use AWS SDK v3 with SECRET_HASH
    if (COGNITO_CLIENT_SECRET) {
      ;(async () => {
        try {
          const secretHash = await computeSecretHash(email)
          const client = new CognitoIdentityProviderClient({ region: AWS_REGION })
          const res = await client.send(new SignUpCommand({
            ClientId: COGNITO_CLIENT_ID!,
            Username: email,
            Password: password,
            SecretHash: secretHash,
            // Send only minimal attributes to avoid schema issues
            UserAttributes: [
              { Name: 'email', Value: email },
            ],
          }))
          resolve(res)
        } catch (e) {
          reject(e)
        }
      })()
      return
    }

    // Otherwise, use the JS SDK without secret
    const pool = getUserPool()
    // Send only minimal attributes
    const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })]
    pool.signUp(email, password, attributes, [], (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })

export const signIn = (email: string, password: string) =>
  new Promise((resolve, reject) => {
    // With client secret: use AWS SDK v3 InitiateAuth and compute SECRET_HASH
    if (COGNITO_CLIENT_SECRET) {
      ;(async () => {
        try {
          const secretHash = await computeSecretHash(email)
          const client = new CognitoIdentityProviderClient({ region: AWS_REGION })
          const res = await client.send(new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: COGNITO_CLIENT_ID!,
            AuthParameters: {
              USERNAME: email,
              PASSWORD: password,
              SECRET_HASH: secretHash!,
            },
          }))
          resolve(res)
        } catch (e) {
          reject(e)
        }
      })()
      return
    }

    const pool = getUserPool()
    const user = new CognitoUser({ Username: email, Pool: pool })
    const authDetails = new AuthenticationDetails({ Username: email, Password: password })
    user.authenticateUser(authDetails, {
      onSuccess: (result) => resolve({ user, result }),
      onFailure: (err) => reject(err),
      mfaRequired: () => reject(new Error('MFA not supported in this demo')),
    })
  })

export const getSessionToken = () =>
  new Promise<string | null>((resolve) => {
    const pool = getUserPool()
    const current = pool.getCurrentUser()
    if (!current) return resolve(null)
    current.getSession((err: any, session: any) => {
      if (err || !session) return resolve(null)
      resolve(session.getIdToken().getJwtToken())
    })
  })

export const confirmSignUp = (email: string, code: string) =>
  new Promise((resolve, reject) => {
    if (COGNITO_CLIENT_SECRET) {
      ;(async () => {
        try {
          const secretHash = await computeSecretHash(email)
          const client = new CognitoIdentityProviderClient({ region: AWS_REGION })
          const res = await client.send(new ConfirmSignUpCommand({
            ClientId: COGNITO_CLIENT_ID!,
            Username: email,
            ConfirmationCode: code,
            SecretHash: secretHash,
          }))
          resolve(res)
        } catch (e) {
          reject(e)
        }
      })()
      return
    }
    const pool = getUserPool()
    const user = new CognitoUser({ Username: email, Pool: pool })
    user.confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })

export const resendConfirmation = (email: string) =>
  new Promise((resolve, reject) => {
    if (COGNITO_CLIENT_SECRET) {
      ;(async () => {
        try {
          const secretHash = await computeSecretHash(email)
          const client = new CognitoIdentityProviderClient({ region: AWS_REGION })
          const res = await client.send(new ResendConfirmationCodeCommand({
            ClientId: COGNITO_CLIENT_ID!,
            Username: email,
            SecretHash: secretHash,
          }))
          resolve(res)
        } catch (e) {
          reject(e)
        }
      })()
      return
    }
    const pool = getUserPool()
    const user = new CognitoUser({ Username: email, Pool: pool })
    user.resendConfirmationCode((err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })

export const getCurrentUser = () =>
  new Promise<any>((resolve, reject) => {
    const pool = getUserPool()
    const current = pool.getCurrentUser()
    if (!current) return resolve(null)
    
    current.getSession((err: any, session: any) => {
      if (err || !session) return resolve(null)
      
      current.getUserAttributes((err: any, attributes: any) => {
        if (err) return reject(err)
        
        const userInfo: any = { sub: current.getUsername() }
        attributes?.forEach((attr: any) => {
          userInfo[attr.getName()] = attr.getValue()
        })
        
        resolve(userInfo)
      })
    })
  })

