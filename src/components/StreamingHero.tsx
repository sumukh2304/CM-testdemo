import React, { useState, useEffect } from 'react';
import { Content, StreamingUrl } from '../services/api';
import ShakaPlayerPro from './ShakaPlayerPro';

interface StreamingHeroProps {
  featuredContent: Content;
  streamingUrls?: StreamingUrl[];
  onPlay?: (contentId: string) => void;
  onMoreInfo?: (contentId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function StreamingHero({
  featuredContent,
  streamingUrls,
  onPlay,
  onMoreInfo,
  onPrev,
  onNext,
}: StreamingHeroProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const bestStreamUrl = streamingUrls?.[0]?.resolutions?.['1080p'] || 
                      streamingUrls?.[0]?.resolutions?.['720p'] || 
                      streamingUrls?.[0]?.resolutions?.['480p'] ||
                      Object.values(streamingUrls?.[0]?.resolutions || {})[0];

  // Add responsive flags
  const [isSmall, setIsSmall] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 480 : false);
  const [isMedium, setIsMedium] = useState<boolean>(typeof window !== 'undefined' ? (window.innerWidth > 480 && window.innerWidth <= 768) : false);

  useEffect(() => {
    // Disable autoplay preview to avoid CORS-triggered media requests on web
    return () => {};
  }, [bestStreamUrl, isPlaying]);

  // Update responsive flags on resize
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsSmall(w <= 480);
      setIsMedium(w > 480 && w <= 768);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlePlay = () => {
    if (onPlay) {
      onPlay(featuredContent.contentId);
    }
  };

  const handleMoreInfo = () => {
    if (onMoreInfo) {
      onMoreInfo(featuredContent.contentId);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: isSmall ? '56vh' : isMedium ? '68vh' : '80vh',
        minHeight: isSmall ? 380 : isMedium ? 500 : 600,
        overflow: 'hidden',
        marginBottom: isSmall ? 20 : 40
      }}
    >
      {/* Background Video/Image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {/* Autoplay disabled: always render thumbnail as background */}
        <img
          src={featuredContent.thumbnailUrl || '/api/placeholder/hero'}
          alt={featuredContent.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center'
          }}
        />
      </div>

      {/* Gradient Overlays */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)'
        }}
      />

      {/* Left/Right navigation arrows */}
      {!isSmall && (
        <button
          aria-label="Previous"
          onClick={onPrev}
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 36,
            height: 54,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            cursor: 'pointer',
            zIndex: 4,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          &#9664;
        </button>
      )}

      {!isSmall && (
        <button
          aria-label="Next"
          onClick={onNext}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 36,
            height: 54,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            cursor: 'pointer',
            zIndex: 4,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          &#9654;
        </button>
      )}

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          left: isSmall ? 16 : isMedium ? 32 : 60,
          bottom: isSmall ? 60 : isMedium ? 90 : 120,
          maxWidth: isSmall ? 320 : isMedium ? 520 : 600,
          zIndex: 2
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: isSmall ? 28 : isMedium ? 44 : 64,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            marginBottom: isSmall ? 10 : 16,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            lineHeight: 1.1
          }}
        >
          {featuredContent.title}
        </h1>

        {/* Metadata */}
        <div
          style={{
            display: 'flex',
            alignItems: isSmall ? 'flex-start' : 'center',
            gap: isSmall ? 10 : 16,
            marginBottom: isSmall ? 12 : 20,
            fontSize: isSmall ? 12 : 16,
            color: '#e5e5e5'
          }}
        >
          {featuredContent.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#46d369', fontWeight: 600 }}>
                {Math.round((featuredContent.rating || 0) * 10)}% Match
              </span>
            </div>
          )}
          {featuredContent.duration && (
            <span>{featuredContent.duration}</span>
          )}
          <span
            style={{
              padding: '2px 6px',
              backgroundColor: '#CC5500',
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            HD
          </span>
        </div>

        {/* Description */}
        {featuredContent.description && (
          <p
            style={{
              fontSize: isSmall ? 13 : 18,
              color: '#e5e5e5',
              lineHeight: 1.4,
              margin: 0,
              marginBottom: isSmall ? 16 : 28,
              maxWidth: isSmall ? 320 : 520,
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            {featuredContent.description}
          </p>
        )}

        {/* Action Buttons (Play and More Info) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? 8 : 14 }}>
          {/* Play Button */}
          <button
            onClick={handlePlay}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: isSmall ? '10px 18px' : '14px 32px',
              backgroundColor: '#CC5500',
              color: 'black',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 10,
              fontSize: isSmall ? 14 : 18,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              transition: 'transform 0.15s ease, background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e04a00';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#CC5500';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderLeft: '16px solid white'
              }}
            />
            Play
          </button>

          {/* More Info Button */}
          <button
            onClick={handleMoreInfo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: isSmall ? '10px 16px' : '14px 28px',
              backgroundColor: 'rgba(20,20,20,0.65)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.45)',
              borderRadius: 10,
              fontSize: isSmall ? 14 : 18,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(2px)',
              transition: 'transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(40,40,40,0.7)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(20,20,20,0.65)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            More Info
          </button>
        </div>
      </div>

      {/* Audio Toggle (kept hidden/no-op when autoplay disabled) */}
      {isPlaying && (
        <button
          onClick={() => setIsPlaying(false)}
          style={{
            position: 'absolute',
            bottom: 120,
            right: 60,
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'rgba(42, 42, 42, 0.6)',
            border: '1px solid rgba(255,255,255,0.5)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            zIndex: 3
          }}
        >
          🔇
        </button>
      )}
    </div>
  );
}
