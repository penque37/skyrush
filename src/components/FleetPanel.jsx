import { AIRCRAFT } from '../data/aircraft'

export default function FleetPanel({ fleet, money, buyAircraft, canUnlockAC, bestAC, fmt, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 44,
      left: 0, right: 0,
      zIndex: 500,
      background: 'rgba(8,18,28,0.97)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '18px 18px 0 0',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 -4px 40px rgba(0,0,0,0.6)',
      maxHeight: '72vh',
      overflowY: 'auto',
    }}>
      <div style={{
        width: 36, height: 4,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        margin: '10px auto 0',
      }} />

      <div style={{ padding: '12px 16px 20px' }}>
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: '#f0f4f8', marginBottom: 12,
        }}>✈ Aircraft Fleet</div>

        {AIRCRAFT.map(ac => {
          const owned = fleet[ac.id] || 0
          const unlocked = canUnlockAC(ac)
          const canAfford = money >= ac.cost
          const isBest = ac.id === bestAC?.id && owned > 0
          const prevAC = ac.unlock ? AIRCRAFT.find(x => x.id === ac.unlock.id) : null

          const tagColors = {
            'LOCAL':      { color: '#34d399', bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.3)'  },
            'REGIONAL':   { color: '#38bdf8', bg: 'rgba(56,189,248,0.07)',  border: 'rgba(56,189,248,0.3)'  },
            'DOMESTIC':   { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)',  border: 'rgba(251,191,36,0.3)'  },
            'LONG HAUL':  { color: '#f87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.3)' },
            'MEGA':       { color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.3)' },
          }
          const tc = tagColors[ac.tag] || tagColors['LOCAL']

          return (
            <div key={ac.id} style={{
              background: isBest ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isBest ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              opacity: !unlocked ? 0.55 : 1,
              position: 'relative',
            }}>

              {/* Active badge */}
              {isBest && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(52,211,153,0.15)',
                  border: '1px solid rgba(52,211,153,0.35)',
                  color: '#34d399',
                  fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600, letterSpacing: 1,
                  padding: '2px 7px', borderRadius: 4,
                }}>ACTIVE</div>
              )}

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4f8', flex: 1 }}>
                  {ac.name}
                </div>
                <div style={{
                  fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600, letterSpacing: 1,
                  padding: '2px 7px', borderRadius: 4,
                  color: tc.color, background: tc.bg,
                  border: `1px solid ${tc.border}`,
                  textTransform: 'uppercase',
                }}>{ac.tag}</div>
              </div>

              {/* Emoji */}
              <div style={{ fontSize: 30, textAlign: 'center', margin: '5px 0 8px' }}>
                {ac.emoji}
              </div>

              {/* Description */}
              <div style={{ fontSize: 11, color: '#8fa8bf', lineHeight: 1.5, marginBottom: 9 }}>
                {ac.desc}
              </div>

              {/* Specs */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '3px 10px', fontSize: 10,
                color: '#8fa8bf', marginBottom: 9,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                <div>Seats: <strong style={{ color: '#b0c8dc' }}>{ac.seats}</strong></div>
                <div>Range: <strong style={{ color: '#b0c8dc' }}>{ac.rangeKm ? ac.rangeKm.toLocaleString() + ' km' : 'Unlimited'}</strong></div>
                <div>Speed: <strong style={{ color: '#b0c8dc' }}>{ac.speedKmH} km/h</strong></div>
                <div>Cost: <strong style={{ color: '#b0c8dc' }}>{ac.cost === 0 ? 'FREE' : fmt(ac.cost)}</strong></div>
                <div>Income: <strong style={{ color: '#34d399' }}>×{ac.incomePerRoute || 1}</strong></div>
              </div>

              {/* Airport tiers */}
              <div style={{ marginBottom: 8, fontSize: 10, color: '#8fa8bf' }}>
                Airports:{' '}
                {['SMALL', 'REGIONAL', 'INTL', 'MEGA'].map(t => (
                  <span key={t} style={{
                    display: 'inline-block',
                    fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
                    padding: '2px 5px', borderRadius: 3,
                    margin: '0 2px 2px 0',
                    border: '1px solid',
                    color: ac.tiers.includes(t) ? '#34d399' : '#4a6a7a',
                    borderColor: ac.tiers.includes(t) ? 'rgba(52,211,153,0.3)' : 'rgba(74,106,122,0.2)',
                    opacity: ac.tiers.includes(t) ? 1 : 0.5,
                  }}>{t}</span>
                ))}
              </div>

              {/* Stat bars */}
              {[
                { label: 'Range',    val: ac.bars.r, color: '#38bdf8' },
                { label: 'Capacity', val: ac.bars.c, color: '#fbbf24' },
                { label: 'Efficiency', val: ac.bars.e, color: '#34d399' },
              ].map(bar => (
                <div key={bar.label} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 6, marginBottom: 4,
                }}>
                  <span style={{
                    width: 60, fontSize: 9,
                    color: '#8fa8bf',
                    fontFamily: 'JetBrains Mono, monospace',
                    flexShrink: 0,
                  }}>{bar.label}</span>
                  <div style={{
                    flex: 1, height: 3,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: bar.val + '%', height: '100%',
                      background: bar.color, borderRadius: 2,
                    }} />
                  </div>
                </div>
              ))}

              {/* Owned count */}
              <div style={{ textAlign: 'center', margin: '8px 0 4px' }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 22, fontWeight: 600, color: '#38bdf8',
                }}>{owned}</div>
                <div style={{ fontSize: 8, color: '#8fa8bf', letterSpacing: 1 }}>OWNED</div>
              </div>

              {/* Starter label */}
              {ac.starterFree && owned === 0 && (
                <div style={{
                  textAlign: 'center', fontSize: 10,
                  color: '#34d399', marginBottom: 6,
                }}>
                  🎁 1 given free at start
                </div>
              )}

              {/* Buy button or lock message */}
              {unlocked ? (
                <button
                  disabled={!canAfford}
                  onClick={() => buyAircraft(ac.id)}
                  style={{
                    width: '100%', padding: 9,
                    borderRadius: 8, border: 'none',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12, fontWeight: 700,
                    cursor: canAfford ? 'pointer' : 'default',
                    background: canAfford ? '#fbbf24' : 'rgba(255,255,255,0.07)',
                    color: canAfford ? '#07111c' : '#5d7d96',
                    marginTop: 4,
                    transition: 'all 0.15s',
                  }}
                >
                  {canAfford
                    ? `Buy for ${fmt(ac.cost)}`
                    : `Need ${fmt(ac.cost - money)} more`
                  }
                </button>
              ) : (
                <div style={{
                  width: '100%', padding: 9,
                  borderRadius: 8,
                  background: 'rgba(167,139,250,0.07)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  color: 'rgba(167,139,250,0.7)',
                  fontSize: 11, textAlign: 'center', marginTop: 4,
                }}>
                  🔒 {prevAC ? `Buy ${prevAC.name} first` : 'Locked'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}