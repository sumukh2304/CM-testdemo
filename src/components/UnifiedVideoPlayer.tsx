import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform, Image, TouchableWithoutFeedback } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as NavigationBar from 'expo-navigation-bar'
import * as ScreenOrientation from 'expo-screen-orientation'
const logoWatermark = require('../../assets/image.png')
// Use expo-av on native: ExoPlayer (Android) and AVPlayer (iOS) under the hood
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
// import { BACKEND_URL } from '../config'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Note: UnifiedVideoPlayer is strictly for native (iOS/Android) using expo-av.
// Web should use EnhancedVideoPlayer (Shaka) exclusively.

interface UnifiedVideoPlayerProps {
  src: string
  title?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  onLoad?: () => void
  onError?: (error: any) => void
  onProgress?: (progress: { currentTime: number; duration: number }) => void
  onEnd?: () => void
  initialPosition?: number // Start time in seconds
  // Optional: native quality selection (web still uses Shaka UI)
  qualities?: { label: string; uri: string }[]
  currentQuality?: string
  onSelectQuality?: (label: string) => void
}

const UnifiedVideoPlayer: React.FC<UnifiedVideoPlayerProps> = ({
  src,
  title,
  autoPlay = false,
  muted = false,
  loop = false,
  onLoad,
  onError,
  onProgress,
  onEnd,
  initialPosition = 0,
  qualities = [],
  currentQuality,
  onSelectQuality,
}) => {
  // Common state
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(muted ? 0 : 1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const SPEEDS = [0.5, 1.0, 1.25, 1.5, 2.0] as const
  const [speed, setSpeed] = useState<number>(1.0)

  // Tap gesture helpers
  const lastTapRef = useRef<number>(-10000)
  const onBackgroundTap = () => {
    const now = Date.now()
    // If controls are hidden, first tap should ONLY reveal them
    if (!showControls) {
      setShowControls(true)
      resetControlsTimer()
      lastTapRef.current = now
      return
    }

    // Consider as double-tap only if previous tap was recent
    const delta = now - lastTapRef.current
    if (delta > 0 && delta < 250) {
      // Double-tap center toggles play
      handleTogglePlay()
    } else {
      // Single tap: always show controls and reset timer (do NOT toggle to hidden)
      setShowControls(true)
      resetControlsTimer()
    }
    lastTapRef.current = now
  }

  // Auto enter/exit fullscreen based on device rotation (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return
    const subscribe = async () => {
      try {
        const sub = ScreenOrientation.addOrientationChangeListener(async ({ orientationInfo }) => {
          if (isChangingOrientationRef.current) return
          const o = orientationInfo.orientation
          const isLandscape = o === ScreenOrientation.Orientation.LANDSCAPE_LEFT || o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
          const isPortrait = o === ScreenOrientation.Orientation.PORTRAIT_UP || o === ScreenOrientation.Orientation.PORTRAIT_DOWN
          try {
            if (isLandscape && !isFullscreen && videoRef.current) {
              isChangingOrientationRef.current = true
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
              await videoRef.current.presentFullscreenPlayer()
              setIsFullscreen(true)
              isChangingOrientationRef.current = false
            } else if (isPortrait && isFullscreen && videoRef.current) {
              isChangingOrientationRef.current = true
              if (videoRef.current.dismissFullscreenPlayer) await videoRef.current.dismissFullscreenPlayer()
              await ScreenOrientation.unlockAsync()
              setIsFullscreen(false)
              isChangingOrientationRef.current = false
            }
          } catch {}
        })
        orientationListenerRef.current = sub
      } catch {}
    }
    subscribe()
    return () => {
      try { if (orientationListenerRef.current) ScreenOrientation.removeOrientationChangeListener(orientationListenerRef.current) } catch {}
    }
  }, [isFullscreen])
  

  // Refs
  const videoRef = useRef<any>(null)
  const playerRef = useRef<any>(null)
  const controlsOpacity = useRef(new Animated.Value(1)).current
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const orientationListenerRef = useRef<ScreenOrientation.Subscription | null>(null)
  const isChangingOrientationRef = useRef(false)
  const insets = useSafeAreaInsets()

  // Auto-hide controls
  const resetControlsTimer = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    
    setShowControls(true)
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
    hideControlsTimeout.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setShowControls(false))
    }, 4000)
  }

  const pauseAutoHide = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
      hideControlsTimeout.current = null
    }
    setShowControls(true)
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }

  useEffect(() => {
    resetControlsTimer()
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current)
      }
    }
  }, [isPlaying])

  // Platform-specific handlers
  const handleTogglePlay = async () => {
    if (Platform.OS === 'web' && playerRef.current) {
      if (isPlaying) {
        videoRef.current?.pause()
      } else {
        videoRef.current?.play()
      }
    } else if ((Platform.OS === 'ios' || Platform.OS === 'android') && videoRef.current) {
      // Use expo-av for both iOS and Android
      if (isPlaying) {
        await videoRef.current.pauseAsync()
      } else {
        await videoRef.current.playAsync()
      }
    }
    setIsPlaying(!isPlaying)
    resetControlsTimer()
  }

  const handleSeek = (time: number) => {
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.currentTime = time
    } else if ((Platform.OS === 'ios' || Platform.OS === 'android') && videoRef.current) {
      // Use expo-av for both iOS and Android
      videoRef.current.setPositionAsync(time * 1000)
    }
    setCurrentTime(time)
    resetControlsTimer()
  }

  // Seek relative helper (e.g., +/- 10 seconds)
  const seekBy = async (seconds: number) => {
    try {
      const wasPlaying = isPlaying
      const target = Math.max(0, Math.min(duration, currentTime + seconds))
      if (videoRef.current?.setPositionAsync) {
        await videoRef.current.setPositionAsync(target * 1000)
        if (wasPlaying && videoRef.current?.playAsync) {
          await videoRef.current.playAsync()
        }
      } else if (Platform.OS === 'web' && videoRef.current) {
        videoRef.current.currentTime = target
        if (wasPlaying) {
          try { await (videoRef.current as any).play() } catch {}
        }
      }
      setCurrentTime(target)
    } catch (e) {
      console.warn('Seek error:', e)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.volume = newVolume
    } else if ((Platform.OS === 'ios' || Platform.OS === 'android') && videoRef.current) {
      // Use expo-av for both iOS and Android
      videoRef.current.setVolumeAsync(newVolume)
    }
  }

  const toggleFullscreen = async () => {
    if (Platform.OS === 'web') {
      try {
        if (!isFullscreen) {
          if (videoRef.current?.requestFullscreen) {
            await videoRef.current.requestFullscreen()
            setIsFullscreen(true)
          }
        } else {
          if (typeof document !== 'undefined' && (document as any).exitFullscreen) {
            await (document as any).exitFullscreen()
            setIsFullscreen(false)
          }
        }
      } catch (error) {
        console.warn('Fullscreen API error (user gesture required):', error)
        // Fallback: just update state for UI purposes
        setIsFullscreen(!isFullscreen)
      }
    } else {
      try {
        if (!isFullscreen) {
          // Lock to landscape and enter fullscreen
          isChangingOrientationRef.current = true
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
          setIsFullscreen(true)
          try {
            if (Platform.OS === 'android') {
              await NavigationBar.setBackgroundColorAsync('transparent')
              await NavigationBar.setBehaviorAsync('overlay-swipe' as any)
              await NavigationBar.setVisibilityAsync('hidden')
            }
          } catch {}
          isChangingOrientationRef.current = false
        } else {
          // Exit fullscreen and unlock orientation
          isChangingOrientationRef.current = true
          await ScreenOrientation.unlockAsync()
          setIsFullscreen(false)
          try {
            if (Platform.OS === 'android') {
              await NavigationBar.setVisibilityAsync('visible')
              await NavigationBar.setBehaviorAsync('inset-swipe' as any)
            }
          } catch {}
          isChangingOrientationRef.current = false
        }
      } catch (error) {
        console.warn('Native fullscreen/orientation error:', error)
      }
    }
  }

  // Playback rate control for native and web
  const setPlaybackRate = async (rate: number) => {
    try {
      if (Platform.OS === 'web') {
        if (videoRef.current) {
          videoRef.current.playbackRate = rate
        }
      } else if (videoRef.current?.setRateAsync) {
        await videoRef.current.setRateAsync(rate, true)
      }
      setSpeed(rate)
      resetControlsTimer()
    } catch (e) {
      // ignore rate errors
    }
  }

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // No web playback logic here; web must use EnhancedVideoPlayer (Shaka)

  // Render platform-specific video component
  const renderVideoPlayer = () => {
    if (Platform.OS === 'web') {
      // Guard: do not render any player on web from this component to avoid Shaka conflicts.
      return null
    } else {
      // Use expo-av for both iOS and Android (custom controls)
      return (
        <Video
          ref={videoRef}
          source={{ uri: src }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={isFullscreen ? ResizeMode.COVER : ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isLooping={loop}
          isMuted={muted}
          volume={volume}
          useNativeControls={false}
          // We manage fullscreen ourselves on native; no-op handler
          onFullscreenUpdate={undefined as any}
          onLoad={(status: any) => {
            setDuration(status.durationMillis ? status.durationMillis / 1000 : 0)
            setLoading(false)
            
            // Auto-resume from last position if specified
            if (initialPosition > 0 && videoRef.current) {
              console.log('[UnifiedVideoPlayer] Seeking to initial position:', initialPosition)
              videoRef.current.setPositionAsync(initialPosition * 1000) // Convert to milliseconds
              setCurrentTime(initialPosition)
            }
            
            onLoad?.()
          }}
          onPlaybackStatusUpdate={(status: any) => {
            if (status.isLoaded) {
              const current = status.positionMillis ? status.positionMillis / 1000 : 0
              setCurrentTime(current)
              setIsPlaying(status.isPlaying || false)
              onProgress?.({ 
                currentTime: current, 
                duration: status.durationMillis ? status.durationMillis / 1000 : 0 
              })
              
              if (status.didJustFinish) {
                onEnd?.()
              }
            }
          }}
          onError={(error: any) => {
            setError('Video load error')
            setLoading(false)
            onError?.(error)
          }}
        />
      )
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
      <StatusBar hidden={isFullscreen} style="light" />
      {/* Video Player */}
      {renderVideoPlayer()}

      {/* Loading Overlay */}
      {loading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: 'white', fontSize: 18 }}>Loading...</Text>
        </View>
      )}

      {/* Error Overlay */}
      {error && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#CC5500', fontSize: 18, textAlign: 'center', paddingHorizontal: 20 }}>
            {error}
          </Text>
        </View>
      )}

      {/* Streaming platform Controls Overlay */}
      {!loading && !error && (
        <Animated.View
          pointerEvents={'auto'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: controlsOpacity,
            zIndex: showSpeedMenu || showQualityMenu ? 1000 : 10,
          }}
        >
          {/* Full-screen tap catcher for toggling controls / double-tap center for play/pause */}
          <TouchableWithoutFeedback onPress={onBackgroundTap}>
            <View pointerEvents="auto" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          </TouchableWithoutFeedback>
          {/* Top scrim with title (match web) */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 90,
            backgroundColor: 'rgba(0,0,0,0.35)',
            paddingTop: isFullscreen ? 16 : Math.max(16, insets.top),
            paddingHorizontal: 16,
            zIndex: 10,
          }}>
            {title && (
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>
                {title}
              </Text>
            )}
          </View>

          {/* Center controls: back10 / play-pause / fwd10 with circular backgrounds and small '10' labels */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginRight: 24 }}>
                <TouchableOpacity onPress={() => seekBy(-10)} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="play-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 10, marginTop: 6 }}>10</Text>
              </View>

              <TouchableOpacity onPress={handleTogglePlay} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 }}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color="white" />
              </TouchableOpacity>

              <View style={{ alignItems: 'center', marginLeft: 24 }}>
                <TouchableOpacity onPress={() => seekBy(10)} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="play-forward" size={28} color="white" />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 10, marginTop: 6 }}>10</Text>
              </View>
            </View>
          </View>

          {/* Left/Right double-tap seek zones (native only) */}
          {Platform.OS !== 'web' && (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { seekBy(-10) }}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%' }}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { seekBy(10) }}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%' }}
              />
            </>
          )}

          {/* Bottom scrim controls (match web bottom bar) */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            paddingBottom: 24,
            paddingHorizontal: 16,
            paddingTop: 28,
            zIndex: 10,
          }}>
            {/* Progress bar */}
            <View style={{ marginBottom: 16 }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e: any) => {
                if (!duration) return
                const x = e.nativeEvent.locationX
                const width = e.nativeEvent.target && e.nativeEvent.target.width ? e.nativeEvent.target.width : undefined
                const w = width || Dimensions.get('window').width - 32
                const ratio = Math.max(0, Math.min(1, x / w))
                handleSeek(ratio * duration)
              }}
              onResponderMove={(e: any) => {
                if (!duration) return
                const x = e.nativeEvent.locationX
                const w = Dimensions.get('window').width - 32
                const ratio = Math.max(0, Math.min(1, x / w))
                handleSeek(ratio * duration)
              }}
            >
              <View style={{
                height: 6,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  backgroundColor: '#e50914',
                }} />
              </View>
            </View>

            {/* Bottom row: left (volume + time), right (speed + settings + fullscreen) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Left cluster */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => handleVolumeChange(volume > 0 ? 0 : 1)} style={{ marginRight: 16 }}>
                  <Ionicons name={volume > 0 ? 'volume-high' : 'volume-mute'} size={22} color='white' />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: 13 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
              </View>

              {/* Right cluster */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Speed */}
                <View style={{ position: 'relative', marginRight: 18 }}>
                  <TouchableOpacity onPress={() => { pauseAutoHide(); setShowSpeedMenu(v => !v); setShowQualityMenu(false) }}>
                    <Text style={{ color: 'white', fontWeight: '800' }}>{speed}x</Text>
                  </TouchableOpacity>
                  {showSpeedMenu && (
                    <View pointerEvents="auto" style={{ position: 'absolute', right: 0, bottom: 28, backgroundColor: 'rgba(0,0,0,0.95)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, zIndex: 2000, elevation: 16, minWidth: 120 }}>
                      {SPEEDS.map(s => (
                        <TouchableOpacity key={s} onPress={() => { setShowSpeedMenu(false); setPlaybackRate(s); resetControlsTimer() }} style={{ paddingVertical: 8, paddingHorizontal: 6 }}>
                          <Text style={{ color: s === speed ? '#FF8C3A' : 'white', fontWeight: s === speed ? '900' : '700' }}>{s}x</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Settings/Quality */}
                {Platform.OS !== 'web' && (qualities?.length ? (
                  <View style={{ position: 'relative', marginRight: 18 }}>
                    <TouchableOpacity onPress={() => { pauseAutoHide(); setShowQualityMenu(v => !v); setShowSpeedMenu(false) }}>
                      <Ionicons name='settings-sharp' size={20} color='white' />
                    </TouchableOpacity>
                    {showQualityMenu && (
                      <View pointerEvents="auto" style={{ position: 'absolute', right: 0, bottom: 28, backgroundColor: 'rgba(0,0,0,0.95)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, zIndex: 2000, elevation: 16, minWidth: 140 }}>
                        {qualities.map(q => (
                          <TouchableOpacity key={q.label} onPress={() => { setShowQualityMenu(false); onSelectQuality?.(q.label); resetControlsTimer() }} style={{ paddingVertical: 8, paddingHorizontal: 6 }}>
                            <Text style={{ color: q.label === (currentQuality || '') ? '#FF8C3A' : 'white', fontWeight: q.label === (currentQuality || '') ? '900' : '700' }}>{q.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : null)}

                {/* Fullscreen */}
                <TouchableOpacity onPress={toggleFullscreen}>
                  <Ionicons name={isFullscreen ? 'contract' : 'expand'} size={22} color='white' />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Watermark - top-right edge */}
      {!error && (
        <View
          style={{
            position: 'absolute',
            top: 30,
            right: 15,
            opacity: 0.6,
            zIndex: 50,
            pointerEvents: 'none',
            backgroundColor: 'transparent'
          }}
        >
          <Image source={logoWatermark} style={{ width: 120, height: 48, resizeMode: 'contain' }} />
        </View>
      )}
    </View>
  )
}

export default UnifiedVideoPlayer
