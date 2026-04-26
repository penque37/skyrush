import { useState } from 'react'
import { AIRPORTS, MAX_PAX } from '../data/airports'
import { AIRCRAFT } from '../data/aircraft'

export default function BottomSheet({
  selectedAirport, getStatus, money,
  buyAirport, bestAC, fmt, onClose,
  getRoutesFromHub, getAvailableDestinations,
  getRevenuePerCycle, getCycleTime, getRouteCost,
  openRoute, addPlaneToRoute, removePlaneFromRoute,
  basePlaneAtHub, removePlaneFromHub,
  routes, owned, fleet,
  freePlanes, planesAvailableAtHub,
}) {
  const [expandedRoute, setExpandedRoute] = useState(null)
  const [showNewRoute, setShowNewRoute] = useState(false)
  const [selectedDest, setSelectedDest] = useState(null)
  const [selectedAC, setSelectedAC] = useState(null)

  if (!selectedAirport) return null
  const a = AIRPORTS.find(x => x.i === selectedAirport)
  if (!a) return null

  const status = getStatus(selectedAirport)
  const isOwned = status === 'owned' || status === 'start'
  const volPct = Math.round((a.p / MAX_PAX) * 100)
  const hubRoutes = getRoutesFromHub(selectedAirport)
  const availableDests = getAvailableDestinations(selectedAirport)
  const openRouteDests = new Set(hubRoutes.map(r => r.to))
  const newRouteDests = availableDests.filter(d => !openRouteDests.has(d.i))

  const iataColors = {
    start: '#fbbf24', owned: '#38bdf8',
    available: '#34d399', needac: '#a78bfa', locked: '#5d7d96',
  }

  const reqAC = !isOwned && a.req ? AIRCRAFT.find(x => x.id === a.req) : null
  const [expanded, setExpanded] = useState(false)

  // Planes based at this hub per model
  const hubPlanes = owned.includes(selectedAirport)
    ? AIRCRAFT.filter(ac => (fleet[ac.id] || 0) > 0)
    : []

  function handleOpenRoute() {
    if (!selectedDest || !selectedAC) return
    const success = openRoute(selectedAirport, selectedDest, selectedAC)
    if (success) {
      setShowNewRoute(false)
      setSelectedDest(null)
      setSelectedAC(null)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 44, left: 0, right: 0,
      zIndex: 500,
      background: 'rgba(8,18,28,0.97)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '18px 18px 0 0',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 -4px 40px rgba(0,0,0,0.6)',
      maxHeight: expanded ? '75vh' : 'auto',
      overflowY: expanded ? 'auto' : 'visible',
      transition: 'max-height 0.3s ease',
    }}>
      <div style={{
        width: 36, height: 4,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 2, margin: '10px auto 0',
      }} />

      <div style={{ padding: '12px 16px 16px' }}>

        {/* ── COLLAPSED HEADER (always visible) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>{a.f}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 22, fontWeight: 600, lineHeight: 1,
              color: iataColors[status] || '#5d7d96',
            }}>{a.i}</div>
            <div style={{ fontSize: 11, color: '#8fa8bf' }}>{a.n} · {a.t}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isOwned && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: expanded ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${expanded ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.12)'}`,
                  color: expanded ? '#38bdf8' : '#f0f4f8',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {expanded ? '▲ Less' : '▼ Manage'}
              </button>
            )}
            <div onClick={() => { onClose(); setExpanded(false) }} style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, cursor: 'pointer', color: '#8fa8bf',
            }}>✕</div>
          </div>
        </div>

        {/* Quick stats row — always visible */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 10,
        }}>
          {[
            { val: a.p >= 1 ? a.p.toFixed(1) + 'M' : (a.p * 1000).toFixed(0) + 'K', lbl: 'Passengers' },
            { val: a.t, lbl: 'Tier', color: '#fbbf24' },
            { val: isOwned ? hubRoutes.length : fmt(a.co), lbl: isOwned ? 'Routes' : 'Cost' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '6px 8px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, fontWeight: 600,
                color: s.color || '#f0f4f8',
              }}>{s.val}</div>
              <div style={{ fontSize: 8, color: '#8fa8bf', marginTop: 1 }}>{s.lbl}</div>
            </div>
          ))}

          {/* Acquire button if not owned */}
          {!isOwned && (
            <button
              disabled={status !== 'available'}
              onClick={() => { buyAirport(selectedAirport); onClose() }}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 8, border: 'none',
                fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
                cursor: status === 'available' ? 'pointer' : 'default',
                background: status === 'available'
                  ? 'linear-gradient(135deg,#34d399,#059669)' : 'rgba(255,255,255,0.05)',
                color: status === 'available' ? '#07111c' : '#5d7d96',
                border: status !== 'available' ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}
            >
              {status === 'available' ? `Buy ${fmt(a.co)}` : `${fmt(a.co)}`}
            </button>
          )}
        </div>

        {/* ── EXPANDED CONTENT ── */}
        {expanded && isOwned && (
          <div style={{ marginTop: 14 }}>

            {/* Passenger bar */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ width: volPct + '%', height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)', borderRadius: 2 }} />
            </div>

            {/* ── BASED AIRCRAFT ── */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', marginBottom: 8 }}>
                ✈ Aircraft Based Here
              </div>
              {AIRCRAFT.filter(ac => (fleet[ac.id] || 0) > 0).map(ac => {
                const onRoutes = Object.values(routes)
                  .filter(r => r.from === selectedAirport && r.aircraftId === ac.id)
                  .reduce((s, r) => s + r.planes.length, 0)
                const basedAtThisHub = planesAvailableAtHub(selectedAirport, ac.id) + onRoutes

                return (
                  <div key={ac.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '10px 12px',
                    marginBottom: 7,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{ac.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4f8' }}>{ac.name}</div>
                      <div style={{ fontSize: 10, color: '#8fa8bf', fontFamily: 'JetBrains Mono, monospace' }}>
                        {basedAtThisHub} based · {onRoutes} on routes · {freePlanes(ac.id)} free
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => removePlaneFromHub(selectedAirport, ac.id)}
                        disabled={basedAtThisHub - onRoutes <= 0}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#f0f4f8', fontSize: 16, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: basedAtThisHub - onRoutes <= 0 ? 0.3 : 1,
                        }}
                      >−</button>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 14, fontWeight: 600,
                        color: '#38bdf8', minWidth: 20, textAlign: 'center',
                      }}>{basedAtThisHub}</span>
                      <button
                        onClick={() => basePlaneAtHub(selectedAirport, ac.id)}
                        disabled={freePlanes(ac.id) <= 0}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'rgba(56,189,248,0.15)',
                          border: '1px solid rgba(56,189,248,0.3)',
                          color: '#38bdf8', fontSize: 16, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: freePlanes(ac.id) <= 0 ? 0.3 : 1,
                        }}
                      >+</button>
                    </div>
                  </div>
                )
              })}
              {AIRCRAFT.filter(ac => (fleet[ac.id] || 0) > 0).length === 0 && (
                <div style={{ fontSize: 11, color: '#5d7d96', textAlign: 'center', padding: '10px 0' }}>
                  No aircraft owned yet. Buy planes in the Fleet tab!
                </div>
              )}
            </div>

            {/* ── ACTIVE ROUTES ── */}
            {hubRoutes.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', marginBottom: 8 }}>
                  🛫 Active Routes
                </div>
                {hubRoutes.map(route => {
                  const dest = AIRPORTS.find(x => x.i === route.to)
                  if (!dest) return null
                  const ac = AIRCRAFT.find(x => x.id === route.aircraftId)
                  const revenue = getRevenuePerCycle(route.from, route.to, route.aircraftId)
                  const cycleTime = getCycleTime(route.from, route.to, route.aircraftId)
                  const perSecond = (revenue / cycleTime) * route.planes.length
                  const isExpanded = expandedRoute === `${route.from}-${route.to}`
                  const destOwned = owned.includes(dest.i)
                  const availableForRoute = planesAvailableAtHub(selectedAirport, route.aircraftId)

                  return (
                    <div key={`${route.from}-${route.to}`} style={{
                      background: 'rgba(56,189,248,0.04)',
                      border: '1px solid rgba(56,189,248,0.15)',
                      borderRadius: 10, marginBottom: 7, overflow: 'hidden',
                    }}>
                      <div
                        onClick={() => setExpandedRoute(isExpanded ? null : `${route.from}-${route.to}`)}
                        style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: '#f0f4f8' }}>
                            {route.from} → {route.to}
                            {destOwned && <span style={{ color: '#34d399', fontSize: 10, marginLeft: 6 }}>↩ 2x</span>}
                          </div>
                          <div style={{ fontSize: 10, color: '#8fa8bf' }}>
                            {dest.f} {dest.n} · {ac?.name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#34d399' }}>
                            {fmt(perSecond)}/s
                          </div>
                          <div style={{ fontSize: 9, color: '#8fa8bf' }}>
                            {route.planes.length} plane{route.planes.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{ color: '#5d7d96', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</div>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
                          <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr',
                            gap: '4px 10px', fontSize: 10,
                            color: '#8fa8bf', marginBottom: 10,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}>
                            <div>Per cycle: <strong style={{ color: '#f0f4f8' }}>{fmt(revenue)}</strong></div>
                            <div>Cycle: <strong style={{ color: '#f0f4f8' }}>{Math.round(cycleTime)}s</strong></div>
                            <div>Planes: <strong style={{ color: '#38bdf8' }}>{route.planes.length}</strong></div>
                            <div>Available: <strong style={{ color: '#34d399' }}>{availableForRoute}</strong></div>
                            {destOwned && (
                              <div style={{ gridColumn: 'span 2', color: '#34d399' }}>
                                ✓ {dest.i} owned — return leg earns too
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 7 }}>
                            <button
                              onClick={() => removePlaneFromRoute(route.from, route.to)}
                              disabled={route.planes.length <= 1}
                              style={{
                                flex: 1, padding: 7, borderRadius: 7,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#f0f4f8', fontSize: 12, fontWeight: 600,
                                cursor: route.planes.length <= 1 ? 'default' : 'pointer',
                                opacity: route.planes.length <= 1 ? 0.3 : 1,
                              }}
                            >− Remove Plane</button>
                            <button
                              onClick={() => addPlaneToRoute(route.from, route.to)}
                              disabled={availableForRoute <= 0}
                              style={{
                                flex: 1, padding: 7, borderRadius: 7,
                                background: availableForRoute > 0 ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${availableForRoute > 0 ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                color: availableForRoute > 0 ? '#38bdf8' : '#5d7d96',
                                fontSize: 12, fontWeight: 600,
                                cursor: availableForRoute <= 0 ? 'default' : 'pointer',
                              }}
                            >+ Add Plane</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── OPEN NEW ROUTE ── */}
            <div>
              <button
                onClick={() => setShowNewRoute(!showNewRoute)}
                style={{
                  width: '100%', padding: 11, borderRadius: 10,
                  background: showNewRoute ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showNewRoute ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: showNewRoute ? '#38bdf8' : '#8fa8bf',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', marginBottom: 10,
                }}
              >
                {showNewRoute ? '✕ Cancel' : '＋ Expand Terminal — Open New Route'}
              </button>

              {showNewRoute && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: 12,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8fa8bf', marginBottom: 8 }}>
                    Select Destination
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
                    {newRouteDests.length === 0 && (
                      <div style={{ fontSize: 11, color: '#5d7d96', textAlign: 'center', padding: 10 }}>
                        All available routes already open!
                      </div>
                    )}
                    {newRouteDests.map(dest => (
                      <div
                        key={dest.i}
                        onClick={() => setSelectedDest(dest.i)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', borderRadius: 8, marginBottom: 5,
                          cursor: 'pointer',
                          background: selectedDest === dest.i ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selectedDest === dest.i ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{dest.f}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#f0f4f8' }}>
                            {dest.i} · {dest.n}
                          </div>
                          <div style={{ fontSize: 10, color: '#8fa8bf' }}>
                            {dest.c} · {dest.t}
                            {owned.includes(dest.i) && <span style={{ color: '#34d399', marginLeft: 6 }}>✓ Owned (2x)</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 10, color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fmt(getRouteCost(selectedAirport, dest.i))}
                          </div>
                          <div style={{ fontSize: 9, color: '#5d7d96' }}>to open</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedDest && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#8fa8bf', marginBottom: 8 }}>
                        Select Aircraft
                      </div>
                      {AIRCRAFT.filter(ac => (fleet[ac.id] || 0) > 0 && planesAvailableAtHub(selectedAirport, ac.id) > 0).map(ac => {
                        const revenue = getRevenuePerCycle(selectedAirport, selectedDest, ac.id)
                        const cycleTime = getCycleTime(selectedAirport, selectedDest, ac.id)
                        return (
                          <div
                            key={ac.id}
                            onClick={() => setSelectedAC(ac.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 10px', borderRadius: 8, marginBottom: 5,
                              cursor: 'pointer',
                              background: selectedAC === ac.id ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${selectedAC === ac.id ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            }}
                          >
                            <span style={{ fontSize: 20 }}>{ac.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#f0f4f8' }}>{ac.name}</div>
                              <div style={{ fontSize: 10, color: '#8fa8bf' }}>
                                {ac.seats} seats · {planesAvailableAtHub(selectedAirport, ac.id)} available
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 11, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmt(revenue / cycleTime)}/s
                              </div>
                              <div style={{ fontSize: 9, color: '#5d7d96' }}>per plane</div>
                            </div>
                          </div>
                        )
                      })}
                      {AIRCRAFT.filter(ac => (fleet[ac.id] || 0) > 0 && planesAvailableAtHub(selectedAirport, ac.id) > 0).length === 0 && (
                        <div style={{ fontSize: 11, color: '#5d7d96', textAlign: 'center', padding: 10 }}>
                          No planes available here. Base some aircraft first!
                        </div>
                      )}
                    </>
                  )}

                  {selectedDest && selectedAC && (
                    <button
                      onClick={handleOpenRoute}
                      disabled={money < getRouteCost(selectedAirport, selectedDest)}
                      style={{
                        width: '100%', padding: 11, borderRadius: 10,
                        border: 'none', marginTop: 8,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13, fontWeight: 700,
                        cursor: money >= getRouteCost(selectedAirport, selectedDest) ? 'pointer' : 'default',
                        background: money >= getRouteCost(selectedAirport, selectedDest)
                          ? 'linear-gradient(135deg,#34d399,#059669)' : 'rgba(255,255,255,0.05)',
                        color: money >= getRouteCost(selectedAirport, selectedDest) ? '#07111c' : '#5d7d96',
                      }}
                    >
                      {money >= getRouteCost(selectedAirport, selectedDest)
                        ? `Open Route — ${fmt(getRouteCost(selectedAirport, selectedDest))}`
                        : `Need ${fmt(getRouteCost(selectedAirport, selectedDest) - money)} more`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}