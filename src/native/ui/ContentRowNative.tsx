import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import type { Content, StreamingUrl } from '../../services/api'
import ContentCardNative from './ContentCardNative'

interface Props {
  title: string
  items: Content[]
  onPlay: (id: string) => void
  onMoreInfo?: (id: string) => void
  onAddToWatchlist?: (id: string) => void
  onRemoveFromWatchlist?: (id: string) => void
  watchlistItems?: string[]
  progressMap?: { [id: string]: number }
}

export default function ContentRowNative({ title, items, onPlay, onMoreInfo, onAddToWatchlist, onRemoveFromWatchlist, watchlistItems = [], progressMap = {} }: Props) {
  const ref = React.useRef<FlatList<Content>>(null)

  const scroll = (delta: number) => {
    try {
      ref.current?.scrollToOffset({ offset: Math.max(0, (ref.current as any)?._scrollMetrics?.offset + delta), animated: true })
    } catch {}
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => scroll(-300)} style={styles.chev}><Text style={styles.chevText}>{'<'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => scroll(300)} style={styles.chev}><Text style={styles.chevText}>{'>'}</Text></TouchableOpacity>
        </View>
      </View>
      <FlatList
        ref={ref}
        data={items}
        keyExtractor={(i) => i.contentId}
        renderItem={({ item }) => (
          <ContentCardNative
            item={item}
            onPlay={onPlay}
            onMoreInfo={onMoreInfo}
            onAddToWatchlist={onAddToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            inWatchlist={watchlistItems.includes(item.contentId)}
            progress={progressMap[item.contentId]}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8 },
  title: { color: 'white', fontWeight: '800', fontSize: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  chev: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#24242a', alignItems: 'center', justifyContent: 'center' },
  chevText: { color: '#b0b3b8', fontWeight: '700' },
})
