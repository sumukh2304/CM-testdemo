import React from 'react'
import { View, StyleSheet, Image, Text } from 'react-native'

type LogoProps = {
  iconSize?: number
  fontSize?: number
  gap?: number
  compact?: boolean
}

export default function Logo({ iconSize = 40, fontSize = 18, gap = 6, compact = false }: LogoProps) {
  const tmFontSize = Math.max(10, Math.round(fontSize * 0.55))
  const tmTopOffset = -Math.round(fontSize * 0.22)

  return (
    <View style={[styles.container, { gap }]}>
      <Image
        source={require('../../assets/image.png')}
        style={[styles.iconImg, { width: iconSize, height: iconSize }]}
        accessibilityLabel="Cartoon Movie logo"
      />
      {!compact && (
        <Text style={[styles.brandText, { fontSize }] }>
          Cartoon Movie
          <Text style={[styles.tm, { fontSize: tmFontSize, top: tmTopOffset }]}>™</Text>
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconImg: {
    resizeMode: 'contain',
  },
  brandText: {
    color: '#CC5500',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tm: {
    fontSize: 10,
    fontWeight: '700',
    position: 'relative',
    top: -4,
    marginLeft: 2,
    opacity: 0.9,
  },
})

