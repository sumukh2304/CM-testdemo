import React, { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import StreamingCard from './StreamingCard'
import { Content, StreamingUrl } from '../services/api'

// Platform-specific imports
let ScrollView: any = null
let View: any = null
let Text: any = null
let StyleSheet: any = null

if (Platform.OS !== 'web') {
  const RN = require('react-native')
  ScrollView = RN.ScrollView
  View = RN.View
  Text = RN.Text
  StyleSheet = RN.StyleSheet
}

interface ContentRowProps {
  title: string
  items: Content[]
  streamUrls?: { [contentId: string]: StreamingUrl[] }
  featured?: boolean
  onPlay?: (contentId: string) => void
  onMoreInfo?: (contentId: string) => void
  onAddToWatchlist?: (contentId: string) => void
  onRemoveFromWatchlist?: (contentId: string) => void
  watchlistItems?: string[]
  progressMap?: { [contentId: string]: number } // 0..1 per content
}

export default function ContentRow({ 
  title, 
  items, 
  streamUrls = {}, 
  featured = false,
  onPlay,
  onMoreInfo,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  watchlistItems = [],
  progressMap = {}
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollButtons = () => {
    if (!scrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    
    const scrollAmount = 300
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
    
    setTimeout(checkScrollButtons, 300)
  }

  if (Platform.OS === 'web') {
    const [isSmall, setIsSmall] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 480 : false)
    useEffect(() => {
      const onResize = () => setIsSmall(window.innerWidth <= 480)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [])
    // Ensure scroll buttons state updates when items change
    useEffect(() => {
      setTimeout(checkScrollButtons, 0)
    }, [items])

    return (
      <div style={{ marginBottom: isSmall ? 20 : 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingInline: isSmall ? 12 : 16, marginBottom: 12 }}>
          <h2 style={{ color: 'white', fontSize: featured ? (isSmall ? 22 : 28) : (isSmall ? 18 : 20), fontWeight: 700 }}>{title}</h2>
          {featured && (
            <div style={{ backgroundColor: '#CC5500', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>Featured</div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          {/* Left scroll button */}
          {canScrollLeft && !isSmall && (
            <button
              onClick={() => scroll('left')}
              style={{
                position: 'absolute', left: 0, top: '40%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 0, width: 36, height: 72, color: 'white', cursor: 'pointer', zIndex: 10,
              }}
            >
              &#9664;
            </button>
          )}

          {/* Right scroll button */}
          {canScrollRight && !isSmall && (
            <button
              onClick={() => scroll('right')}
              style={{
                position: 'absolute', right: 0, top: '40%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 0, width: 36, height: 72, color: 'white', cursor: 'pointer', zIndex: 10,
              }}
            >
              &#9654;
            </button>
          )}

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            onScroll={checkScrollButtons}
            className="content-scroll-container scrollbar-hide"
            style={{
              overflowX: 'auto', display: 'flex', gap: isSmall ? 6 : 8, paddingInline: isSmall ? 12 : 16,
              scrollBehavior: 'smooth',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {items.map((item) => (
              <div key={item.contentId} style={{ flex: '0 0 auto' }}>
                <StreamingCard
                  content={item}
                  streamingUrls={streamUrls[item.contentId]}
                  size={featured ? (isSmall ? 'medium' : 'large') : (isSmall ? 'small' : 'medium')}
                  onPlay={onPlay}
                  onMoreInfo={onMoreInfo}
                  onAddToWatchlist={onAddToWatchlist}
                  onRemoveFromWatchlist={onRemoveFromWatchlist}
                  isInWatchlist={watchlistItems.includes(item.contentId)}
                  progressPercent={progressMap[item.contentId]}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  } else {
    // Native component
    const styles = StyleSheet.create({
      container: {
        marginBottom: 24,
      },
      titleContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
      },
      scrollContainer: {
        paddingLeft: 16,
      },
      contentContainer: {
        paddingRight: 16,
      },
    })

    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
        >
          {items.map((item) => (
            <StreamingCard 
              key={item.contentId}
              content={item} 
              streamingUrls={streamUrls?.[item.contentId]}
              size="medium"
              onPlay={onPlay}
              onMoreInfo={onMoreInfo}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              isInWatchlist={watchlistItems.includes(item.contentId)}
              progressPercent={progressMap[item.contentId]}
            />
          ))}
        </ScrollView>
      </View>
    )
  }
}

