import React, { useEffect, useRef } from 'react'
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Content } from '../../services/api'

interface Props {
  featuredContent: Content | null
  onPlay: (id: string) => void
  onMoreInfo?: (id: string) => void
  onPrev?: () => void
  onNext?: () => void
}

export default function StreamingHeroNative({ featuredContent, onPlay, onMoreInfo, onPrev, onNext }: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const prevId = useRef<string | null>(null)

  useEffect(() => {
    if (!featuredContent) return
    // Crossfade on change
    if (prevId.current !== featuredContent.contentId) {
      opacity.setValue(0)
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }).start()
      prevId.current = featuredContent.contentId
    }
  }, [featuredContent])

  if (!featuredContent) return null
  const bg = featuredContent.thumbnailUrl

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ flex: 1, opacity }}>
        <ImageBackground source={{ uri: bg }} style={styles.bg}>
          <View style={styles.overlay} />
          <View style={styles.content}>
            <Text style={styles.kicker} numberOfLines={1}>{(featuredContent.type || '').toUpperCase()} • {featuredContent.genre || 'Unknown'} • {featuredContent.language || ''}</Text>
            <Text style={styles.title} numberOfLines={1}>{featuredContent.title}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => onPlay(featuredContent.contentId)} style={styles.playBtn}>
                <Ionicons name="play" size={18} color="#000" />
                <Text style={styles.playText}>Play</Text>
              </TouchableOpacity>
              {!!onMoreInfo && (
                <TouchableOpacity onPress={() => onMoreInfo(featuredContent.contentId)} style={styles.infoBtn}>
                  <Ionicons name="information-circle-outline" size={18} color="#CC5500" />
                  <Text style={styles.infoText}>More Info</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Chevrons removed for cleaner premium look */}
        </ImageBackground>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { height: 240 },
  bg: { flex: 1, resizeMode: 'cover', justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  content: { padding: 18 },
  kicker: { color: '#ffb27a', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  title: { color: 'white', fontSize: 24, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  playBtn: { backgroundColor: '#FF8C3A', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8 },
  playText: { color: '#000', fontWeight: '900' },
  infoBtn: { borderWidth: 1, borderColor: '#CC5500', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: '#CC5500', fontWeight: '800' },
  
})
