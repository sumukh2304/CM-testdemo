import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import Logo from '../../components/Logo'
import { useAuth } from '../../hooks/useAuth'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import ToastNative from '../ui/ToastNative'

export default function LoginNative({ navigation }: NativeStackScreenProps<any>) {
  const { login } = useAuth()
  const [email, setEmail] = useState<string>('alice@example.com')
  const [password, setPassword] = useState<string>('Password123!')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setToastVisible(true)
    const t = setTimeout(() => setToastVisible(false), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const onSubmit = async () => {
    try {
      setLoading(true)
      await login(email, password)
      // Do not navigate manually; NativeShell will switch stacks when auth state updates
    } catch (e: any) {
      setToast({ message: e?.message || 'Login failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <ToastNative visible={toastVisible} message={toast?.message || ''} type={toast?.type || 'info'} />
      {/* Background gradient substitute */}
      <View style={styles.background} />

      <View style={styles.card}> 
        <View style={styles.logoWrap}>
          <Logo iconSize={40} fontSize={18} />
        </View>
        {/* Title and subtitle exactly like web */}
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>Log in to explore fresh cartoons and movies.</Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#8e9196"
              autoCapitalize="none"
              inputMode="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#8e9196"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            disabled={loading}
            style={[styles.button, loading && { opacity: 0.85 }]}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New here? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
            <Text style={styles.footerLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f0f14',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    // Subtle radial/linear gradient approximation
    backgroundColor: '#0f0f14',
    opacity: 0.98,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#131318',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#1e1e25',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#b0b3b8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  form: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#18181b',
    color: 'white',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24242a',
  },
  button: {
    backgroundColor: '#CC5500',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#CC5500',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  footerRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#b0b3b8',
  },
  footerLink: {
    color: '#CC5500',
    fontWeight: '700',
  },
})
