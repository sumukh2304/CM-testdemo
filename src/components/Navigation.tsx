import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';
import { contentAPI, Content } from '../services/api';

interface NavigationProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export default function Navigation({ currentPage = 'home', onNavigate }: NavigationProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNavigation = (page: string) => {
    if (Platform.OS === 'web') {
      window.location.href = `/${page}`;
    } else if (onNavigate) {
      onNavigate(page);
    }
  };

  const handleLogout = () => {
    logout();
    if (Platform.OS === 'web') {
      window.location.href = '/';
    }
  };

  if (Platform.OS === 'web') {
    const [isSmall, setIsSmall] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 480 : false);
    useEffect(() => {
      const onResize = () => setIsSmall(window.innerWidth <= 480);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);
    const [query, setQuery] = useState('');
    const [allContent, setAllContent] = useState<Content[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [hoverIndex, setHoverIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch suggestions from backend on each query change (debounced via open state)
    useEffect(() => {
      let isMounted = true;
      const q = query.trim();
      if (!open || q.length === 0) return;
      setLoading(true);
      contentAPI.getContent({ q, limit: 10, offset: 0 })
        .then(res => {
          if (!isMounted) return;
          setAllContent(res.content || []);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });
      return () => { isMounted = false };
    }, [open, query]);

    // Close on outside click for both search and user menu, and on scroll/escape
    useEffect(() => {
      const onPointer = (e: Event) => {
        const target = e.target as Node | null;
        if (containerRef.current && !containerRef.current.contains(target as Node)) {
          setOpen(false);
          setHoverIndex(-1);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(target as Node)) {
          setShowUserMenu(false);
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
          setShowUserMenu(false);
          setHoverIndex(-1);
        }
      };
      const onScroll = () => {
        setOpen(false);
        setShowUserMenu(false);
      };
      document.addEventListener('mousedown', onPointer, true);
      document.addEventListener('touchstart', onPointer, true);
      document.addEventListener('click', onPointer, true);
      document.addEventListener('keydown', onKey);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        document.removeEventListener('mousedown', onPointer, true);
        document.removeEventListener('touchstart', onPointer, true);
        document.removeEventListener('click', onPointer, true);
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('scroll', onScroll);
      };
    }, []);

    // Debounced open logic
    useEffect(() => {
      const q = query.trim();
      if (!q) {
        setOpen(false);
        setHoverIndex(-1);
        return;
      }
      const t = setTimeout(() => setOpen(true), 150);
      return () => clearTimeout(t);
    }, [query]);

    const suggestions = useMemo(() => (allContent || []).slice(0, 8), [allContent]);

    const submitSearch = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const q = query.trim();
      if (!q) return;
      window.location.href = `/search?q=${encodeURIComponent(q)}`;
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
      if (!open || suggestions.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHoverIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHoverIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitSearch();
      } else if (e.key === 'Escape') {
        setOpen(false);
        setHoverIndex(-1);
      }
    };
    return (
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
          padding: isSmall ? '10px 16px' : '10px 40px',
          display: isSmall ? 'grid' : 'flex',
          ...(isSmall ? { gridTemplateColumns: 'auto 1fr auto' } : { justifyContent: 'space-between' }),
          alignItems: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginRight: 16
          }}
          onClick={() => handleNavigation('home')}
        >
          <Logo iconSize={isSmall ? 28 : 40} fontSize={isSmall ? 14 : 18} gap={isSmall ? 4 : 6} compact={isSmall} />
        </div>

        {/* Search Bar with live suggestions */}
        <form
          onSubmit={submitSearch}
          style={
            isSmall
              ? { width: '60vw', minWidth: 160, marginRight: 8, marginLeft: 8 }
              : { flex: 1, maxWidth: 520, minWidth: 260, marginRight: 24 }
          }
        >
          <div ref={containerRef} style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isSmall ? 'Search' : 'Search movies, shows...'}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: isSmall ? '8px 36px 8px 10px' : '10px 44px 10px 14px',
                fontSize: isSmall ? 12 : 14,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              aria-label="Search"
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(204, 85, 0, 0.9)',
                border: 'none',
                color: 'white',
                borderRadius: 6,
                padding: isSmall ? '6px 8px' : '8px 12px',
                fontSize: isSmall ? 12 : 14,
                cursor: 'pointer'
              }}
            >
              {isSmall ? '🔍' : 'Search'}
            </button>

            {open && query.trim() && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 8,
                  backgroundColor: '#141414',
                  border: '1px solid #333',
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  zIndex: 200
                }}
              >
                {loading ? (
                  <div style={{ padding: 12, color: '#aaa' }}>Searching...</div>
                ) : suggestions.length === 0 ? (
                  <div style={{ padding: 12, color: '#aaa' }}>No matches</div>
                ) : (
                  suggestions.map((item, idx) => (
                    <div
                      key={item.contentId}
                      onMouseEnter={() => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(-1)}
                      onClick={() => {
                        window.location.href = `/watch/${item.contentId}`;
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        backgroundColor: hoverIndex === idx ? '#1f1f1f' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ width: 48, height: 32, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : null}
                      </div>
                      {/* Text */}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>
                          {(item.type || '').toUpperCase()} {item.language ? `· ${item.language}` : ''} {item.genre ? `· ${item.genre}` : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </form>

        {/* User Menu */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer'
            }}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {/* User Avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#CC5500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* Dropdown Arrow */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid white',
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                backgroundColor: '#141414',
                border: '1px solid #333',
                borderRadius: 4,
                minWidth: 200,
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                zIndex: 100
              }}
            >
              <div style={{ padding: 16, borderBottom: '1px solid #333' }}>
                <div style={{ color: 'white', fontWeight: 600, marginBottom: 4 }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ color: '#ccc', fontSize: 14 }}>
                  {user?.email}
                </div>
              </div>

              <div style={{ padding: 8 }}>
                <button
                  onClick={() => handleNavigation('profile')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: '#ccc',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Account Settings
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: '#ccc',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Native navigation would go here
  return null;
}
