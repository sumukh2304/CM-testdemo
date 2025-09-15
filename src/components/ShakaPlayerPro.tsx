import React from 'react'
import { Platform, View } from 'react-native'
import UnifiedVideoPlayer from './UnifiedVideoPlayer'

interface ShakaPlayerProProps {
  src: string
  poster?: string
  autoPlay?: boolean
  muted?: boolean
  className?: string
  title?: string
  onError?: (error: any) => void
  onLoad?: () => void
  onProgress?: (progress: { currentTime: number; duration: number }) => void
  style?: React.CSSProperties
  fit?: 'cover' | 'contain'
  autoFullscreen?: boolean
}

export default function ShakaPlayerPro({
  src,
  poster,
  autoPlay = false,
  muted = false,
  className = '',
  title,
  onError,
  onLoad,
  onProgress,
  style,
  fit = 'contain',
  autoFullscreen = true
}: ShakaPlayerProProps) {
  // Use the unified video player for all platforms
  return (
    <View style={Platform.OS === 'web' ? { flex: 1 } : { flex: 1 }}>
      <UnifiedVideoPlayer
        src={src}
        title={title}
        autoPlay={autoPlay}
        muted={muted}
        onLoad={onLoad}
        onError={onError}
        onProgress={onProgress || (({ currentTime, duration }) => {
          // Handle progress updates if needed
        })}
        onEnd={() => {
          // Handle video end if needed
        }}
      />
    </View>
  )
}