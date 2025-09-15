import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform, Image } from 'react-native'
const logoWatermark = require('../../assets/image.png')
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { BACKEND_URL } from '../config'

// Web-only imports (conditionally loaded)
let shaka: any = null
if (Platform.OS === 'web') {
  try {
    shaka = require('shaka-player/dist/shaka-player.ui.js')
  } catch (e) {
    console.warn('Shaka Player not available on this platform')
  }
}

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

  // Refs
  const videoRef = useRef<any>(null)
  const playerRef = useRef<any>(null)
  const controlsOpacity = useRef(new Animated.Value(1)).current
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)

  // Auto-hide controls
  const resetControlsTimer = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    
    setShowControls(true)
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start()

    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }).start()
      }, 3000)
    }
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
      if (!isFullscreen) {
        if (videoRef.current?.requestFullscreen) {
          await videoRef.current.requestFullscreen()
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } else if ((Platform.OS === 'ios' || Platform.OS === 'android') && videoRef.current) {
      // Use expo-av for both iOS and Android
      await videoRef.current.presentFullscreenPlayer()
    }
    setIsFullscreen(!isFullscreen)
  }

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Web Shaka Player setup
  useEffect(() => {
    if (Platform.OS === 'web' && shaka && videoRef.current) {
      const initPlayer = async () => {
        try {
          shaka.polyfill.installAll()
          if (!shaka.Player.isBrowserSupported()) {
            throw new Error('Browser not supported')
          }

          const player = new shaka.Player()
          playerRef.current = player
          await player.attach(videoRef.current)

          // Configure for HLS
          player.configure({
            streaming: {
              bufferingGoal: 30,
              rebufferingGoal: 5,
              bufferBehind: 30,
            },
          })

          // Event listeners
          player.addEventListener('error', (event: any) => {
            setError(event.detail?.message || 'Playback error')
            setLoading(false)
            onError?.(event.detail)
          })

          player.addEventListener('loaded', () => {
            setLoading(false)
            setDuration(videoRef.current?.duration || 0)
            
            // Auto-resume from last position if specified
            if (initialPosition > 0 && videoRef.current) {
              console.log('[UnifiedVideoPlayer] Seeking to initial position:', initialPosition)
              videoRef.current.currentTime = initialPosition
              setCurrentTime(initialPosition)
            }
            
            onLoad?.()
          })

          // Load manifest - direct CloudFront URLs should work
          await player.load(src, 0, 'application/x-mpegURL')
          
          if (autoPlay) {
            videoRef.current?.play()
          }
        } catch (err: any) {
          setError(err.message)
          setLoading(false)
          onError?.(err)
        }
      }

      initPlayer()

      return () => {
        playerRef.current?.destroy()
      }
    }
  }, [src, autoPlay])

  // Web video event handlers
  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      const video = videoRef.current

      const handleTimeUpdate = () => {
        const current = video.currentTime
        setCurrentTime(current)
        onProgress?.({ currentTime: current, duration: video.duration })
      }

      const handleDurationChange = () => {
        setDuration(video.duration)
      }

      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      const handleEnded = () => {
        setIsPlaying(false)
        onEnd?.()
      }

      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('durationchange', handleDurationChange)
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('ended', handleEnded)

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('durationchange', handleDurationChange)
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('ended', handleEnded)
      }
    }
  }, [])

  // Render platform-specific video component
  const renderVideoPlayer = () => {
    if (Platform.OS === 'web') {
      return (
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
          }}
          muted={muted}
          loop={loop}
          playsInline
          onTouchStart={resetControlsTimer}
          onMouseMove={resetControlsTimer}
        />
      )
    } else {
      // Use expo-av for both iOS and Android
      return (
        <Video
          ref={videoRef}
          source={{ uri: src }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isLooping={loop}
          isMuted={muted}
          volume={volume}
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
          onError={(error) => {
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: controlsOpacity,
          }}
          onTouchStart={resetControlsTimer}
        >
          {/* Top gradient with title */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: 'transparent',
            paddingTop: 16,
            paddingHorizontal: 16,
          }}>
            {title && (
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                {title}
              </Text>
            )}
          </View>

          {/* Center play button */}
          {!isPlaying && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <TouchableOpacity
                onPress={handleTogglePlay}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Ionicons name="play" size={32} color="white" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom controls */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            paddingBottom: 20,
            paddingHorizontal: 16,
            paddingTop: 40,
          }}>
            {/* Progress bar */}
            <View style={{ marginBottom: 16 }}>
              <View style={{
                height: 4,
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

            {/* Control buttons */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={handleTogglePlay} style={{ marginRight: 20 }}>
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
                
                <Text style={{ color: 'white', fontSize: 14 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => handleVolumeChange(volume > 0 ? 0 : 1)} style={{ marginRight: 20 }}>
                  <Ionicons 
                    name={volume > 0 ? "volume-high" : "volume-mute"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={toggleFullscreen}>
                  <Ionicons 
                    name={isFullscreen ? "contract" : "expand"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Watermark */}
      {!error && (
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
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
