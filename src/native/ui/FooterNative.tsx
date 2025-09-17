import React from 'react'
import { View, Text, Platform } from 'react-native'

export default function FooterNative() {
  return (
    <View
      style={{
        backgroundColor: '#0f0f14',
        borderTopWidth: 1,
        borderTopColor: '#1e1e25',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Text style={{ color: '#ffffff', fontWeight: '800', marginBottom: 4 }}>
        Cartoon Movie
      </Text>
      <Text style={{ color: '#9aa0a6', fontSize: 12, marginBottom: 2 }}>
        © 2025 Perpetual Pictures Private Ltd. All rights reserved.
      </Text>
      <Text style={{ color: '#9aa0a6', fontSize: 12 }}>
        Contact: contact@cartoon.movie
      </Text>
    </View>
  )
}
