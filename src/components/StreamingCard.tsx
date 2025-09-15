import React, { useState, useRef, useEffect } from 'react';
import { Content, StreamingUrl } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ShakaPlayerPro from './ShakaPlayerPro';

interface StreamingCardProps {
  content: Content;
  streamingUrls?: StreamingUrl[];
  size?: 'small' | 'medium' | 'large';
  onPlay?: (contentId: string) => void;
  onMoreInfo?: (contentId: string) => void;
  onAddToWatchlist?: (contentId: string) => void;
  onRemoveFromWatchlist?: (contentId: string) => void;
  isInWatchlist?: boolean;
  progressPercent?: number; // 0 to 1 progress for recently watched
}

export default function StreamingCard({
  content,
  streamingUrls,
  size = 'medium',
  onPlay,
  onMoreInfo,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isInWatchlist = false,
  progressPercent
}: StreamingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const dimensions = {
    small: { width: 200, height: 112 },
    medium: { width: 320, height: 180 },
    large: { width: 400, height: 225 }
  };

  const currentSize = dimensions[size];
  const bestStreamUrl = streamingUrls?.[0]?.resolutions?.['1080p'] || 
                      streamingUrls?.[0]?.resolutions?.['720p'] || 
                      streamingUrls?.[0]?.resolutions?.['480p'] ||
                      Object.values(streamingUrls?.[0]?.resolutions || {})[0];

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Delay showing preview to avoid flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 800);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);
    setIsPlaying(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(content.contentId);
    }
  };

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWatchlist && onRemoveFromWatchlist) {
      onRemoveFromWatchlist(content.contentId);
    } else if (!isInWatchlist && onAddToWatchlist) {
      onAddToWatchlist(content.contentId);
    }
  };

  const handleMoreInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoreInfo) {
      onMoreInfo(content.contentId);
    }
  };

  const handleCardClick = () => {
    if (onPlay) {
      onPlay(content.contentId);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`streaming-card ${isHovered ? 'hovered' : ''}`}
      style={{
        width: currentSize.width,
        height: isHovered && showPreview ? currentSize.height + 120 : currentSize.height,
        marginRight: 8,
        marginBottom: isHovered && showPreview ? 120 : 0,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.08) translateY(-8px)' : 'scale(1)',
        zIndex: isHovered ? 10 : 1,
        position: 'relative'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      {/* Main Card */}
      <div
        style={{
          width: '100%',
          height: currentSize.height,
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#141414',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Thumbnail */}
        {content.thumbnailUrl ? (
          <img
            src={content.thumbnailUrl}
            alt={content.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2a2a2a',
              color: '#666'
            }}
          >
            <div style={{ fontSize: 48 }}>🎬</div>
          </div>
        )}

        {/* Progress bar (recently watched) */}
        {typeof progressPercent === 'number' && progressPercent > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.15)'
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(1, progressPercent)) * 100}%`,
                height: '100%',
                backgroundColor: '#e50914'
              }}
            />
          </div>
        )}

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 80%)'
          }}
        />

        {/* Title Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            right: 8,
            color: 'white'
          }}
        >
          <h3
            style={{
              fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 15,
              fontWeight: 700,
              margin: 0,
              textShadow: '0 2px 6px rgba(0,0,0,0.9)',
              letterSpacing: '0.3px'
            }}
          >
            {content.title}
          </h3>
        </div>

        {/* Play Button Overlay */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={handlePlay}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: '12px solid transparent',
                borderBottom: '12px solid transparent',
                borderLeft: '18px solid #000',
                marginLeft: 4
              }}
            />
          </div>
        )}
      </div>

      {/* Expanded Preview */}
      {isHovered && showPreview && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#141414',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            zIndex: 20
          }}
        >
          {/* Video Preview */}
          <div style={{ width: '100%', height: currentSize.height, position: 'relative' }}>
            {isPlaying && bestStreamUrl ? (
              <ShakaPlayerPro
                src={bestStreamUrl}
                autoPlay={true}
                muted={true}
                style={{ width: '100%', height: '100%' }}
                onError={() => setIsPlaying(false)}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: content.thumbnailUrl ? `url(${content.thumbnailUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => bestStreamUrl && setIsPlaying(true)}
              >
                {!content.thumbnailUrl && <div style={{ fontSize: 48, color: '#666' }}>🎬</div>}
                <div
                  style={{
                    position: 'absolute',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: '12px solid transparent',
                      borderBottom: '12px solid transparent',
                      borderLeft: '18px solid #000',
                      marginLeft: 4
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content Info */}
          <div style={{ padding: 16 }}>
            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <button
                onClick={handlePlay}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderLeft: '12px solid #000',
                    marginLeft: 2
                  }}
                />
              </button>

              <button
                onClick={handleWatchlistToggle}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '2px solid #666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                {isInWatchlist ? '✓' : '+'}
              </button>

              {onMoreInfo && (
                <button
                  onClick={handleMoreInfo}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #666',
                    borderRadius: 4,
                    color: 'white',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>ℹ</span>
                  More Info
                </button>
              )}
            </div>

            {/* Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {content.ageRating && (
                <span
                  style={{
                    padding: '2px 6px',
                    backgroundColor: '#666',
                    borderRadius: 2,
                    fontSize: 10,
                    color: 'white'
                  }}
                >
                  {content.ageRating}
                </span>
              )}
              {content.duration && (
                <span style={{ fontSize: 12, color: '#ccc' }}>{content.duration}</span>
              )}
              {content.genre && (
                <span style={{ fontSize: 12, color: '#ccc' }}>{content.genre}</span>
              )}
            </div>

            {/* Description */}
            {content.description && (
              <p
                style={{
                  fontSize: 12,
                  color: '#ccc',
                  margin: 0,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {content.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
