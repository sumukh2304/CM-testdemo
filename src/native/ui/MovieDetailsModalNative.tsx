import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native'
import type { Content } from '../../services/api'

interface Props {
  visible: boolean
  content: Content | null
  onClose: () => void
  onPlay: (id: string) => void
  onAddToWatchlist?: (id: string) => void
  onRemoveFromWatchlist?: (id: string) => void
  inWatchlist?: boolean
}

export default function MovieDetailsModalNative({ visible, content, onClose, onPlay, onAddToWatchlist, onRemoveFromWatchlist, inWatchlist }: Props) {
  if (!content) return null
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView>
            {!!content.thumbnailUrl && (
              <Image source={{ uri: content.thumbnailUrl }} style={styles.banner} />
            )}
            <View style={styles.body}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.meta}>{(content.type || '').toUpperCase()} • {content.genre || 'Unknown'} • {content.language || ''}</Text>
              {!!content.duration && (<Text style={styles.meta}>Duration: {content.duration}</Text>)}
              {!!content.ageRating && (<Text style={styles.meta}>Rating: {content.ageRating}</Text>)}
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.secondaryBtn}><Text style={styles.secondaryText}>Close</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => onPlay(content.contentId)} style={styles.playBtn}><Text style={styles.playText}>Play</Text></TouchableOpacity>
            {inWatchlist ? (
              <TouchableOpacity onPress={() => onRemoveFromWatchlist && onRemoveFromWatchlist(content.contentId)} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => onAddToWatchlist && onAddToWatchlist(content.contentId)} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Watchlist</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 640, borderRadius: 16, backgroundColor: '#121216', borderWidth: 1, borderColor: '#1f1f25', overflow: 'hidden' },
  banner: { width: '100%', height: 200, backgroundColor: '#222' },
  body: { padding: 16 },
  title: { color: 'white', fontSize: 20, fontWeight: '800' },
  meta: { color: '#b0b3b8', marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#1f1f25' },
  playBtn: { backgroundColor: '#CC5500', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  playText: { color: 'white', fontWeight: '800' },
  secondaryBtn: { borderWidth: 1, borderColor: '#CC5500', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  secondaryText: { color: '#CC5500', fontWeight: '800' },
})
