import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { contentAPI, userAPI, Content } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import NavigationNative from '../ui/NavigationNative'
import StreamingHeroNative from '../ui/StreamingHeroNative'
import ContentRowNative from '../ui/ContentRowNative'
import MovieDetailsModalNative from '../ui/MovieDetailsModalNative'
import FooterNative from '../ui/FooterNative'

export default function DashboardNative() {
  const navigation = useNavigation() as any
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [allContent, setAllContent] = useState<Content[]>([])
  const [featured, setFeatured] = useState<Content | null>(null)
  const [featuredList, setFeaturedList] = useState<Content[]>([])
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [watchlistItems, setWatchlistItems] = useState<string[]>([])
  const [watchHistoryIds, setWatchHistoryIds] = useState<string[]>([])
  const [progressMap, setProgressMap] = useState<{ [id: string]: number }>({})
  const [genreCategories, setGenreCategories] = useState<{ [genre: string]: Content[] }>({})
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsItem, setDetailsItem] = useState<Content | null>(null)

  const loadContent = async () => {
    try {
      setLoading(true)
      const res = await contentAPI.getContent({ limit: 100, offset: 0 })
      const content = (res.content || []).filter((c: any) => (c.approved || 'Yes') === 'Yes')
      setAllContent(content)

      if (content.length > 0) {
        const feats = content.slice(0, 5)
        setFeaturedList(feats)
        setFeatured(feats[0] || null)

        const genreCount: { [g: string]: number } = {}
        for (const c of content) {
          const g = (c.genre || '').trim()
          if (!g) continue
          genreCount[g] = (genreCount[g] || 0) + 1
        }

        const topGenres = Object.keys(genreCount).sort((a, b) => genreCount[b] - genreCount[a]).slice(0, 4)
        const categories: { [genre: string]: Content[] } = {}
        for (const g of topGenres) {
          categories[g] = content.filter(c => (c.genre || '').trim() === g).slice(0, 20)
        }
        setGenreCategories(categories)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async () => {
    if (!user?.userId) return
    try {
      const wl = await userAPI.getWatchlist(user.userId)
      setWatchlistItems(wl.watchlist.map(w => w.contentId))

      const hist = await userAPI.getWatchHistory(user.userId)
      const ids = hist.history.map(h => h.contentId)
      setWatchHistoryIds(ids)

      // Build progress map from lastPosition
      const pm: { [id: string]: number } = {}
      for (const h of hist.history) {
        const c = (allContent || []).find(x => x.contentId === h.contentId)
        const parts = String(h.lastPosition || '').split(':').map(x => parseInt(x || '0', 10))
        const posSec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0
        let totalSec = 0
        const dur = (c?.duration || '').trim()
        if (/^\d+h$/i.test(dur)) totalSec = parseInt(dur, 10) * 3600
        else if (/^\d+m$/i.test(dur)) totalSec = parseInt(dur, 10) * 60
        else if (/^\d{1,2}:\d{2}:\d{2}$/.test(dur)) {
          const dparts = dur.split(':').map(x => parseInt(x, 10))
          totalSec = dparts[0] * 3600 + dparts[1] * 60 + dparts[2]
        }
        if (totalSec > 0 && posSec > 0) pm[h.contentId] = Math.max(0, Math.min(1, posSec / totalSec))
      }
      setProgressMap(pm)
    } catch {}
  }

  useEffect(() => {
    loadContent()
  }, [])

  useEffect(() => {
    loadUserData()
  }, [user, allContent])

  useEffect(() => {
    if (featuredList.length <= 1) return
    const t = setInterval(() => {
      setFeaturedIndex(prev => {
        const next = (prev + 1) % featuredList.length
        setFeatured(featuredList[next] || null)
        return next
      })
    }, 8000)
    return () => clearInterval(t)
  }, [featuredList])

  const onPlay = (contentId: string) => {
    const item = allContent.find(c => c.contentId === contentId)
    navigation.navigate('Player', { contentId, title: item?.title })
  }

  const onAddToWatchlist = async (contentId: string) => {
    if (!user?.userId) return
    try {
      setWatchlistItems(prev => prev.includes(contentId) ? prev : [...prev, contentId])
      await userAPI.addToWatchlist(user.userId, contentId)
    } catch {
      setWatchlistItems(prev => prev.filter(id => id !== contentId))
    }
  }

  const onRemoveFromWatchlist = async (contentId: string) => {
    if (!user?.userId) return
    try {
      const prev = watchlistItems
      setWatchlistItems(prev.filter(id => id !== contentId))
      await userAPI.removeFromWatchlist(user.userId, contentId)
    } catch {}
  }

  const onMoreInfo = (contentId: string) => {
    const item = allContent.find(c => c.contentId === contentId) || null
    setDetailsItem(item)
    setDetailsOpen(true)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f14' }}>
        <ActivityIndicator color="#CC5500" />
        <Text style={{ color: 'white', marginTop: 12 }}>Loading content...</Text>
      </View>
    )
  }

  // Build derived rows
  const trending = allContent.slice(1, 21)
  const movies = allContent.filter(i => (i.type || '').toLowerCase() === 'movie').slice(0, 20)
  const series = allContent.filter(i => ['series', 'tv'].includes((i.type || '').toLowerCase())).slice(0, 20)
  const watchlistContent = allContent.filter(c => watchlistItems.includes(c.contentId))
  const continueWatching = allContent.filter(c => watchHistoryIds.includes(c.contentId))

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f14' }}>
      <NavigationNative />
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor="#CC5500"
            colors={["#CC5500"]}
            refreshing={loading}
            onRefresh={() => {
              loadContent()
              loadUserData()
            }}
          />
        }
      >
        <StreamingHeroNative
          featuredContent={featured}
          onPlay={onPlay}
          onMoreInfo={onMoreInfo}
          onPrev={() => {
            if (featuredList.length === 0) return
            setFeaturedIndex(prev => {
              const next = (prev - 1 + featuredList.length) % featuredList.length
              setFeatured(featuredList[next] || null)
              return next
            })
          }}
          onNext={() => {
            if (featuredList.length === 0) return
            setFeaturedIndex(prev => {
              const next = (prev + 1) % featuredList.length
              setFeatured(featuredList[next] || null)
              return next
            })
          }}
        />

        <View style={{ paddingVertical: 12 }}>
          <ContentRowNative
            title="Latest Movies"
            items={allContent}
            onPlay={onPlay}
            onMoreInfo={onMoreInfo}
            onAddToWatchlist={onAddToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            watchlistItems={watchlistItems}
            progressMap={progressMap}
          />
        </View>

        {watchlistContent.length > 0 && (
          <View style={{ paddingVertical: 12 }}>
            <ContentRowNative
              title="My Watchlist"
              items={watchlistContent}
              onPlay={onPlay}
              onMoreInfo={onMoreInfo}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              watchlistItems={watchlistItems}
              progressMap={progressMap}
            />
          </View>
        )}

        {continueWatching.length > 0 && (
          <View style={{ paddingVertical: 12 }}>
            <ContentRowNative
              title="Continue Watching"
              items={continueWatching}
              onPlay={onPlay}
              onMoreInfo={onMoreInfo}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              watchlistItems={watchlistItems}
              progressMap={progressMap}
            />
          </View>
        )}

        {Object.keys(genreCategories).map(g => (
          <View key={g} style={{ paddingVertical: 12 }}>
            <ContentRowNative
              title={g}
              items={genreCategories[g]}
              onPlay={onPlay}
              onMoreInfo={onMoreInfo}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              watchlistItems={watchlistItems}
              progressMap={progressMap}
            />
          </View>
        ))}
        <MovieDetailsModalNative
          visible={detailsOpen}
          content={detailsItem}
          onClose={() => setDetailsOpen(false)}
          onPlay={onPlay}
          onAddToWatchlist={onAddToWatchlist}
          onRemoveFromWatchlist={onRemoveFromWatchlist}
          inWatchlist={detailsItem ? watchlistItems.includes(detailsItem.contentId) : false}
        />
        {/* Footer at bottom */}
        <FooterNative />
      </ScrollView>
    </View>
  )
}
