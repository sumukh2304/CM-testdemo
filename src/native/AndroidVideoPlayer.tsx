import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import Video from 'react-native-video';

interface AndroidVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onError?: (error: any) => void;
  onLoad?: () => void;
  onProgress?: (progress: { currentTime: number; duration: number }) => void;
  style?: any;
  startPosition?: number;
}

export default function AndroidVideoPlayer({
  src,
  autoPlay = false,
  muted = false,
  loop = false,
  onError,
  onLoad,
  onProgress,
  style,
  startPosition = 0,
}: AndroidVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<any>(null);

  const handleLoad = (data: any) => {
    setIsLoading(false);
    try {
      if (startPosition && videoRef.current) {
        // seek expects seconds
        videoRef.current.seek(startPosition);
      }
    } catch {}
    if (onLoad) onLoad();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setError('Failed to load video');
    if (onError) onError(error);
  };

  const handleProgress = (data: any) => {
    if (onProgress) {
      onProgress({
        currentTime: data.currentTime,
        duration: data.seekableDuration || data.duration
      });
    }
  };

  if (Platform.OS !== 'android') {
    return null;
  }

  if (error) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>⚠️</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: src }}
        style={styles.player}
        paused={!autoPlay}
        muted={muted}
        repeat={loop}
        resizeMode="contain"
        onLoad={handleLoad}
        onError={handleError}
        onProgress={handleProgress}
        // Android ExoPlayer optimizations via react-native-video
        bufferConfig={{
          minBufferMs: 15000,
          maxBufferMs: 50000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
        // Remove problematic track selection for now
        // selectedVideoTrack and selectedTextTrack will use defaults
        useTextureView={true}
        maxBitRate={2000000}
        controls={true}
        playInBackground={false}
        playWhenInactive={false}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>⏳</Text>
            <Text style={styles.loadingMessage}>Loading video...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  player: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingMessage: {
    color: 'white',
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorMessage: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
