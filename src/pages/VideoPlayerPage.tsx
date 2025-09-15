import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { BACKEND_URL } from '../config';
import { contentAPI, Content, StreamingUrl } from '../services/api';
import ShakaPlayerPro from '../components/ShakaPlayerPro';

interface VideoPlayerPageProps {
  contentId: string;
  autoplay?: boolean;
  fullscreen?: boolean;
}

export default function VideoPlayerPage({ contentId, autoplay = false, fullscreen = false }: VideoPlayerPageProps) {
  const { user } = useAuth();
  const [content, setContent] = useState<Content | null>(null);
  const [streamingUrls, setStreamingUrls] = useState<StreamingUrl[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);

  useEffect(() => {
    loadContent();
  }, [contentId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError('');

      // Load content details
      const contentData = await contentAPI.getContentById(contentId);
      setContent(contentData);

      // Load streaming URLs
      const streamingData = await contentAPI.getStreamingUrls(contentId);
      setStreamingUrls(streamingData.streaming);

      // Select best quality by default
      if (streamingData.streaming.length > 0) {
        const firstStream = streamingData.streaming[0];
        if (firstStream.resolutions['1080p']) {
          setSelectedQuality('1080p');
        } else if (firstStream.resolutions['720p']) {
          setSelectedQuality('720p');
        } else if (firstStream.resolutions['480p']) {
          setSelectedQuality('480p');
        } else {
          const availableQualities = Object.keys(firstStream.resolutions);
          setSelectedQuality(availableQualities[0] || '');
        }
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load video content');
    } finally {
      setLoading(false);
    }
  };

  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
  };

  const handleGoBack = () => {
    if (Platform.OS === 'web') {
      window.history.back();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (Platform.OS === 'web') {
      if (!isFullscreen) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  const selectedStream = streamingUrls[0];
  const selectedStreamUrlRaw = selectedStream?.resolutions?.[selectedQuality as keyof typeof selectedStream.resolutions];
  const toProxiedHls = (url: string) => `${BACKEND_URL}/proxy/hls?url=${encodeURIComponent(url)}`;
  const selectedStreamUrl = selectedStreamUrlRaw ? toProxiedHls(selectedStreamUrlRaw as string) : undefined;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        backgroundColor: '#000',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div>Loading video...</div>
        </div>
      </div>
    );
  }

  if (error || !content || !selectedStream) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        backgroundColor: '#000',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ marginBottom: 20 }}>
            {error || 'Video not available'}
          </div>
          <button
            onClick={handleGoBack}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e50914',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          overflow: 'hidden'
        }}
      >
        {/* Video Player */}
        {selectedStreamUrl && (
          <ShakaPlayerPro
            src={selectedStreamUrl}
            autoPlay={autoplay}
            style={{
              width: '100%',
              height: '100%'
            }}
            onError={(error) => setError('Failed to load video stream')}
          />
        )}

        {/* Controls Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            opacity: 1,
            transition: 'opacity 0.3s ease'
          }}
        >
          {/* Back Button */}
          <button
            onClick={handleGoBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: 24,
              cursor: 'pointer',
              padding: 8,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Back
          </button>

          {/* Video Info */}
          <div style={{ color: 'white', textAlign: 'center', flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
              {content.title}
            </h1>
            {content.genre && (
              <div style={{ fontSize: 14, color: '#ccc', marginTop: 4 }}>
                {content.genre} • {content.duration}
              </div>
            )}
          </div>

          {/* Quality Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={selectedQuality}
              onChange={(e) => handleQualityChange(e.target.value)}
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: '1px solid #666',
                borderRadius: 4,
                padding: '6px 12px',
                fontSize: 14
              }}
            >
              {selectedStream && Object.keys(selectedStream.resolutions).map(quality => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>

            <button
              onClick={toggleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: 20,
                cursor: 'pointer',
                padding: 8
              }}
            >
              {isFullscreen ? '⊡' : '⊞'}
            </button>
          </div>
        </div>

        {/* Bottom Info Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            padding: 20,
            color: 'white',
            zIndex: 10
          }}
        >
          {content.description && (
            <p style={{ 
              margin: 0, 
              fontSize: 16, 
              lineHeight: 1.4, 
              maxWidth: 600,
              opacity: 0.9
            }}>
              {content.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Native version would use ExoPlayer for Android, AVPlayer for iOS
  return null;
}
