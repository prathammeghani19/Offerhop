import { useState } from 'react'
import { OfferHopLogo } from './SplashScreen'

export default function WelcomeScreen({ onGetStarted }) {
  const [showPerm, setShowPerm] = useState(false)

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '48px 24px 32px',
      background: 'var(--white)',
    }}>
      {/* Logo + tagline */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 64, height: 64,
          background: 'var(--black)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <OfferHopLogo size={44} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--black)', letterSpacing: -1 }}>
          OfferHop
        </div>
        <div style={{
          fontSize: 13, color: 'var(--gray-dark)',
          textAlign: 'center', lineHeight: 1.55,
        }}>
          Find the best food &amp; drink deals<br />near you — updated every hour
        </div>
      </div>

      {/* Illustration */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ fontSize: 42, letterSpacing: -4, lineHeight: 1 }}>🍛🍕🍺🍔</div>
        <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 4 }}>From biryani to cocktails</div>
      </div>

      {/* CTA buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onGetStarted}
          style={{
            width: '100%', padding: 14,
            background: 'var(--black)', color: 'var(--white)',
            borderRadius: 12, fontSize: 14, fontWeight: 700,
            border: 'none', letterSpacing: -0.2, cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          Get started →
        </button>
        <button
          onClick={() => setShowPerm(true)}
          style={{
            width: '100%', padding: 13,
            background: 'var(--white)', color: 'var(--black)',
            borderRadius: 12, fontSize: 13, fontWeight: 600,
            border: '1.5px solid var(--gray-border)', cursor: 'pointer',
            fontFamily: 'var(--font)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="6" r="2.5"/>
            <path d="M7 1C4.239 1 2 3.239 2 6c0 4.25 5 7 5 7s5-2.75 5-7c0-2.761-2.239-5-5-5z"/>
          </svg>
          Use my location
        </button>
        <div style={{ fontSize: 9, color: 'var(--gray)', textAlign: 'center', lineHeight: 1.6 }}>
          By continuing you agree to our <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>
          {' & '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
        </div>
      </div>

      {/* Location permission sheet */}
      {showPerm && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(10,10,10,0.5)',
          display: 'flex', alignItems: 'flex-end',
          zIndex: 200, borderRadius: 34, overflow: 'hidden',
        }}>
          <div style={{
            width: '100%', background: 'var(--white)',
            borderRadius: '20px 20px 0 0',
            padding: '24px 22px 32px',
          }}>
            <div style={{
              width: 36, height: 4, background: 'var(--gray-border)',
              borderRadius: 2, margin: '0 auto 20px',
            }} />
            <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--black)', letterSpacing: -0.4, marginBottom: 6 }}>
              Allow location access?
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-dark)', lineHeight: 1.6, marginBottom: 20 }}>
              OfferHop uses your location to show deals at restaurants and bars near you.
              We only check location while you're using the app.
            </div>
            <button
              onClick={() => { setShowPerm(false); onGetStarted() }}
              style={{
                width: '100%', padding: 13,
                background: 'var(--accent)', color: 'var(--white)',
                borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: 'none', fontFamily: 'var(--font)', cursor: 'pointer',
                marginBottom: 8, display: 'block',
              }}
            >
              Allow while using app
            </button>
            <button
              onClick={() => { setShowPerm(false); onGetStarted() }}
              style={{
                width: '100%', padding: 12,
                background: 'var(--white)', color: 'var(--gray-dark)',
                borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: '1.5px solid var(--gray-border)', fontFamily: 'var(--font)', cursor: 'pointer',
                display: 'block',
              }}
            >
              Skip, I'll pick my area
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
