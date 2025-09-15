import React from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'

export type ToastType = 'success' | 'error' | 'info'

interface Props {
  message: string
  type?: ToastType
  visible: boolean
}

export default function ToastNative({ message, type = 'info', visible }: Props) {
  if (!visible) return null
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.toast, typeStyles[type]]}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  )
}

const typeStyles: Record<ToastType, any> = {
  success: { borderColor: '#16a34a', backgroundColor: '#0b2b16' },
  error: { borderColor: '#ef4444', backgroundColor: '#2b1111' },
  info: { borderColor: '#CC5500', backgroundColor: '#24160e' },
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 12, right: 12, left: 12, alignItems: 'flex-end', zIndex: 50 },
  toast: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  text: { color: 'white', fontWeight: '700' },
})
