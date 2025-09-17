import React, { useRef } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import type { Content, StreamingUrl } from '../../services/api'

interface Props {
  item: Content
  onPlay: (contentId: string) => void
  onMoreInfo?: (contentId: string) => void
  onAddToWatchlist?: (contentId: string) => void
  onRemoveFromWatchlist?: (contentId: string) => void
  inWatchlist?: boolean
  progress?: number
}

export default function ContentCardNative({ item, onPlay, onMoreInfo, onAddToWatchlist, onRemoveFromWatchlist, inWatchlist, progress }: Props) {
  const scale = useRef(new Animated.Value(1)).current

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 20, bounciness: 6 }).start()
  }
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start()
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}> 
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPlay(item.contentId)}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
        {typeof progress === 'number' && progress > 0 && (
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBar, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
          </View>
        )}
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
          <Text numberOfLines={1} style={styles.meta}>{(item.type || '').toUpperCase()} • {item.genre || 'Unknown'}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onPlay(item.contentId)} style={styles.playBtn}>
            <Text style={styles.playText}>Play</Text>
          </TouchableOpacity>
          {inWatchlist ? (
            <TouchableOpacity onPress={() => onRemoveFromWatchlist && onRemoveFromWatchlist(item.contentId)} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onAddToWatchlist && onAddToWatchlist(item.contentId)} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Watchlist</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { width: 220, marginRight: 12, backgroundColor: '#18181b', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#24242a', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  thumb: { width: '100%', height: 124, backgroundColor: '#222', resizeMode: 'cover' },
  info: { paddingHorizontal: 10, paddingVertical: 8 },
  title: { color: 'white', fontWeight: '700' },
  meta: { color: '#9aa0a6', marginTop: 2, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10 },
  playBtn: { backgroundColor: '#CC5500', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  playText: { color: 'white', fontWeight: '700' },
  secondaryBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CC5500' },
  secondaryText: { color: '#CC5500', fontWeight: '700' },
  progressBarWrap: { height: 3, backgroundColor: '#2a2a2a' },
  progressBar: { height: 3, backgroundColor: '#CC5500' },
})
