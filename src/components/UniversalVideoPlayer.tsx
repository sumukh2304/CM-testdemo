import React from 'react';
import { Platform } from 'react-native';
import ShakaPlayerPro from './ShakaPlayerPro';
import AndroidVideoPlayer from '../native/AndroidVideoPlayer';
import IOSVideoPlayer from '../native/IOSVideoPlayer';

interface UniversalVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onError?: (error: any) => void;
  onLoad?: () => void;
  onProgress?: (progress: { currentTime: number; duration: number }) => void;
  style?: any;
  className?: string;
}

export default function UniversalVideoPlayer({
  src,
  autoPlay = false,
  muted = false,
  loop = false,
  onError,
  onLoad,
  onProgress,
  style,
  className
}: UniversalVideoPlayerProps) {
  
  // Web: Use Shaka Player for HLS/DASH streaming
  if (Platform.OS === 'web') {
    return (
      <ShakaPlayerPro
        src={src}
        autoPlay={autoPlay}
        muted={muted}
        style={style}
        className={className}
        onError={onError}
        onLoad={onLoad}
        onProgress={onProgress}
      />
    );
  }
  
  // Android: Use ExoPlayer for optimal performance
  if (Platform.OS === 'android') {
    return (
      <AndroidVideoPlayer
        src={src}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        onError={onError}
        onLoad={onLoad}
        onProgress={onProgress}
        style={style}
      />
    );
  }
  
  // iOS: Use AVPlayer for native iOS experience
  if (Platform.OS === 'ios') {
    return (
      <IOSVideoPlayer
        src={src}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        onError={onError}
        onLoad={onLoad}
        onProgress={onProgress}
        style={style}
      />
    );
  }
  
  return null;
}
