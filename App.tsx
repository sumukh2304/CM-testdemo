import React, { useEffect } from 'react'
import { Platform, View, Text } from 'react-native'
import { validateConfig } from './src/config'

// Platform-specific apps
import WebApp from './src/web/WebApp'
import NativeApp from './src/native/NativeApp'

export default function App() {
  useEffect(() => {
    // Validate configuration on app start
    validateConfig()

    // Ensure correct title on web
    if (Platform.OS === 'web') {
      try {
        document.title = 'Cartoon Movie'
      } catch {}
    }
  }, [])

  try {
    // Route to appropriate app based on platform
    if (Platform.OS === 'web') {
      return <WebApp />
    } else {
      return <NativeApp />
    }
  } catch (error) {
    console.error('❌ Error rendering App:', error)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f14' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Error loading app</Text>
        <Text style={{ color: 'red', fontSize: 14, marginTop: 10 }}>{String(error)}</Text>
      </View>
    )
  }
}


