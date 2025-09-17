import React, { useEffect, useRef } from 'react'
import { Image } from 'react-native'
import SiteHeader from '../../components/SiteHeader'
import SiteFooter from '../../components/SiteFooter'

// React Native image imports
const cartoonImage = require('../../../assets/cartoon.png')
const bannerImage = require('../../../assets/Profile-Banner.png')
const nvidiaImage = require('../../../assets/nvidia-inception.jpg')
const dnbImage = require('../../../assets/DnB.png')

export default function About() {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
    
    const el = rootRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(10px)'
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 600ms ease, transform 600ms ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
  }, [])

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <SiteHeader />

      {/* Hero Section */}
      <section
        style={{
        position: 'relative',
          padding: '40px 0 40px',
          marginTop: '80px',
          overflow: 'hidden',
          textAlign: 'left',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: 60, fontWeight: 900, marginBottom: 16, letterSpacing: -1, textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}>
            We Are Cartoon Movie™
          </h1>
          <p style={{ fontSize: 20, color: '#e5e7eb', maxWidth: 860, lineHeight: 1.7 }}>
            We're creating the best in Generative AI entertainment by making movies & shows that change the way people have fun.
          </p>
        </div>

        <div style={{ position: 'absolute', width: 220, height: 220, background: 'radial-gradient(circle, rgba(204,85,0,0.35), transparent 70%)', filter: 'blur(10px)', right: 60, top: 30, zIndex: 1 }} />
        <div style={{ position: 'absolute', width: 260, height: 260, background: 'radial-gradient(circle, rgba(112,130,56,0.25), transparent 70%)', filter: 'blur(12px)', left: -40, bottom: -40, zIndex: 1 }} />
      </section>

      {/* Main Content */}
      <main ref={rootRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 64px' }}>

        {/* Split Layout Section - Image Left, Red Text Right */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 0, 
          marginBottom: 80,
          minHeight: '500px'
        }}>
          {/* Left Side - Cartoon Image */}
          <div style={{ 
            background: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <Image
              source={cartoonImage}
              style={{ 
                width: '100%', 
                height: '100%', 
                resizeMode: 'cover',
                borderRadius: '12px'
              }}
            />
          </div>
          
          {/* Right Side - Red Background with Text */}
          <div style={{ 
            background: '#CC5500',
            padding: '60px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <h2 style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              marginBottom: 30,
              color: '#fff'
            }}>
              Our Vision
            </h2>
            <div style={{ fontSize: 18, lineHeight: 1.8 }}>
              <p style={{ marginBottom: 20, fontWeight: 600 }}>
                Imagine this:
              </p>
              <p style={{ marginBottom: 20 }}>
                You're all set to binge-watch your favorite cartoon-animated series, think Kung Fu Panda. After a couple of episodes, the season ends. You start the second season and refill your bowl of snacks. It's 2 AM, and you ignored your parents' advice on sleeping early.
              </p>
              <p style={{ marginBottom: 20, fontWeight: 600 }}>
                Then, the realization hits you:
              </p>
              <p style={{ marginBottom: 20 }}>
                After you complete this last episode of Kung Fu Panda, you're at the creator's mercy. You'll have to wait months, maybe even years, for the next sequel and movies to be published.
              </p>
              <p style={{ fontWeight: 600 }}>
                What if that weren't the case? What if you didn't have to wait for a production team to produce the sequel? 👀
              </p>
            </div>
          </div>
        </section>

        {/* What We Are About */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            color: '#708238', 
            marginBottom: 50,
            textAlign: 'center',
            textShadow: '0 2px 10px rgba(112,130,56,0.2)'
          }}>
            What We Are About
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 30,
          }}>
            {[
              {
                title: 'Future-Sighted',
                text: 'We anticipate a future where this revolutionary technology is used responsibly and enhances the already creative human brain.',
                accent: '#708238',
                gradient: 'linear-gradient(135deg, rgba(112,130,56,0.1) 0%, rgba(112,130,56,0.05) 100%)'
              },
              {
                title: 'Creativity',
                text: "We don't need to explain creativity with GenAI. GenMoji, Sora, Veo, Runway, etc already demonstrate this capability.",
                accent: '#CC5500',
                gradient: 'linear-gradient(135deg, rgba(204,85,0,0.1) 0%, rgba(204,85,0,0.05) 100%)'
              },
              {
                title: 'Community',
                text: 'We are a close-knit group of driven and ambitious people building the best in Generative AI Entertainment.',
                accent: '#708238',
                gradient: 'linear-gradient(135deg, rgba(112,130,56,0.1) 0%, rgba(112,130,56,0.05) 100%)'
              },
            ].map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: `linear-gradient(135deg, ${card.accent}10 0%, ${card.accent}05 100%)`,
                  border: `2px solid ${card.accent}30`,
                  borderRadius: 20,
                  padding: 40,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 15px 35px ${card.accent}20`,
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-8px)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 25px 50px ${card.accent}30`
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 15px 35px ${card.accent}20`
                }}
              >
                {/* Professional Icon Placeholder */}
                <div style={{ 
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${card.accent} 0%, ${card.accent}CC 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  boxShadow: `0 8px 20px ${card.accent}30`
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#fff',
                    opacity: 0.9
                  }} />
                </div>
                
                <h3 style={{ 
                  fontSize: 24, 
                  fontWeight: 800, 
                  color: card.accent,
                  margin: '0 0 16px 0',
                  textShadow: `0 2px 4px ${card.accent}20`
                }}>
                  {card.title}
                </h3>
                <p style={{ 
                  color: '#e5e7eb', 
                  fontSize: 16, 
                  lineHeight: 1.7,
                  margin: 0
                }}>
                  {card.text}
                </p>
                
                {/* Professional decorative element */}
                <div style={{
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${card.accent}15, transparent 70%)`,
                  filter: 'blur(25px)',
                  top: -30,
                  right: -30,
                  zIndex: 0
                }} />
              </div>
            ))}
          </div>
        </section>

        {/* Proud Milestones */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            color: '#CC5500', 
            marginBottom: 50,
            textAlign: 'center',
            textShadow: '0 2px 10px rgba(204,85,0,0.2)'
          }}>
            Proud Milestones
          </h2>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 40,
            flexWrap: 'wrap'
          }}>
            <a href="https://images.news18.com/ms/prod/forbesindia/Cartoon_Movie_57d4d6dea0.pdf" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
              <Image
                source={bannerImage}
                accessibilityLabel="Forbes India feature PDF"
                style={{ 
                  width: 350, 
                  height: 220, 
                  resizeMode: 'contain'
                }}
              />
            </a>
            <a href="https://www.nvidia.com/en-in/startups/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
              <Image
                source={nvidiaImage}
                accessibilityLabel="NVIDIA Inception Startups"
                style={{ 
                  width: 250, 
                  height: 120, 
                  resizeMode: 'contain'
                }}
              />
            </a>
            <a href="https://www.dnb.com/business-directory/company-profiles.perpetual_pictures_private_limited.8046b2ec01fb9010db136db1669dff50.html" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexBasis: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={dnbImage}
                accessibilityLabel="Dun & Bradstreet business profile"
                style={{ 
                  width: 250, 
                  height: 120, 
                  resizeMode: 'contain'
                }}
              />
            </a>
        </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  )
}
