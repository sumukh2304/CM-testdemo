import React from 'react'
import { Platform } from 'react-native'
import { Link } from 'react-router-dom'

export default function SiteFooter() {
  if (Platform.OS === 'web') {
    return (
      <footer style={{
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid #1a1a1a',
        padding: '28px 24px',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Company */}
          <div>
            <div style={{ color: '#e4e4e7', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Cartoon Movie</div>
            <div style={{ color: '#71717a', fontSize: 13, lineHeight: '20px' }}>
              © 2025 Perpetual Pictures Private Ltd. <br />
              All rights reserved.
            </div>
            <div style={{ marginTop: 10 }}>
              <a href="mailto:contact@cartoon.movie" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>
                Contact: contact@cartoon.movie
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={{ color: '#e4e4e7', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Pages</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/about" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>About</Link>
              <Link to="/team" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>Team</Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <div style={{ color: '#e4e4e7', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Social</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="https://x.com/cartoonmovieai" target="_blank" rel="noreferrer" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>X (Twitter)</a>
              <a href="https://www.instagram.com/cartoon.movie" target="_blank" rel="noreferrer" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>Instagram</a>
              <a href="https://www.linkedin.com/company/cartoonmovie/" target="_blank" rel="noreferrer" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>LinkedIn</a>
            </div>
          </div>

          {/* Apps */}
          <div>
            <div style={{ color: '#e4e4e7', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Get the app</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://apps.apple.com/in/app/cartoon-movie/id6740822349" target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" style={{ width: 160, height: 48, objectFit: 'contain' }} />
              </a>
              <a href="https://play.google.com/store/apps/details?id=branded.mbdf5e8107dbf472ebfb530d38b681106.cartoonmovie&pcampaignid=web_share&pli=1" target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" style={{ width: 160, height: 48, objectFit: 'contain' }} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  // Native version - simplified
  return (
    <div style={{
      backgroundColor: '#0a0a0a',
      borderTopWidth: 1,
      borderTopColor: '#1a1a1a',
      padding: 20,
      paddingLeft: 16,
      paddingRight: 16,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ color: '#71717a', fontSize: 13, fontWeight: '500' }}>
          © 2025 Perpetual Pictures Private Ltd. All rights reserved.
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          Contact: contact@cartoon.movie
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          About: https://www.cartoon.movie/about
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          Team: https://www.cartoon.movie/copy-of-about
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          X: https://x.com/cartoonmovieai
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          Instagram: https://www.instagram.com/cartoon.movie
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          LinkedIn: https://www.linkedin.com/company/cartoonmovie/posts/?feedView=all
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          App Store: https://apps.apple.com/in/app/cartoon-movie/id6740822349
        </div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          Google Play: https://play.google.com/store/apps/details?id=branded.mbdf5e8107dbf472ebfb530d38b681106.cartoonmovie&pcampaignid=web_share&pli=1
        </div>
      </div>
    </div>
  )
}
