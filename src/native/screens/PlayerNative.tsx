import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, BackHandler } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { contentAPI, userAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import AndroidVideoPlayer from '../AndroidVideoPlayer'
import IOSVideoPlayer from '../IOSVideoPlayer'

interface RouteParams {
  contentId: string
  title?: string
}

const QUALITY_LABELS = ['1080p', '720p', '540p', '480p', '360p', '270p'] as const

export default function PlayerNative() {
  const route = useRoute() as any
  const navigation = useNavigation() as any
  const { user } = useAuth()
  const { contentId, title } = (route.params || {}) as RouteParams

  const [sources, setSources] = useState<Record<string, string>>({})
  const [quality, setQuality] = useState<'auto' | '1080p' | '720p' | '540p' | '480p' | '360p' | '270p'>('auto')
  const [currentUri, setCurrentUri] = useState<string>('')
  const [duration, setDuration] = useState<number>(0)
  const [position, setPosition] = useState<number>(0)
  const lastSavedRef = useRef<number>(0)
  const [initialSeek, setInitialSeek] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await contentAPI.getStreamingUrls(contentId)
        // Expect res.streaming[] with resolutions map
        const first = res?.streaming?.[0]
        const map: Record<string, string> = {}
        if (first?.resolutions) {
          for (const key of QUALITY_LABELS) {
            const url = first.resolutions[key as keyof typeof first.resolutions]
            if (url) map[key] = url
          }
        }
        // Fallback: if no map, try generic field names
        if (Object.keys(map).length === 0 && first) {
          // noop; keeping empty will disable manual selection
        }
        if (!mounted) return
        setSources(map)
        // Choose default URI: prefer 1080p, 720p, then 540p/480p, then 360p/270p
        const preferred = map['1080p'] || map['720p'] || map['540p'] || map['480p'] || map['360p'] || map['270p'] || ''
        setCurrentUri(preferred)

        // Load last watch position to resume
        if (user?.userId) {
          try {
            const hist = await userAPI.getWatchHistory(user.userId)
            const entry = (hist.history || []).find((h: any) => h.contentId === contentId)
            if (entry?.lastPosition) {
              const parts = String(entry.lastPosition).split(':').map((x: string) => parseInt(x || '0', 10))
              const sec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0
              if (mounted && sec > 0) setInitialSeek(sec)
            }
          } catch {}
        }
      } catch (e) {
        // noop for now; could show toast
      }
    })()
    return () => {
      mounted = false
    }
  }, [contentId])

  useEffect(() => {
    const handler = () => {
      navigation.goBack()
      return true
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', handler)
    return () => {
      try { sub.remove() } catch {}
    }
  }, [navigation])

  useEffect(() => {
    if (quality === 'auto') {
      // keep currentUri as set by ABR/default
      return
    }
    const next = sources[quality]
    if (next) {
      setCurrentUri(next)
    }
  }, [quality, sources])

  // Persist watch progress every 10s and on unmount
  useEffect(() => {
    return () => {
      maybeSaveProgress(true)
    }
  }, [position, duration])

  const maybeSaveProgress = async (force = false) => {
    try {
      if (!user?.userId || !contentId || !position) return
      const now = Date.now()
      if (!force && now - lastSavedRef.current < 10000) return
      lastSavedRef.current = now

      // format position to HH:MM:SS
      const hh = Math.floor(position / 3600).toString().padStart(2, '0')
      const mm = Math.floor((position % 3600) / 60).toString().padStart(2, '0')
      const ss = Math.floor(position % 60).toString().padStart(2, '0')
      const lastPosition = `${hh}:${mm}:${ss}`

      await userAPI.upsertWatchHistory({ userId: user.userId, contentId, lastPosition })
    } catch {}
  }

  const onLoad = () => {
    // no-op; react-native-video can provide duration via progress event
  }

  const onProgress = (p: { currentTime: number; duration: number }) => {
    setPosition(p.currentTime || 0)
    setDuration(p.duration || 0)
    maybeSaveProgress()
  }

  const ControlButton = ({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[styles.controlBtn, active && styles.controlBtnActive]}>
      <Text style={[styles.controlBtnText, active && styles.controlBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Player */}
      {Platform.OS === 'android' ? (
        <AndroidVideoPlayer src={currentUri} autoPlay muted={false} loop={false} onLoad={onLoad} onProgress={onProgress} style={{ flex: 1 }} startPosition={initialSeek} />
      ) : (
        <IOSVideoPlayer src={currentUri} autoPlay muted={false} loop={false} onLoad={onLoad} onProgress={onProgress} style={{ flex: 1 }} startPosition={initialSeek} />
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: 'white', fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.title}>{title || 'Playing'}</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <View style={styles.qualityRow}>
          <ControlButton label="Auto" active={quality === 'auto'} onPress={() => setQuality('auto')} />
          {QUALITY_LABELS.map(q => (
            sources[q] ? (
              <ControlButton key={q} label={q.toUpperCase()} active={quality === q} onPress={() => setQuality(q)} />
            ) : null
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 56, paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8 },
  title: { color: 'white', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  controls: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 16, paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.45)'
  },
  qualityRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  controlBtn: { borderWidth: 1, borderColor: '#CC5500', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginHorizontal: 4, marginVertical: 6 },
  controlBtnActive: { backgroundColor: '#CC5500' },
  controlBtnText: { color: '#CC5500', fontWeight: '600' },
  controlBtnTextActive: { color: '#000' }
})
