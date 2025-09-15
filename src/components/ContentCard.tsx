import React, { useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { useNavigate } from 'react-router-dom'

// Platform-specific imports
let ShakaPlayerPro: any = null
let TouchableOpacity: any = null
let View: any = null
let Text: any = null
let Image: any = null
let StyleSheet: any = null

if (Platform.OS === 'web') {
  // Web-specific imports
  try {
    ShakaPlayerPro = require('./ShakaPlayerPro').default
  } catch (e) {
    console.warn('ShakaPlayerPro not available:', e)
  }
} else {
  // Native-specific imports
  const RN = require('react-native')
  TouchableOpacity = RN.TouchableOpacity
  View = RN.View
  Text = RN.Text
  Image = RN.Image
  StyleSheet = RN.StyleSheet
}

interface ContentCardProps {
  item: {
    contentId: string
    title: string
    type: string
    genre?: string
    duration?: string
    thumbnailUrl?: string
    ageRating?: string
    rating?: number
    description?: string
  }
  streamUrl?: string
  size?: 'small' | 'medium' | 'large'
  featured?: boolean
}

export default function ContentCard({ item, streamUrl, size = 'medium', featured = false }: ContentCardProps) {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleClick = () => {
    if (Platform.OS === 'web') {
      navigate(`/watch/${item.contentId}`)
    } else {
      // Native navigation will be handled by react-navigation
      console.log('Navigate to video player:', item.contentId)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'content-card-small'
      case 'large': 
        return 'content-card-large'
      default:
        return 'content-card-medium'
    }
  }

  if (Platform.OS === 'web') {
    const sizeStyle = useMemo(() => {
      switch (size) {
        case 'small':
          return { width: 192, height: 112 }
        case 'large':
          return { width: 320, height: 180 }
        default:
          return { width: 256, height: 144 }
      }
    }, [size])

    return (
      <div 
        style={{ width: sizeStyle.width, marginRight: 16, cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsPlaying(false)
        }}
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', width: '100%', height: sizeStyle.height, borderRadius: 8, overflow: 'hidden', background: '#27272a' }}>
          {item.thumbnailUrl ? (
            <img 
              src={item.thumbnailUrl} 
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 32 }}>🎬</div>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)' }} />
          
          {/* Content info overlay */}
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, color: 'white' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d4d4d8' }}>
              {item.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width={14} height={14} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
                              fill={i < Math.floor(item.rating || 0) ? '#fff' : 'rgba(255,255,255,0.2)'} />
                      </svg>
                    ))}
                  </div>
                  <span>{(item.rating ?? 0).toFixed(1)}</span>
                </div>
              )}
              {item.ageRating && (
                <span style={{ backgroundColor: '#3f3f46', padding: '2px 4px', borderRadius: 4, color: 'white', fontSize: 10 }}>{item.ageRating}</span>
              )}
              {item.duration && <span>{item.duration}</span>}
              {item.genre && <span>{item.genre}</span>}
            </div>
          </div>
        </div>

        {/* Hover Preview (Streaming platform style) */}
        {isHovered && streamUrl && ShakaPlayerPro && (
          <div style={{ width: sizeStyle.width, background: '#0b0b0f', borderRadius: 8, marginTop: 8 }}>
            {/* Video Preview */}
            <div style={{ width: '100%', height: sizeStyle.height, overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              {isPlaying ? (
                <ShakaPlayerPro
                  src={streamUrl}
                  autoPlay={true}
                  muted={true}
                  className="w-full h-full"
                  onError={() => setIsPlaying(false)}
                />
              ) : (
                <div 
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsPlaying(true)
                  }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ marginLeft: 4, width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '16px solid #CC5500' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  } else {
    // Native component
    const styles = StyleSheet.create({
      container: {
        width: size === 'small' ? 192 : size === 'large' ? 320 : 256,
        height: size === 'small' ? 112 : size === 'large' ? 192 : 144,
        backgroundColor: '#18181b',
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
      },
      image: {
        width: '100%',
        height: '100%',
      },
      overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
      },
      title: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
      },
      metadata: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      metadataText: {
        color: '#a1a1aa',
        fontSize: 12,
      },
      ageRating: {
        backgroundColor: '#3f3f46',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 10,
        color: 'white',
      },
      placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#27272a',
        justifyContent: 'center',
        alignItems: 'center',
      },
      placeholderText: {
        fontSize: 32,
      },
    })

    return (
      <TouchableOpacity style={styles.container} onPress={handleClick}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>🎬</Text>
          </View>
        )}
        
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metadata}>
            {item.ageRating && (
              <Text style={styles.ageRating}>{item.ageRating}</Text>
            )}
            {item.duration && (
              <Text style={styles.metadataText}>{item.duration}</Text>
            )}
            {item.genre && (
              <Text style={styles.metadataText}>{item.genre}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }
}

