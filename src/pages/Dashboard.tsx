import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { contentAPI, userAPI, Content, StreamingUrl, WatchlistItem } from '../services/api';
import StreamingHero from '../components/StreamingHero';
import ContentRow from '../components/ContentRow';
import SiteFooter from '../components/SiteFooter';
import MovieDetailsModal from '../components/MovieDetailsModal';
import Navigation from '../components/Navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const [featuredContent, setFeaturedContent] = useState<Content | null>(null);
  const [featuredStreamUrls, setFeaturedStreamUrls] = useState<StreamingUrl[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [allFeaturedContent, setAllFeaturedContent] = useState<Content[]>([]);
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [contentById, setContentById] = useState<{ [id: string]: Content }>({});
  const [trendingContent, setTrendingContent] = useState<Content[]>([]);
  const [moviesContent, setMoviesContent] = useState<Content[]>([]);
  const [seriesContent, setSeriesContent] = useState<Content[]>([]);
  const [recommendedContent, setRecommendedContent] = useState<Content[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<string[]>([]);
  const [watchlistContent, setWatchlistContent] = useState<Content[]>([]);
  const [watchHistoryContent, setWatchHistoryContent] = useState<Content[]>([]);
  const [watchHistoryIds, setWatchHistoryIds] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<{ [contentId: string]: number }>({});
  const [genreCategories, setGenreCategories] = useState<{ [genre: string]: Content[] }>({});
  const [streamUrls, setStreamUrls] = useState<{ [contentId: string]: StreamingUrl[] }>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  useEffect(() => {
    loadContent();
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Refresh user data when returning to dashboard (e.g., from video player)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadUserData();
      }
    };

    // For web, listen to window focus events
    if (Platform.OS === 'web') {
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [user]);

  // Recompute derived content lists when content map or ids change
  useEffect(() => {
    // Watchlist content
    if (watchlistItems.length > 0) {
      const wlContent: Content[] = [];
      for (const id of watchlistItems) {
        if (contentById[id]) wlContent.push(contentById[id]);
      }
      setWatchlistContent(wlContent);
    } else {
      setWatchlistContent([]);
    }

    // Watch history content
    if (watchHistoryIds.length > 0) {
      const histContent: Content[] = [];
      for (const id of watchHistoryIds) {
        if (contentById[id]) histContent.push(contentById[id]);
      }
      setWatchHistoryContent(histContent);
    } else {
      setWatchHistoryContent([]);
    }
  }, [contentById, watchlistItems, watchHistoryIds]);

  // Auto-rotate featured content every 8 seconds
  useEffect(() => {
    if (allFeaturedContent.length <= 1) return;

    const interval = setInterval(() => {
      setFeaturedIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % allFeaturedContent.length;
        const nextContent = allFeaturedContent[nextIndex];
        
        // Update featured content
        setFeaturedContent(nextContent);
        
        return nextIndex;
      });
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, [allFeaturedContent]);

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Load all content - this is the main request needed for listing
      const allContentResponse = await contentAPI.getContent();
      const allContent = allContentResponse.content;
      setAllContent(allContent);
      const map: { [id: string]: Content } = {};
      for (const c of allContent) map[c.contentId] = c;
      setContentById(map);
      
      if (allContent.length > 0) {
        // Set up featured content rotation - use first 5 items for rotation
        const featuredItems = allContent.slice(0, 5);
        setAllFeaturedContent(featuredItems);
        
        // Set initial featured content (first item)
        const featured = featuredItems[0];
        setFeaturedContent(featured);
        setFeaturedIndex(0);
        
        // Categorize content
        const movies = allContent.filter(item => (item.type || '').toLowerCase() === 'movie').slice(0, 20);
        const series = allContent.filter(item => {
          const t = (item.type || '').toLowerCase()
          return t === 'series' || t === 'tv'
        }).slice(0, 20);
        const trending = allContent.slice(1, 21); // Skip featured item
        
        setMoviesContent(movies);
        setSeriesContent(series);
        setTrendingContent(trending);

        // Build genre categories (top 4 genres by frequency)
        const genreCount: { [g: string]: number } = {};
        for (const c of allContent) {
          const g = (c.genre || '').trim();
          if (!g) continue;
          genreCount[g] = (genreCount[g] || 0) + 1;
        }
        const topGenres = Object.keys(genreCount)
          .sort((a, b) => genreCount[b] - genreCount[a])
          .slice(0, 4);
        const categories: { [genre: string]: Content[] } = {};
        for (const g of topGenres) {
          categories[g] = allContent.filter(c => (c.genre || '').trim() === g).slice(0, 20);
        }
        setGenreCategories(categories);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      console.log('Loading user data for:', user.userId);
      
      // Load user's watchlist - only get IDs, use cached content
      const watchlistResponse = await userAPI.getWatchlist(user.userId);
      const watchlistIds = watchlistResponse.watchlist.map(item => item.contentId);
      setWatchlistItems(watchlistIds);
      console.log('Loaded watchlist items:', watchlistIds.length);
      
      // Load user's recommendations - only get IDs, use cached content
      const recommendationsResponse = await userAPI.getRecommendations(user.userId);
      const recommendedIds = recommendationsResponse.recommendations.map(rec => rec.contentId);
      
      // Use cached content for recommendations
      const validRecommended: Content[] = [];
      for (const id of recommendedIds) {
        if (contentById[id]) validRecommended.push(contentById[id]);
      }
      setRecommendedContent(validRecommended);

      // Load user's watch history - only get IDs, use cached content
      const historyResponse = await userAPI.getWatchHistory(user.userId);
      console.log('Watch history response:', historyResponse);
      const historyIds = historyResponse.history.map(h => h.contentId);
      setWatchHistoryIds(historyIds);
      console.log('Loaded watch history items:', historyIds.length);
      
      // Build progress map if duration is available in content; else approximate from lastPosition if content.duration in minutes or HH:MM:SS
      const pm: { [id: string]: number } = {};
      for (const h of historyResponse.history) {
        const c = contentById[h.contentId];
        // Parse lastPosition HH:MM:SS
        const parts = (h.lastPosition || '').split(':').map(x => parseInt(x || '0', 10));
        const posSec = parts.length === 3 ? (parts[0] * 3600 + parts[1] * 60 + parts[2]) : 0;
        // Try to parse content.duration like "2h", "90m", or "HH:MM:SS"
        let totalSec = 0;
        const dur = (c?.duration || '').trim();
        if (/^\d+h$/i.test(dur)) totalSec = parseInt(dur, 10) * 3600;
        else if (/^\d+m$/i.test(dur)) totalSec = parseInt(dur, 10) * 60;
        else if (/^\d{1,2}:\d{2}:\d{2}$/.test(dur)) {
          const dparts = dur.split(':').map(x => parseInt(x, 10));
          totalSec = dparts[0] * 3600 + dparts[1] * 60 + dparts[2];
        }
        if (totalSec > 0 && posSec > 0) {
          pm[h.contentId] = Math.max(0, Math.min(1, posSec / totalSec));
        }
      }
      setProgressMap(pm);
      console.log('Progress map:', pm);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handlePlay = async (contentId: string) => {
    // Load streaming URLs only when user wants to play
    try {
      const streamingResponse = await contentAPI.getStreamingUrls(contentId);
      // Store streaming URLs for this content
      setStreamUrls(prev => ({
        ...prev,
        [contentId]: streamingResponse.streaming
      }));
    } catch (error) {
      console.warn('Failed to load streaming URLs:', error);
    }
    
    if (Platform.OS === 'web') {
      window.location.href = `/watch/${contentId}`;
    } else {
      // Handle native navigation
      console.log('Navigate to player:', contentId);
    }
  };

  const handleMoreInfo = (contentId: string) => {
    const content = contentById[contentId];
    if (content) {
      setSelectedContent(content);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContent(null);
  };

  const handleAddToWatchlist = async (contentId: string) => {
    if (!user) return;
    try {
      // Optimistic update
      setWatchlistItems(prev => (prev.includes(contentId) ? prev : [...prev, contentId]));
      await userAPI.addToWatchlist(user.userId, contentId);
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      // Revert on failure
      setWatchlistItems(prev => prev.filter(id => id !== contentId));
    }
  };

  const handleRemoveFromWatchlist = async (contentId: string) => {
    if (!user) return;
    try {
      // Optimistic update
      const prev = watchlistItems;
      setWatchlistItems(prev.filter(id => id !== contentId));
      await userAPI.removeFromWatchlist(user.userId, contentId);
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      // No exact revert state stored; safest to refetch watchlist
      try {
        const watchlistResponse = await userAPI.getWatchlist(user!.userId);
        setWatchlistItems(watchlistResponse.watchlist.map(item => item.contentId));
      } catch {}
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0f0f14 25%, #000000 50%, #0f0f14 75%, #1a1a1a 100%), linear-gradient(135deg, rgba(204, 85, 0, 0.05) 0%, transparent 50%, rgba(112, 130, 56, 0.03) 100%)',
        backgroundAttachment: 'fixed',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div>Loading amazing content...</div>
        </div>
      </div>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <div style={{ background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0f0f14 25%, #000000 50%, #0f0f14 75%, #1a1a1a 100%), linear-gradient(135deg, rgba(204, 85, 0, 0.05) 0%, transparent 50%, rgba(112, 130, 56, 0.03) 100%)', backgroundAttachment: 'fixed', minHeight: '100vh', color: 'white' }}>
        {/* Navigation Header */}
        <Navigation />
        
        {/* Hero Section */}
        {featuredContent && (
          <StreamingHero
            featuredContent={featuredContent}
            streamingUrls={featuredStreamUrls}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            onPrev={() => {
              if (allFeaturedContent.length === 0) return;
              setFeaturedIndex(prev => {
                const next = (prev - 1 + allFeaturedContent.length) % allFeaturedContent.length;
                const nextContent = allFeaturedContent[next];
                setFeaturedContent(nextContent);
                return next;
              });
            }}
            onNext={() => {
              if (allFeaturedContent.length === 0) return;
              setFeaturedIndex(prev => {
                const next = (prev + 1) % allFeaturedContent.length;
                const nextContent = allFeaturedContent[next];
                setFeaturedContent(nextContent);
                return next;
              });
            }}
          />
        )}

        {/* Latest Movies Row - show all fetched movies, not hardcoded 4 */}
        <div style={{ paddingBottom: 40 }}>
          {allContent.length > 0 && (
            <ContentRow
              title="Latest Movies"
              items={allContent}
              streamUrls={streamUrls}
              featured={false}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              watchlistItems={watchlistItems}
              progressMap={progressMap}
            />
          )}
        </div>

        {/* My Watchlist */}
        {watchlistContent.length > 0 && (
          <div style={{ paddingBottom: 40 }}>
            <ContentRow
              title="My Watchlist"
              items={watchlistContent}
              streamUrls={streamUrls}
              featured={false}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              watchlistItems={watchlistItems}
              progressMap={progressMap}
            />
          </div>
        )}

        {/* Continue Watching */}
        {watchHistoryContent.length > 0 && (
          <div style={{ paddingBottom: 40 }}>
            <ContentRow
              title="Continue Watching"
              items={watchHistoryContent}
              streamUrls={streamUrls}
              featured={false}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              watchlistItems={watchlistItems}
              progressMap={progressMap}
            />
          </div>
        )}

        {/* Footer */}
        <SiteFooter />

        {/* Movie Details Modal */}
        <MovieDetailsModal
          content={selectedContent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onPlay={handlePlay}
          onAddToWatchlist={handleAddToWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
          isInWatchlist={selectedContent ? watchlistItems.includes(selectedContent.contentId) : false}
        />
      </div>
    );
  }

  // Native version would go here
  return null;
}


