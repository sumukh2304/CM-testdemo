import React from 'react'
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native'
import type { Content } from '../../services/api'

interface Props {
  featuredContent: Content | null
  onPlay: (id: string) => void
  onMoreInfo?: (id: string) => void
  onPrev?: () => void
  onNext?: () => void
}

export default function StreamingHeroNative({ featuredContent, onPlay, onMoreInfo, onPrev, onNext }: Props) {
  if (!featuredContent) return null
  const bg = featuredContent.thumbnailUrl

  return (
    <View style={styles.wrap}>
      <ImageBackground source={{ uri: bg }} style={styles.bg}>
        <View style={styles.overlay} />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{featuredContent.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>{(featuredContent.type || '').toUpperCase()} • {featuredContent.genre || 'Unknown'} • {featuredContent.language || ''}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => onPlay(featuredContent.contentId)} style={styles.playBtn}>
              <Text style={styles.playText}>Play</Text>
            </TouchableOpacity>
            {!!onMoreInfo && (
              <TouchableOpacity onPress={() => onMoreInfo(featuredContent.contentId)} style={styles.infoBtn}>
                <Text style={styles.infoText}>More Info</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.chevrons}>
          {!!onPrev && <TouchableOpacity onPress={onPrev} style={styles.chev}><Text style={styles.chevText}>{'<'}</Text></TouchableOpacity>}
          {!!onNext && <TouchableOpacity onPress={onNext} style={styles.chev}><Text style={styles.chevText}>{'>'}</Text></TouchableOpacity>}
        </View>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { height: 220 },
  bg: { flex: 1, resizeMode: 'cover', justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  content: { padding: 16 },
  title: { color: 'white', fontSize: 22, fontWeight: '800' },
  meta: { color: '#b0b3b8', marginTop: 4 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  playBtn: { backgroundColor: '#CC5500', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  playText: { color: 'white', fontWeight: '800' },
  infoBtn: { borderWidth: 1, borderColor: '#CC5500', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  infoText: { color: '#CC5500', fontWeight: '800' },
  chevrons: { position: 'absolute', right: 10, top: 10, flexDirection: 'row', gap: 8 },
  chev: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  chevText: { color: 'white', fontWeight: '800' },
})
