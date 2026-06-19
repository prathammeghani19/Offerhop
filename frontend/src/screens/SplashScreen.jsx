import { useEffect } from 'react'

// OfferHop logo mark — percent sign with circular cutouts
function OfferHopLogo({ size = 38, inverted = false }) {
  const fg = inverted ? '#0A0A0A' : '#FFFFFF'
  const bg = inverted ? '#FFFFFF' : '#0A0A0A'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill={bg}/>
      {/* % sign */}
      <circle cx="13" cy="13" r="4" fill={fg}/>
      <circle cx="13" cy="13" r="1.8" fill={bg}/>
      <circle cx="27" cy="27" r="4" fill={fg}/>
      <circle cx="27" cy="27" r="1.8" fill={bg}/>
      <line x1="28" y1="12" x2="12" y2="28" stroke={fg} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export { OfferHopLogo }

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      flex: 1,
      background: 'var(--black)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 72, height: 72,
        background: 'var(--white)',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <OfferHopLogo size={48} inverted />
      </div>
      <div style={{
        fontSize: 30, fontWeight: 800,
        color: 'var(--white)',
        letterSpacing: -1.5,
      }}>
        OfferHop
      </div>
      <div style={{
        fontSize: 12,
        color: '#9A9A9A',
        textAlign: 'center',
        lineHeight: 1.6,
        padding: '0 28px',
      }}>
        Food &amp; drink deals<br />near you, right now
      </div>
    </div>
  )
}
