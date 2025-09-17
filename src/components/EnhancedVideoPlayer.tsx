import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform, StyleSheet, Image } from 'react-native'
const logoWatermark = require('../../assets/image.png')
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { BACKEND_URL } from '../config'

// Web-only imports
let shaka: any = null
if (Platform.OS === 'web') {
  try {
    // Use core Shaka build (no default UI) to keep our controls consistent
    shaka = require('shaka-player/dist/shaka-player.compiled.js')
  } catch (e) {
    console.warn('Shaka Player not available')
  }
}

interface EnhancedVideoPlayerProps {
  src: string
  title?: string
  autoPlay?: boolean
  muted?: boolean
  onLoad?: () => void
  onError?: (error: any) => void
  onProgress?: (progress: { currentTime: number; duration: number }) => void
  onEnd?: () => void
  resolutions?: { [key: string]: string }
  initialPosition?: number // Start time in seconds
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  src,
  title,
  autoPlay = false,
  muted = false,
  onLoad,
  onError,
  onProgress,
  onEnd,
  resolutions = {},
  initialPosition = 0
}) => {
  // Player state
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(muted ? 0 : 1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [buffering, setBuffering] = useState(false)
  
  // Advanced player features
  const [selectedQuality, setSelectedQuality] = useState('1080p')
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false)
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekPreview, setSeekPreview] = useState<number | null>(null)
  const [progressBarWidth, setProgressBarWidth] = useState(0)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const [hoverTime, setHoverTime] = useState<number | null>(null)

  // Refs
  const videoRef = useRef<any>(null)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const controlsOpacity = useRef(new Animated.Value(1)).current
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const progressBarRef = useRef<any>(null)
  const progressContainerRef = useRef<any>(null)

  // Available qualities
  const availableQualities = Object.keys(resolutions).length > 0 
    ? Object.keys(resolutions).sort((a, b) => {
        const order = { '4k': 4, '1080p': 3, '720p': 2, '480p': 1, '360p': 0 }
        return (order[b as keyof typeof order] || 0) - (order[a as keyof typeof order] || 0)
      })
    : ['Auto']

  // Playback speeds
  const playbackSpeeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]

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

    if (isPlaying && !showQualityMenu && !showSpeedMenu && !showSubtitleMenu) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }).start()
      }, 4000)
    }
  }

  useEffect(() => {
    resetControlsTimer()
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current)
      }
    }
  }, [isPlaying, showQualityMenu, showSpeedMenu, showSubtitleMenu])

  // Get current stream URL based on selected quality
  const getCurrentStreamUrl = () => {
    if (Object.keys(resolutions).length > 0) {
      return resolutions[selectedQuality] || resolutions['1080p'] || resolutions['720p'] || src
    }
    return src
  }

  // Always proxy HLS through backend to avoid CORS and keep behavior consistent
  const toProxiedHls = (url: string) => {
    return `${BACKEND_URL}/proxy/hls?url=${encodeURIComponent(url)}`
  }

  // Player controls
  const handleTogglePlay = async () => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    } else if (videoRef.current) {
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
    } else if (videoRef.current) {
      videoRef.current.setPositionAsync(time * 1000)
    }
    setCurrentTime(time)
    resetControlsTimer()
  }

  // Seeking helpers for progress bar (works web and native)
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))
  const seekToX = (x: number) => {
    if (!duration || progressBarWidth <= 0) return
    const ratio = clamp(x / progressBarWidth, 0, 1)
    const newTime = ratio * duration
    // Update UI immediately
    setCurrentTime(newTime)
    // Apply to player while dragging for instant feedback
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.currentTime = newTime
    } else if (videoRef.current) {
      videoRef.current.setPositionAsync(newTime * 1000)
    }
  }
  const updateHover = (x: number | null) => {
    if (x === null || !duration || progressBarWidth <= 0) {
      setHoverX(null)
      setHoverTime(null)
      return
    }
    const ratio = clamp(x / progressBarWidth, 0, 1)
    setHoverX(x)
    setHoverTime(ratio * duration)
  }
  const handleProgressGrant = (e: any) => {
    setIsSeeking(true)
    resetControlsTimer()
    const x = e?.nativeEvent?.locationX ?? 0
    seekToX(x)
  }
  const handleProgressMove = (e: any) => {
    if (!isSeeking) return
    const x = e?.nativeEvent?.locationX ?? 0
    seekToX(x)
    updateHover(x)
  }
  const handleProgressRelease = (e: any) => {
    if (!duration || progressBarWidth <= 0) {
      setIsSeeking(false)
      return
    }
    const x = e?.nativeEvent?.locationX ?? 0
    const ratio = clamp(x / progressBarWidth, 0, 1)
    const newTime = ratio * duration
    setIsSeeking(false)
    handleSeek(newTime)
    updateHover(null)
  }
  const handleProgressHoverMove = (e: any) => {
    if (Platform.OS !== 'web') return
    const x = e?.nativeEvent?.locationX ?? 0
    updateHover(x)
  }
  const handleProgressHoverLeave = () => {
    if (Platform.OS !== 'web') return
    updateHover(null)
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.volume = newVolume
    } else if (videoRef.current) {
      videoRef.current.setVolumeAsync(newVolume)
    }
  }

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality)
    setShowQualityMenu(false)
    
    // Reload video with new quality
    if (Platform.OS === 'web' && playerRef.current) {
      const newUrl = resolutions[quality] || src
      const proxiedUrl = toProxiedHls(newUrl)
      playerRef.current.load(proxiedUrl, currentTime)
    }
    resetControlsTimer()
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed)
    setShowSpeedMenu(false)
    
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.playbackRate = speed
    } else if (videoRef.current) {
      videoRef.current.setRateAsync(speed, true)
    }
    resetControlsTimer()
  }

  // Lock scroll only while in fullscreen (web). Allow normal page scroll otherwise.
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const onFsChange = () => {
      try {
        const fsActive = !!document.fullscreenElement
        let styleEl = document.querySelector('style[data-evp-scroll-lock="1"]') as HTMLStyleElement | null
        if (fsActive) {
          if (!styleEl) {
            styleEl = document.createElement('style')
            styleEl.setAttribute('data-evp-scroll-lock', '1')
            document.head.appendChild(styleEl)
          }
          styleEl.textContent = `html, body, #root { overflow: hidden !important; height: 100% !important; }`
        } else if (styleEl) {
          try { document.head.removeChild(styleEl) } catch {}
        }
      } catch {}
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => { document.removeEventListener('fullscreenchange', onFsChange) }
  }, [])

  const toggleFullscreen = async () => {
    if (Platform.OS === 'web') {
      try {
        if (!isFullscreen) {
          const el: any = containerRef.current || videoRef.current
          if (el?.requestFullscreen) {
            await el.requestFullscreen()
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
    } else if (videoRef.current) {
      try {
        await videoRef.current.presentFullscreenPlayer()
        setIsFullscreen(true)
      } catch (error) {
        console.warn('Native fullscreen error:', error)
      }
    }
  }

  const skip10Forward = () => {
    handleSeek(Math.min(currentTime + 10, duration))
  }

  const skip10Backward = () => {
    handleSeek(Math.max(currentTime - 10, 0))
  }

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
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

          // Enhanced configuration for better streaming
          player.configure({
            streaming: {
              bufferingGoal: 30,
              rebufferingGoal: 5,
              bufferBehind: 30,
              retryParameters: {
                timeout: 30000,
                maxAttempts: 4,
                baseDelay: 1000,
                backoffFactor: 2,
                fuzzFactor: 0.5
              }
            },
            abr: {
              enabled: true,
              useNetworkInformation: true,
              defaultBandwidthEstimate: 5000000
            }
          })

          // Force stage-aware proxy URLs on web: rewrite any /proxy/hls requests
          try {
            const net = player.getNetworkingEngine()
            if (net && typeof net.registerRequestFilter === 'function') {
              net.registerRequestFilter((type: any, request: any) => {
                if (!request?.uris || !Array.isArray(request.uris)) return
                request.uris = request.uris.map((u: string) => {
                  try {
                    // If URL contains '/proxy/hls', ensure it is prefixed with BACKEND_URL (which includes stage)
                    if (u.includes('/proxy/hls')) {
                      // Case 1: absolute API GW URL missing stage e.g. https://...amazonaws.com/proxy/hls?url=...
                      if (/amazonaws\.com\/proxy\/hls/.test(u)) {
                        const idx = u.indexOf('/proxy/hls')
                        const suffix = idx >= 0 ? u.substring(idx) : '/proxy/hls'
                        return `${BACKEND_URL}${suffix}`
                      }
                      // Case 2: root-relative '/proxy/hls?...'
                      if (u.startsWith('/proxy/hls')) {
                        return `${BACKEND_URL}${u}`
                      }
                    }
                  } catch {}
                  return u
                })
              })
            }
          } catch {}

          // Event listeners
          player.addEventListener('error', (event: any) => {
            console.error('Shaka Player Error:', event.detail)
            setError(event.detail?.message || 'Playback error')
            setLoading(false)
            onError?.(event.detail)
          })

          player.addEventListener('loaded', () => {
            setLoading(false)
            setDuration(videoRef.current?.duration || 0)
            
            // Auto-resume from last position if specified
            if (initialPosition > 0 && videoRef.current) {
              console.log('[EnhancedVideoPlayer] Seeking to initial position:', initialPosition)
              videoRef.current.currentTime = initialPosition
              setCurrentTime(initialPosition)
            }
            
            onLoad?.()
          })

          player.addEventListener('buffering', (event: any) => {
            setBuffering(event.buffering)
          })

          // Load manifest through backend proxy to bypass CORS consistently
          const streamUrl = getCurrentStreamUrl()
          const proxyUrl = toProxiedHls(streamUrl)
          
          console.log('[EnhancedVideoPlayer] Loading stream:', proxyUrl)
          await player.load(proxyUrl)
          
          if (autoPlay) {
            videoRef.current?.play()
          }
        } catch (err: any) {
          console.error('Player initialization error:', err)
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
  }, [src])

  // Keep isFullscreen in sync with browser UI (e.g., ESC to exit)
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const handler = () => {
      const fsActive = !!document.fullscreenElement
      setIsFullscreen(fsActive)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
    }
  }, [])

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

      const handleWaiting = () => setBuffering(true)
      const handleCanPlay = () => setBuffering(false)

      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('durationchange', handleDurationChange)
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('ended', handleEnded)
      video.addEventListener('waiting', handleWaiting)
      video.addEventListener('canplay', handleCanPlay)

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('durationchange', handleDurationChange)
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('ended', handleEnded)
        video.removeEventListener('waiting', handleWaiting)
        video.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [])

  // Render video player
  const renderVideoPlayer = () => {
    if (Platform.OS === 'web') {
      return (
        <>
          {/* Hide native browser controls to keep our custom UI consistent */}
          <style>{`
            video::-webkit-media-controls { display: none !important; }
            video::-webkit-media-controls-enclosure { display: none !important; }
            video::-moz-media-controls { display: none !important; }
          `}</style>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              objectFit: 'cover' as any,
              display: 'block',
              pointerEvents: 'none' as any,
            }}
            controls={false as any}
            controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
            disablePictureInPicture
            muted={muted}
            playsInline
            onTouchStart={() => { resetControlsTimer() }}
            onMouseMove={() => { resetControlsTimer() }}
            onClick={() => { setShowControls(true); resetControlsTimer() }}
          />
        </>
      )
    } else {
      return (
        <Video
          ref={videoRef}
          source={{ uri: toProxiedHls(getCurrentStreamUrl()) }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isMuted={muted}
          volume={volume}
          rate={playbackRate}
          onLoad={(status: any) => {
            setDuration(status.durationMillis ? status.durationMillis / 1000 : 0)
            setLoading(false)
            
            // Auto-resume from last position if specified
            if (initialPosition > 0 && videoRef.current) {
              console.log('[EnhancedVideoPlayer] Seeking to initial position:', initialPosition)
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
              setBuffering(status.isBuffering || false)
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

  // Progress bar component
  const renderProgressBar = () => (
    <View style={styles.progressContainer} ref={progressContainerRef}>
      <View 
        ref={progressBarRef}
        style={styles.progressBar}
        onLayout={(e: any) => setProgressBarWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleProgressGrant}
        onResponderMove={handleProgressMove}
        onResponderRelease={handleProgressRelease}
        {...(Platform.OS === 'web' ? ({ 
          onMouseMove: handleProgressHoverMove,
          onMouseLeave: handleProgressHoverLeave
        } as any) : {})}
      >
        <View 
          style={[styles.progressFill, { width: `${(currentTime / duration) * 100}%` }]} 
        />
        <View 
          style={[styles.progressHandle, { left: `${(currentTime / duration) * 100}%` }]} 
        />
        {Platform.OS === 'web' && hoverX !== null && hoverTime !== null && (
          <View
            style={[
              styles.tooltip,
              { left: Math.max(0, Math.min(progressBarWidth - 40, hoverX - 20)) }
            ]}
          >
            <Text style={styles.tooltipText}>{formatTime(hoverTime)}</Text>
          </View>
        )}
      </View>
    </View>
  )

  // Control buttons
  const renderControls = () => (
    <Animated.View 
      style={[
        styles.controlsOverlay, 
        { 
          opacity: controlsOpacity,
          pointerEvents: showControls ? 'auto' : 'none',
          zIndex: 5,
        }
      ]}
    >
      {/* Top bar */}
      <View style={styles.topControls}>
        <Text style={styles.videoTitle}>{title}</Text>
      </View>

      {/* Center controls */}
      <View style={styles.centerControls}>
        <TouchableOpacity onPress={skip10Backward} style={styles.skipButton}>
          <Ionicons name="play-back" size={40} color="white" />
          <Text style={styles.skipText}>10</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleTogglePlay} style={styles.playButton}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={60} 
            color="white" 
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={skip10Forward} style={styles.skipButton}>
          <Ionicons name="play-forward" size={40} color="white" />
          <Text style={styles.skipText}>10</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {renderProgressBar()}
        
        <View style={styles.controlsRow}>
          <View style={styles.leftControls}>
            <TouchableOpacity onPress={handleTogglePlay}>
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowVolumeSlider(!showVolumeSlider)}
              style={styles.controlButton}
            >
              <Ionicons 
                name={volume === 0 ? "volume-mute" : "volume-high"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>

            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>

          <View style={styles.rightControls}>
            <TouchableOpacity 
              onPress={() => setShowSpeedMenu(!showSpeedMenu)}
              style={styles.controlButton}
            >
              <Text style={styles.speedText}>{playbackRate}x</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowQualityMenu(!showQualityMenu)}
              style={styles.controlButton}
            >
              <Ionicons name="settings" size={24} color="white" />
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

      {/* Quality menu */}
      {showQualityMenu && (
        <View style={styles.qualityMenu}>
          <Text style={styles.menuTitle}>Quality</Text>
          {availableQualities.map((quality) => (
            <TouchableOpacity
              key={quality}
              onPress={() => handleQualityChange(quality)}
              style={[
                styles.menuItem,
                selectedQuality === quality && styles.selectedMenuItem
              ]}
            >
              <Text style={styles.menuItemText}>{quality}</Text>
              {selectedQuality === quality && (
                <Ionicons name="checkmark" size={20} color="#e50914" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Speed menu */}
      {showSpeedMenu && (
        <View style={styles.speedMenu}>
          <Text style={styles.menuTitle}>Playback Speed</Text>
          {playbackSpeeds.map((speed) => (
            <TouchableOpacity
              key={speed}
              onPress={() => handleSpeedChange(speed)}
              style={[
                styles.menuItem,
                playbackRate === speed && styles.selectedMenuItem
              ]}
            >
              <Text style={styles.menuItemText}>{speed}x</Text>
              {playbackRate === speed && (
                <Ionicons name="checkmark" size={20} color="#e50914" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  )

  // Wrap the entire player in a web-only container so fullscreen includes the overlays
  if (Platform.OS === 'web') {
    return (
      <div
        ref={containerRef}
        data-evp-root
        style={{ width: '100%', height: '100%', minHeight: '100vh', maxHeight: '100vh', position: 'relative', backgroundColor: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onMouseMove={() => resetControlsTimer()}
        onClick={() => { setShowControls(true); resetControlsTimer() }}
        onTouchStart={() => resetControlsTimer()}
      >
        <style>{`
          /* Ensure fullscreen element truly fills the screen and removes any gaps */
          div[data-evp-root]:fullscreen { width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; display: flex; overflow: hidden !important; }
          div[data-evp-root]:-webkit-full-screen { width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; display: flex; overflow: hidden !important; }
          div[data-evp-root]:fullscreen video, div[data-evp-root]:-webkit-full-screen video { width: 100vw !important; height: 100vh !important; object-fit: cover !important; }
          /* Hide scrollbars for player container */
          div[data-evp-root] { overflow: hidden !important; }
        `}</style>
        <View style={styles.container}>
          {/* Video Player */}
          {renderVideoPlayer()}

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}

          {/* Buffering Overlay */}
          {buffering && !loading && (
            <View style={styles.bufferingOverlay}>
              <View style={styles.spinner} />
            </View>
          )}

          {/* Error Overlay */}
          {error && (
            <View style={styles.errorOverlay}>
              <Ionicons name="alert-circle" size={60} color="#e50914" />
              <Text style={styles.errorTitle}>Playback Error</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => { setError(null); setLoading(true) }}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Controls */}
          {!error && renderControls()}

          {/* Watermark - top-right edge */}
          {!error && (
            <View style={{ position: 'absolute', top: 30, right: 0, opacity: 0.6, zIndex: 50, pointerEvents: 'none', backgroundColor: 'transparent' }}>
              <Image source={logoWatermark} style={{ width: 120, height: 48 }} resizeMode={'contain'} />
            </View>
          )}
        </View>
      </div>
    )
  }

  return (
    <View style={styles.container}>
      {/* Video Player */}
      {renderVideoPlayer()}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.spinner} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Buffering Overlay */}
      {buffering && !loading && (
        <View style={styles.bufferingOverlay}>
          <View style={styles.spinner} />
        </View>
      )}

      {/* Error Overlay */}
      {error && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle" size={60} color="#e50914" />
          <Text style={styles.errorTitle}>Playback Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null)
              setLoading(true)
              // Retry logic here
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controls */}
      {!error && renderControls()}

      {/* Watermark - top-right edge */}
      {!error && (
        <View
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            opacity: 0.6,
            zIndex: 50,
            pointerEvents: 'none',
            backgroundColor: 'transparent'
          }}
        >
          <Image source={logoWatermark} style={{ width: 120, height: 48 }} resizeMode={'contain'} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    padding: 20,
  },
  skipButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 15,
  },
  skipText: {
    color: 'white',
    fontSize: 12,
    marginTop: -5,
  },
  bottomControls: {
    gap: 10,
  },
  progressContainer: {
    height: 20,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e50914',
    borderRadius: 2,
  },
  progressHandle: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#e50914',
    borderRadius: 8,
    marginLeft: -8,
  },
  tooltip: {
    position: 'absolute',
    top: -30,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 4,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  controlButton: {
    padding: 5,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
  },
  speedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  qualityMenu: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
  },
  speedMenu: {
    position: 'absolute',
    bottom: 80,
    right: 140,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
  },
  menuTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  selectedMenuItem: {
    backgroundColor: 'rgba(229,9,20,0.2)',
  },
  menuItemText: {
    color: 'white',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  spinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: '#e50914',
    // Add rotation animation here if needed
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#e50914',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default EnhancedVideoPlayer


