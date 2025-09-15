import React, { useEffect, useState } from 'react';
import { Content, StreamingUrl, contentAPI } from '../services/api';

interface MovieDetailsModalProps {
  content: Content | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (contentId: string) => void;
  onAddToWatchlist?: (contentId: string) => void;
  onRemoveFromWatchlist?: (contentId: string) => void;
  isInWatchlist?: boolean;
}

export default function MovieDetailsModal({
  content,
  isOpen,
  onClose,
  onPlay,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isInWatchlist = false
}: MovieDetailsModalProps) {
  const [streamingUrls, setStreamingUrls] = useState<StreamingUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailedContent, setDetailedContent] = useState<Content | null>(null);

  useEffect(() => {
    if (isOpen && content) {
      loadDetailedContent();
      loadStreamingUrls();
    }
  }, [isOpen, content]);

  const loadDetailedContent = async () => {
    if (!content) return;
    
    try {
      setLoading(true);
      const detailedContentData = await contentAPI.getContentById(content.contentId);
      setDetailedContent(detailedContentData);
    } catch (error) {
      console.error('Failed to load detailed content:', error);
      setDetailedContent(content); // Fallback to basic content
    } finally {
      setLoading(false);
    }
  };

  const loadStreamingUrls = async () => {
    if (!content) return;
    
    try {
      const streamingResponse = await contentAPI.getStreamingUrls(content.contentId);
      setStreamingUrls(streamingResponse.streaming);
    } catch (error) {
      console.error('Failed to load streaming URLs:', error);
    }
  };

  const handlePlay = () => {
    if (content) {
      onPlay(content.contentId);
      onClose();
    }
  };

  const handleWatchlistToggle = () => {
    if (!content) return;
    
    if (isInWatchlist && onRemoveFromWatchlist) {
      onRemoveFromWatchlist(content.contentId);
    } else if (!isInWatchlist && onAddToWatchlist) {
      onAddToWatchlist(content.contentId);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !content) return null;

  const displayContent = detailedContent || content;
  const bestStreamUrl = streamingUrls?.[0]?.resolutions?.['1080p'] || 
                       streamingUrls?.[0]?.resolutions?.['720p'] || 
                       streamingUrls?.[0]?.resolutions?.['480p'] ||
                       Object.values(streamingUrls?.[0]?.resolutions || {})[0];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        style={{
          backgroundColor: '#141414',
          borderRadius: 12,
          maxWidth: 800,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header with close button */}
        <div
          style={{
            position: 'relative',
            height: 300,
            backgroundImage: content.thumbnailUrl ? `url(${content.thumbnailUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#2a2a2a'
          }}
        >
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)'
            }}
          />
          
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: 'none',
              color: 'white',
              fontSize: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            ×
          </button>

          {/* Title and basic info overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              color: 'white'
            }}
          >
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                margin: '0 0 8px 0',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)'
              }}
            >
              {displayContent.title}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {displayContent.ageRating && (
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  {displayContent.ageRating}
                </span>
              )}
              {displayContent.duration && (
                <span style={{ fontSize: 14, opacity: 0.9 }}>
                  {displayContent.duration}
                </span>
              )}
              {displayContent.genre && (
                <span style={{ fontSize: 14, opacity: 0.9 }}>
                  {displayContent.genre}
                </span>
              )}
              {displayContent.language && (
                <span style={{ fontSize: 14, opacity: 0.9 }}>
                  {displayContent.language}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handlePlay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  backgroundColor: '#CC5500',
                  color: 'black',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#CC5500';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#CC5500';
                }}
              >
                 <div
                   style={{
                     width: 0,
                     height: 0,
                     borderTop: '8px solid transparent',
                     borderBottom: '8px solid transparent',
                     borderLeft: '12px solid white'
                   }}
                 />
                Play
              </button>

              <button
                onClick={handleWatchlistToggle}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(255, 255, 255, 0.6)',
                  color: 'white',
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'white';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                }}
              >
                {isInWatchlist ? '✓' : '+'}
              </button>
            </div>
          </div>
        </div>

        {/* Content details */}
        <div style={{ padding: 24, maxHeight: 'calc(90vh - 300px)', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#ccc' }}>
              Loading details...
            </div>
          ) : (
            <>
              {/* Description */}
              {displayContent.description && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: 'white', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                    Synopsis
                  </h3>
                  <p
                    style={{
                      color: '#ccc',
                      lineHeight: 1.6,
                      margin: 0,
                      fontSize: 14
                    }}
                  >
                    {displayContent.description}
                  </p>
                </div>
              )}

              {/* Additional details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    Release Date
                  </h4>
                  <p style={{ color: '#ccc', fontSize: 14, margin: 0 }}>
                    {displayContent.releaseDate ? new Date(displayContent.releaseDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    Type
                  </h4>
                  <p style={{ color: '#ccc', fontSize: 14, margin: 0 }}>
                    {displayContent.type || 'N/A'}
                  </p>
                </div>

                <div>
                  <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    Status
                  </h4>
                  <p style={{ color: '#ccc', fontSize: 14, margin: 0 }}>
                    {displayContent.status || 'N/A'}
                  </p>
                </div>

                {displayContent.rating && (
                  <div>
                    <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      Rating
                    </h4>
                    <p style={{ color: '#ccc', fontSize: 14, margin: 0 }}>
                      {displayContent.rating}/10
                    </p>
                  </div>
                )}
              </div>

              {/* Streaming quality info */}
              {streamingUrls.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Available Quality
                  </h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.keys(streamingUrls[0]?.resolutions || {}).map((quality) => (
                      <span
                        key={quality}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 4,
                          fontSize: 12,
                          color: '#ccc'
                        }}
                      >
                        {quality}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
