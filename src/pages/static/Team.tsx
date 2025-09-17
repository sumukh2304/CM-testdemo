import React, { useEffect } from 'react'
import { Image } from 'react-native'
import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'

const shekarImage = require('../../../assets/shekar.png')
const sujanaImage = require('../../../assets/sujana.png')

export default function Team() {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <SiteHeader />

      {/* Hero - centered */}
      <section
        style={{
          position: 'relative',
          padding: '30px 0 30px',
          marginTop: '80px',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        {/* subtle brand glows */}
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(204,85,0,0.25), transparent 70%)', filter: 'blur(14px)', top: -80, left: -80 }} />
        <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(112,130,56,0.22), transparent 70%)', filter: 'blur(18px)', bottom: -120, right: -120 }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: -1,
              marginBottom: 14,
              textShadow: '0 6px 30px rgba(0,0,0,0.6)'
            }}
          >
            Meet the Team
          </h1>
          <p style={{ fontSize: 20, color: '#e5e7eb', lineHeight: 1.8, maxWidth: 820, margin: '0 auto' }}>
            The people building Cartoon Movie™. Vision, strategy and engineering—guided by our brand colors and values.
          </p>
          <div style={{ width: 140, height: 4, margin: '18px auto 0', borderRadius: 8, background: 'linear-gradient(90deg, #CC5500, #708238)' }} />
        </div>
      </section>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 20px 70px', display: 'grid', gap: 28 }}>
        {/* Sekhar */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 360px) 1fr',
            gap: 26,
            alignItems: 'stretch',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))',
            border: '1px solid #262626',
            borderRadius: 16,
            padding: 18,
            boxShadow: '0 14px 40px rgba(0,0,0,0.35)'
          }}
        >
          <div style={{ borderRadius: 12, overflow: 'hidden', background: '#0B0B0B', border: '1px solid #262626' }}>
            <Image source={shekarImage} style={{ width: '100%', height: 360, resizeMode: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#CC5500' }}>Sekhar Maddula</h2>
            <div style={{ color: '#9ca3af' }}>Founder & CEO</div>
            <p style={{ color: '#e5e7eb', lineHeight: 1.8 }}>
              Naga Venkata Sekhar Maddula is the Founder and CEO of Cartoon Movie™, where he leads the company’s technological vision and innovation. With over 20 years of
              experience in Artificial Intelligence and IT, Sekhar is a patented innovator who combines deep technical expertise with a passion for storytelling.
            </p>
            <p style={{ color: '#e5e7eb', lineHeight: 1.8 }}>
              Driven by the belief that stories should never have to end, Sekhar founded Cartoon Movie™ in 2024 to pioneer the world’s first AI‑powered, personalized animation ecosystem.
              Under his leadership, the company is developing a SaaS studio, a patented multi‑agent AI engine, and a next‑generation OTT platform that enable creators and viewers to
              generate and consume limitless, customized animated stories.
            </p>
          </div>
        </section>

        {/* Sujana */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 360px) 1fr',
            gap: 26,
            alignItems: 'stretch',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))',
            border: '1px solid #262626',
            borderRadius: 16,
            padding: 18,
            boxShadow: '0 14px 40px rgba(0,0,0,0.35)'
          }}
        >
          <div style={{ borderRadius: 12, overflow: 'hidden', background: '#0B0B0B', border: '1px solid #262626' }}>
            <Image source={sujanaImage} style={{ width: '100%', height: 360, resizeMode: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#708238' }}>Sujana Maddula</h2>
            <div style={{ color: '#9ca3af' }}>Co‑Founder & Chief Strategy Officer</div>
            <p style={{ color: '#e5e7eb', lineHeight: 1.8 }}>
              Lakshmi Sujana Maddula is the Co‑Founder and Chief Strategy Officer of Cartoon Movie™, where she leads the company’s business strategy, partnerships, and long‑term growth initiatives.
              With a strong business‑first mindset, Sujana ensures that Cartoon Movie™ remains grounded in real‑world execution while scaling globally.
            </p>
            <p style={{ color: '#e5e7eb', lineHeight: 1.8 }}>
              Together with Sekhar Maddula, she co‑founded Cartoon Movie™ in 2024 to reimagine the future of storytelling through GenAI‑powered, personalized animation.
              Her leadership has helped the company earn recognition on Forbes India’s Select200 list (2024) and attract global partnerships.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
