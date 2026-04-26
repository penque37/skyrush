export default function TopHUD({ money, income, airportCount, bestAC, fmt, onTap }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {/* Logo */}
      <div style={{
        background: 'rgba(8,18,28,0.88)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        backdropFilter: 'blur(12px)',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'all',
      }}>
        <div style={{
          width: 26, height: 26,
          background: '#38bdf8',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>✈</div>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 13, fontWeight: 700,
          color: '#f0f4f8',
        }}>SkyRush</span>
      </div>

      {/* Money */}
      <div style={{
        background: 'rgba(8,18,28,0.88)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        backdropFilter: 'blur(12px)',
        padding: '6px 12px',
        flex: 1,
        pointerEvents: 'all',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 18, fontWeight: 600,
          color: '#fbbf24',
          lineHeight: 1,
        }}>{fmt(money)}</div>
        <div style={{
          fontSize: 10,
          color: '#34d399',
          fontFamily: 'JetBrains Mono, monospace',
        }}>+{fmt(income)}/s</div>
      </div>

      {/* Airports stat */}
      <div style={{
        background: 'rgba(8,18,28,0.88)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        backdropFilter: 'blur(12px)',
        padding: '6px 10px',
        textAlign: 'center',
        minWidth: 52,
        pointerEvents: 'all',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 600,
          color: '#f0f4f8', lineHeight: 1.2,
        }}>{airportCount}</div>
        <div style={{ fontSize: 9, color: '#8fa8bf', marginTop: 1 }}>AIRPORTS</div>
      </div>

      {/* Best plane */}
      <div style={{
        background: 'rgba(8,18,28,0.88)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        backdropFilter: 'blur(12px)',
        padding: '6px 10px',
        textAlign: 'center',
        minWidth: 52,
        pointerEvents: 'all',
      }}>
        <div style={{ fontSize: 16, lineHeight: 1.2 }}>{bestAC?.emoji || '🛩'}</div>
        <div style={{ fontSize: 9, color: '#8fa8bf', marginTop: 1 }}>BEST</div>
      </div>

      {/* Tap button */}
      <button
        onClick={onTap}
        style={{
          background: '#38bdf8',
          border: 'none',
          borderRadius: 10,
          padding: '10px 14px',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13, fontWeight: 700,
          color: '#07111c',
          display: 'flex', alignItems: 'center', gap: 5,
          pointerEvents: 'all',
          transition: 'transform 0.1s',
          whiteSpace: 'nowrap',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        ✈ TAP
      </button>
    </div>
  )
}