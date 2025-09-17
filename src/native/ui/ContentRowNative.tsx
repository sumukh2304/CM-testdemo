import React, { useEffect, useRef, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
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
  const ref = useRef<FlatList<Content>>(null)
  const [offset, setOffset] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Gentle auto-slide when idle
  useEffect(() => {
    if (!items || items.length <= 1) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      try {
        const width = 232 // snap interval
        const maxOffset = Math.max(0, items.length * width - width * 2)
        const next = offset + width
        const newOffset = next > maxOffset ? 0 : next
        ref.current?.scrollToOffset({ offset: newOffset, animated: true })
        setOffset(newOffset)
      } catch {}
    }, 3500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [items, offset])

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
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
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 4 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={232} // card width (220) + gap (12)
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8 },
  title: { color: 'white', fontWeight: '800', fontSize: 16 },
  
})
