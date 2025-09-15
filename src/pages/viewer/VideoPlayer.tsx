import React, { useEffect, useState, useRef } from 'react'
import { Platform } from 'react-native'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import UnifiedVideoPlayer from '../../components/UnifiedVideoPlayer'
import EnhancedVideoPlayer from '../../components/EnhancedVideoPlayer'
import { userAPI } from '../../services/api'
import { BACKEND_URL } from '../../config'

// Platform-specific imports
let View: any = null
let Text: any = null
let TouchableOpacity: any = null
let StyleSheet: any = null

if (Platform.OS !== 'web') {
  const RN = require('react-native')
  View = RN.View
  Text = RN.Text
  TouchableOpacity = RN.TouchableOpacity
  StyleSheet = RN.StyleSheet
}

interface StreamingData {
  streamId: string
  contentId: string
  resolutions: {
    '4k'?: string
    '1080p'?: string
    '720p'?: string
    '480p'?: string
    '360p'?: string
  }
  createdAt: string
}

interface ContentData {
  contentId: string
  title: string
  type: string
  status: string
  releaseDate?: string
  ageRating?: string
  duration?: string
  genre?: string
  language?: string
  uploadedBy?: string
  thumbnailUrl?: string
}

export default function VideoPlayer() {
  const { user, loading: authLoading } = useAuth()
  const { contentId } = useParams<{ contentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [content, setContent] = useState<ContentData | null>(null)
  const [streams, setStreams] = useState<StreamingData[]>([])
  const [selectedStream, setSelectedStream] = useState<StreamingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialPosition, setInitialPosition] = useState<number>(0)
  const playerSectionRef = useRef<HTMLDivElement | null>(null)
  const lastProgressSentAtRef = useRef<number>(0)

  // Helper function to get the best quality stream URL
  const toProxiedHls = (url: string) => `${BACKEND_URL}/proxy/hls?url=${encodeURIComponent(url)}`
  const getStreamUrl = (stream: StreamingData): string => {
    const resolutions = stream.resolutions
    // Priority order: 1080p -> 720p -> 480p -> 360p -> 4k (4k last due to bandwidth)
    const raw = resolutions['1080p'] || 
           resolutions['720p'] || 
           resolutions['480p'] || 
           resolutions['360p'] || 
           resolutions['4k'] || 
           ''
    return raw ? toProxiedHls(raw) : ''
  }

  useEffect(() => {
    if (authLoading) return // Wait for auth to load
    
    if (!user) {
      navigate('/login')
      return
    }

    if (!contentId) {
      navigate('/')
      return
    }

    const fetchVideoData = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log('[VideoPlayer] Fetching content:', contentId)
        
        // Fetch content details
        const contentRes = await api.get(`/content/${contentId}`)
        const contentData = contentRes.data
        setContent(contentData)
        console.log('[VideoPlayer] Content data:', contentData)

        // Fetch streaming data
        const streamRes = await api.get(`/content/${contentId}/streaming`)
        const streamData = streamRes.data?.streaming || []
        setStreams(streamData)
        console.log('[VideoPlayer] Stream data:', streamData)

        // Get watch history to check for last position
        let resumePosition = 0
        try {
          const historyResponse = await userAPI.getWatchHistory(user.userId)
          const contentHistory = historyResponse.history.find(h => h.contentId === contentId)
          if (contentHistory?.lastPosition) {
            // Parse HH:MM:SS format
            const parts = contentHistory.lastPosition.split(':').map(x => parseInt(x || '0', 10))
            if (parts.length === 3) {
              resumePosition = parts[0] * 3600 + parts[1] * 60 + parts[2]
              console.log('[VideoPlayer] Found resume position:', resumePosition, 'seconds')
            }
          }
        } catch (err) {
          console.warn('[VideoPlayer] Could not fetch watch history:', err)
        }
        setInitialPosition(resumePosition)

        // Select best quality stream
        const bestStream = streamData[0] // Take the first stream since it contains all resolutions
        
        if (bestStream) {
          setSelectedStream(bestStream)
          console.log('[VideoPlayer] Selected stream:', bestStream)
          // Bring the player into view
          setTimeout(() => {
            try {
              playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } catch {}
          }, 0)
          // Auto fullscreen + autoplay if query params request
          const params = new URLSearchParams(location.search)
          const shouldFs = params.get('fs') === '1'
          const shouldAutoplay = params.get('autoplay') === '1'
          if (shouldFs || shouldAutoplay) {
            setTimeout(() => {
              const video: any = document.querySelector('video')
              if (video) {
                if (shouldFs) {
                  try {
                    if (video.requestFullscreen) video.requestFullscreen()
                    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen()
                  } catch {}
                }
                if (shouldAutoplay) {
                  video.play().catch(() => {})
                }
              }
            }, 300)
          }
        } else {
          setError('No streaming URLs available for this content')
        }

      } catch (err: any) {
        console.error('[VideoPlayer] Error fetching data:', err)
        const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to load video'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchVideoData()
  }, [contentId, navigate, user, authLoading])

  // Web: lock page scroll while the full-screen player is mounted
  useEffect(() => {
    if (Platform.OS === 'web') {
      const html = document.documentElement as HTMLElement
      const body = document.body as HTMLBodyElement
      const root = document.getElementById('root') as HTMLElement | null

      const prev = {
        htmlOverflow: html?.style?.overflow || '',
        bodyOverflow: body?.style?.overflow || '',
        htmlHeight: html?.style?.height || '',
        bodyHeight: body?.style?.height || '',
        rootOverflow: root?.style?.overflow || '',
        rootHeight: root?.style?.height || ''
      }

      try {
        if (html) { html.style.overflow = 'hidden'; html.style.height = '100%'}
        if (body) { body.style.overflow = 'hidden'; body.style.height = '100%'}
        if (root) { root.style.overflow = 'hidden'; root.style.height = '100%'}
      } catch {}

      return () => {
        try {
          if (html) { html.style.overflow = prev.htmlOverflow; html.style.height = prev.htmlHeight }
          if (body) { body.style.overflow = prev.bodyOverflow; body.style.height = prev.bodyHeight }
          if (root) { root.style.overflow = prev.rootOverflow; root.style.height = prev.rootHeight }
        } catch {}
      }
    }
    return undefined
  }, [])

  const handlePlayerError = (error: any) => {
    console.error('[VideoPlayer] Player error:', error)
    
    // Handle specific error types
    let errorMessage = 'Video playback failed. Please check your connection and try again.'
    
    if (error?.code === 1002) {
      errorMessage = 'CORS Error: Video cannot be loaded due to cross-origin restrictions. This usually means the video server needs CORS configuration.'
    } else if (error?.code === 1001) {
      errorMessage = 'Network Error: Unable to connect to video server. Please check your internet connection.'
    } else if (error?.code === 1003) {
      errorMessage = 'Video Format Error: The video format is not supported or corrupted.'
    }
    
    setError(errorMessage)
  }

  const handlePlayerLoad = () => {
    console.log('[VideoPlayer] Video loaded successfully')
    setError(null)
  }

  const handleQualityChange = (quality: string) => {
    if (selectedStream) {
      console.log('[VideoPlayer] Quality changed to:', quality)
      // The stream object contains all resolutions, so we just need to trigger a re-render
      // The getStreamUrl function will pick the right resolution based on user preference
    }
  }

  const handleBack = () => {
    if (Platform.OS === 'web') {
      navigate(-1)
    } else {
      // Handle native navigation
      console.log('Navigate back')
    }
  }

  if (Platform.OS === 'web') {
    // Web implementation
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0f0f14 25%, #000000 50%, #0f0f14 75%, #1a1a1a 100%), linear-gradient(135deg, rgba(204, 85, 0, 0.05) 0%, transparent 50%, rgba(112, 130, 56, 0.03) 100%)', backgroundAttachment: 'fixed'}}>
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0f0f14 25%, #000000 50%, #0f0f14 75%, #1a1a1a 100%), linear-gradient(135deg, rgba(204, 85, 0, 0.05) 0%, transparent 50%, rgba(112, 130, 56, 0.03) 100%)', backgroundAttachment: 'fixed'}}>
          <div className="text-center text-white max-w-2xl">
            <div className="text-orange-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Video Not Available</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            
            {error.includes('CORS') && (
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-yellow-300 mb-3">CORS Configuration Required</h3>
                <div className="text-yellow-200 text-sm space-y-2">
                  <p><strong>Problem:</strong> The CloudFront video server doesn't allow cross-origin access.</p>
                  <p><strong>Fix:</strong> Add CORS headers on CloudFront (or S3 origin). Minimum:</p>
                  <div className="bg-gray-800 p-3 rounded text-xs font-mono">
                    Access-Control-Allow-Origin: http://localhost:8081<br/>
                    Access-Control-Allow-Methods: GET, HEAD, OPTIONS<br/>
                    Access-Control-Allow-Headers: Range<br/>
                    Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleBack}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        <div ref={playerSectionRef} className="absolute inset-0 overflow-hidden">
          {selectedStream ? (
            <EnhancedVideoPlayer
              src={getStreamUrl(selectedStream)}
              title={content?.title}
              autoPlay={true}
              muted={false}
              onError={handlePlayerError}
              onLoad={handlePlayerLoad}
              resolutions={selectedStream.resolutions}
              initialPosition={initialPosition}
              onProgress={async ({ currentTime, duration }) => {
                try {
                  if (!user || !contentId) return
                  // Throttle: send at most once every 15s
                  const nowSec = Math.floor(currentTime)
                  if (nowSec - (lastProgressSentAtRef.current || 0) < 15) return
                  lastProgressSentAtRef.current = nowSec
                  // Format HH:MM:SS
                  const hrs = Math.floor(nowSec / 3600)
                  const mins = Math.floor((nowSec % 3600) / 60)
                  const secs = nowSec % 60
                  const hh = hrs.toString().padStart(2, '0')
                  const mm = mins.toString().padStart(2, '0')
                  const ss = secs.toString().padStart(2, '0')
                  await userAPI.upsertWatchHistory({
                    userId: user.userId,
                    contentId: contentId,
                    lastPosition: `${hh}:${mm}:${ss}`,
                  })
                } catch (e) {
                  // swallow errors to avoid interrupting playback
                }
              }}
              onEnd={async () => {
                try {
                  if (!user || !contentId) return
                  // Send final position
                  const finalSec = Math.max(lastProgressSentAtRef.current || 0, 0)
                  const hrs = Math.floor(finalSec / 3600)
                  const mins = Math.floor((finalSec % 3600) / 60)
                  const secs = finalSec % 60
                  const hh = hrs.toString().padStart(2, '0')
                  const mm = mins.toString().padStart(2, '0')
                  const ss = secs.toString().padStart(2, '0')
                  await userAPI.upsertWatchHistory({
                    userId: user.userId,
                    contentId: contentId,
                    lastPosition: `${hh}:${mm}:${ss}`,
                  })
                } catch {}
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  } else {
    // Native implementation
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: 'black',
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      loadingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 10,
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      errorIcon: {
        fontSize: 60,
        marginBottom: 20,
      },
      errorTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
      },
      errorText: {
        color: '#9ca3af',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
      },
      backButton: {
        backgroundColor: '#CC5500',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
      },
      backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
      },
    })

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Video Not Available</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )
    }

    // Native video player implementation
    return (
      <View style={styles.container}>
        {selectedStream && (
          <UnifiedVideoPlayer
            src={getStreamUrl(selectedStream)}
            title={content?.title}
            autoPlay={true}
            muted={false}
            onLoad={handlePlayerLoad}
            onError={handlePlayerError}
            onProgress={({ currentTime, duration }) => {
              // Handle progress updates if needed
            }}
            onEnd={() => {
              // Handle video end if needed
            }}
          />
        )}
      </View>
    )
  }
}