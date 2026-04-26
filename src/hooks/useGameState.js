import { useState, useEffect } from 'react'
import { AIRCRAFT } from '../data/aircraft'
import { AIRPORTS, TICKET_PRICES, ROUTE_COSTS } from '../data/airports'

const TIER_RANK = { SMALL: 1, REGIONAL: 2, INTL: 3, MEGA: 4 }
const TIME_COMPRESSION = 60

function getDistanceKm(la1, lo1, la2, lo2) {
  const R = 6371
  const dLat = (la2 - la1) * Math.PI / 180
  const dLon = (lo2 - lo1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getBearing(fromLat, fromLng, toLat, toLng) {
  const dLat = toLat - fromLat
  const dLng = toLng - fromLng
  return Math.atan2(dLng, dLat) * 180 / Math.PI
}

function generateId() {
  return 'p_' + Math.random().toString(36).substr(2, 9)
}

function loadState() {
  try {
    const saved = localStorage.getItem('skyrush_save')
    if (saved) return JSON.parse(saved)
  } catch (e) {}
  return null
}

const DEFAULT_STATE = {
  money: 0,
  owned: ['BTV'],
  fleet: { twin_otter: 1 },
  hubs: { BTV: { twin_otter: 1 } },
  routes: {
    'BTV-BOI': {
      from: 'BTV',
      to: 'BOI',
      aircraftId: 'twin_otter',
      planes: [{ id: 'p_starter', progress: 0, direction: 1 }],
    }
  }
}

export function useGameState() {
  const saved = loadState()

  const [money, setMoney] = useState(saved?.money ?? DEFAULT_STATE.money)
  const [owned, setOwned] = useState(saved?.owned ?? DEFAULT_STATE.owned)
  const [fleet, setFleet] = useState(saved?.fleet ?? DEFAULT_STATE.fleet)
  const [hubs, setHubs] = useState(saved?.hubs ?? DEFAULT_STATE.hubs)
  const [routes, setRoutes] = useState(saved?.routes ?? DEFAULT_STATE.routes)

  // ── HELPERS ──
  function getAircraft(id) {
    return AIRCRAFT.find(a => a.id === id)
  }

  function bestAC() {
    for (let i = AIRCRAFT.length - 1; i >= 0; i--) {
      if ((fleet[AIRCRAFT[i].id] || 0) > 0) return AIRCRAFT[i]
    }
    return AIRCRAFT[0]
  }

  function ownedTiers() {
    const tiers = new Set()
    owned.forEach(iata => {
      const a = AIRPORTS.find(x => x.i === iata)
      if (a) tiers.add(a.t)
    })
    return tiers
  }

  function ownedCountOfTier(tier) {
    return owned.filter(iata => {
      const a = AIRPORTS.find(x => x.i === iata)
      return a?.t === tier
    }).length
  }

  // ── AIRPORT UNLOCK RULES ──
  function canBuyAirport(iata) {
    const a = AIRPORTS.find(x => x.i === iata)
    if (!a) return false
    if (owned.includes(iata)) return false
    const tiers = ownedTiers()
    switch (a.t) {
      case 'SMALL':    return true
      case 'REGIONAL': return tiers.has('SMALL')
      case 'INTL':     return tiers.has('REGIONAL')
      case 'MEGA':     return tiers.has('INTL')
      default:         return false
    }
  }

  // ── AIRCRAFT UNLOCK RULES ──
  function canUnlockAC(ac) {
    const tiers = ownedTiers()
    // Must own previous plane first
    if (ac.unlock && (fleet[ac.unlock.id] || 0) < ac.unlock.n) return false
    // Must own airport of required tier
    switch (ac.level) {
      case 1: return true
      case 2: return tiers.has('REGIONAL')
      case 3: return tiers.has('INTL')
      case 4: return tiers.has('MEGA')
      case 5: return ownedCountOfTier('MEGA') >= 3
      default: return false
    }
  }

  // ── PLANE COUNTS ──
  function planesAssignedToRoutes(hubIata, aircraftId) {
    return Object.values(routes)
      .filter(r => r.from === hubIata && r.aircraftId === aircraftId)
      .reduce((sum, r) => sum + r.planes.length, 0)
  }

  function planesAvailableAtHub(hubIata, aircraftId) {
    const based = (hubs[hubIata] || {})[aircraftId] || 0
    const assigned = planesAssignedToRoutes(hubIata, aircraftId)
    return Math.max(0, based - assigned)
  }

  function totalBasedPlanes(aircraftId) {
    return Object.values(hubs).reduce((sum, hub) => sum + (hub[aircraftId] || 0), 0)
  }

  function freePlanes(aircraftId) {
    return Math.max(0, (fleet[aircraftId] || 0) - totalBasedPlanes(aircraftId))
  }

  // ── ROUTE HELPERS ──
  function getRouteKey(from, to) {
    return `${from}-${to}`
  }

  function getCycleTime(from, to, aircraftId) {
    const hub = AIRPORTS.find(x => x.i === from)
    const dest = AIRPORTS.find(x => x.i === to)
    const ac = getAircraft(aircraftId)
    if (!hub || !dest || !ac) return 60
    const dist = getDistanceKm(hub.la, hub.lo, dest.la, dest.lo)
    return Math.max(10, (dist / ac.speedKmH) * 2 * (TIME_COMPRESSION / 60))
  }

  function getRevenuePerCycle(from, to, aircraftId) {
    const hub = AIRPORTS.find(x => x.i === from)
    const dest = AIRPORTS.find(x => x.i === to)
    const ac = getAircraft(aircraftId)
    if (!hub || !dest || !ac) return 0
    const key = `${hub.t}-${dest.t}`
    const ticketPrice = TICKET_PRICES[key] || 80
    return ac.seats * ticketPrice
  }

  function getRouteCost(from, to) {
    const hub = AIRPORTS.find(x => x.i === from)
    const dest = AIRPORTS.find(x => x.i === to)
    if (!hub || !dest) return 0
    return ROUTE_COSTS[`${hub.t}-${dest.t}`] || 50
  }

  function getAvailableDestinations(hubIata) {
    const hub = AIRPORTS.find(x => x.i === hubIata)
    if (!hub) return []
    const best = bestAC()
    const hubRank = TIER_RANK[hub.t]
    return AIRPORTS.filter(dest => {
      if (dest.i === hubIata) return false
      if (TIER_RANK[dest.t] > hubRank) return false
      if (!best.tiers.includes(dest.t)) return false
      return true
    })
  }

  function getRoutesFromHub(hubIata) {
    return Object.values(routes).filter(r => r.from === hubIata)
  }

  function calcIncome() {
    return Object.values(routes).reduce((sum, route) => {
      const cycleTime = getCycleTime(route.from, route.to, route.aircraftId)
      const revenuePerCycle = getRevenuePerCycle(route.from, route.to, route.aircraftId)
      return sum + (revenuePerCycle / cycleTime) * route.planes.length
    }, 0)
  }

  // ── PLANE POSITIONS — correct bearing ──
  function getPlanePositions() {
    const positions = []
    Object.entries(routes).forEach(([key, route]) => {
      const hub = AIRPORTS.find(x => x.i === route.from)
      const dest = AIRPORTS.find(x => x.i === route.to)
      if (!hub || !dest) return

      route.planes.forEach(plane => {
        const isOutbound = plane.direction === 1
        const fromLat = isOutbound ? hub.la : dest.la
        const fromLng = isOutbound ? hub.lo : dest.lo
        const toLat   = isOutbound ? dest.la : hub.la
        const toLng   = isOutbound ? dest.lo : hub.lo

        const t = plane.progress
        const lat = fromLat + (toLat - fromLat) * t
        const lng = fromLng + (toLng - fromLng) * t

        // Use proper bearing formula so nose faces destination
        const angle = getBearing(fromLat, fromLng, toLat, toLng)

        positions.push({
          id: plane.id,
          lat, lng, angle,
          from: route.from,
          to: route.to,
          aircraftId: route.aircraftId,
          isOutbound,
        })
      })
    })
    return positions
  }

  // ── STATUS ──
  function getStatus(iata) {
  const a = AIRPORTS.find(x => x.i === iata)
  if (!a) return 'locked'
  if (iata === 'BTV' && owned.includes('BTV')) return 'start'
  if (owned.includes(iata)) return 'owned'

  // Check airport tier unlock (own tier below)
  if (!canBuyAirport(iata)) return 'locked'

  // Check if player can afford it
  if (money >= a.co) return 'available'
  return 'locked'
}

  // ── ACTIONS ──
  function buyAirport(iata) {
    const a = AIRPORTS.find(x => x.i === iata)
    if (!a) return false
    if (owned.includes(iata)) return false
    if (!canBuyAirport(iata)) return false
    if (money < a.co) return false
    setMoney(m => m - a.co)
    setOwned(o => [...o, iata])
    return true
  }

  function buyAircraft(id) {
    const ac = AIRCRAFT.find(x => x.id === id)
    if (!ac) return false
    if (!canUnlockAC(ac)) return false
    if (money < ac.cost) return false
    setMoney(m => m - ac.cost)
    setFleet(f => ({ ...f, [id]: (f[id] || 0) + 1 }))
    return true
  }

  function basePlaneAtHub(hubIata, aircraftId) {
    if (freePlanes(aircraftId) <= 0) return false
    setHubs(h => ({
      ...h,
      [hubIata]: {
        ...(h[hubIata] || {}),
        [aircraftId]: ((h[hubIata] || {})[aircraftId] || 0) + 1,
      }
    }))
    return true
  }

  function removePlaneFromHub(hubIata, aircraftId) {
    if (planesAvailableAtHub(hubIata, aircraftId) <= 0) return false
    setHubs(h => ({
      ...h,
      [hubIata]: {
        ...(h[hubIata] || {}),
        [aircraftId]: Math.max(0, ((h[hubIata] || {})[aircraftId] || 0) - 1),
      }
    }))
    return true
  }

  function openRoute(from, to, aircraftId) {
    const key = getRouteKey(from, to)
    if (routes[key]) return false
    const cost = getRouteCost(from, to)
    if (money < cost) return false
    if (planesAvailableAtHub(from, aircraftId) < 1) return false
    setMoney(m => m - cost)
    setRoutes(r => ({
      ...r,
      [key]: {
        from, to, aircraftId,
        planes: [{ id: generateId(), progress: 0, direction: 1 }],
      }
    }))
    return true
  }

  function addPlaneToRoute(from, to) {
    const key = getRouteKey(from, to)
    const route = routes[key]
    if (!route) return false
    if (planesAvailableAtHub(from, route.aircraftId) < 1) return false
    setRoutes(r => ({
      ...r,
      [key]: {
        ...r[key],
        planes: [...r[key].planes, { id: generateId(), progress: 0, direction: 1 }],
      }
    }))
    return true
  }

  function removePlaneFromRoute(from, to) {
    const key = getRouteKey(from, to)
    const route = routes[key]
    if (!route || route.planes.length <= 1) return false
    setRoutes(r => ({
      ...r,
      [key]: {
        ...r[key],
        planes: r[key].planes.slice(0, -1),
      }
    }))
    return true
  }

  function doTap() {
    const totalRevenue = Object.values(routes).reduce((sum, route) => {
      return sum + getRevenuePerCycle(route.from, route.to, route.aircraftId) * 0.05
    }, 0)
    const val = Math.max(0.5, totalRevenue)
    setMoney(m => m + val)
    return val
  }

  function fmt(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K'
    return '$' + n.toFixed(n < 10 ? 1 : 0)
  }

  function resetGame() {
    localStorage.removeItem('skyrush_save')
    setMoney(DEFAULT_STATE.money)
    setOwned(DEFAULT_STATE.owned)
    setFleet(DEFAULT_STATE.fleet)
    setHubs(DEFAULT_STATE.hubs)
    setRoutes(DEFAULT_STATE.routes)
  }

  // ── AUTO SAVE ──
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        localStorage.setItem('skyrush_save', JSON.stringify({
          money, owned, fleet, hubs, routes,
        }))
      } catch (e) {}
    }, 5000)
    return () => clearInterval(interval)
  }, [money, owned, fleet, hubs, routes])

  // ── TICK LOOP ──
  useEffect(() => {
    const interval = setInterval(() => {
      const dt = 0.25
      setRoutes(prevRoutes => {
        const newRoutes = { ...prevRoutes }
        let earned = 0

        Object.keys(newRoutes).forEach(key => {
          const route = { ...newRoutes[key] }
          const cycleTime = getCycleTime(route.from, route.to, route.aircraftId)
          const revenuePerCycle = getRevenuePerCycle(route.from, route.to, route.aircraftId)
          const progressPerTick = dt / cycleTime

          route.planes = route.planes.map(plane => {
            let newProgress = plane.progress + progressPerTick
            let newDirection = plane.direction

            if (newProgress >= 1) {
              newProgress = newProgress - 1
              // Only earn on outbound (direction === 1)
              // unless destination is also owned → earn on return too
              const destOwned = owned.includes(route.to)
              if (plane.direction === 1 || destOwned) {
                earned += revenuePerCycle
              }
              newDirection = plane.direction * -1
            }

            return { ...plane, progress: newProgress, direction: newDirection }
          })

          newRoutes[key] = route
        })

        if (earned > 0) setMoney(m => m + earned)
        return newRoutes
      })
    }, 250)
    return () => clearInterval(interval)
  }, [owned])

  return {
    money, owned, fleet, hubs, routes,
    bestAC, calcIncome, getStatus,
    getRoutesFromHub, getAvailableDestinations,
    getPlanePositions, getRevenuePerCycle,
    getCycleTime, getRouteCost,
    buyAirport, buyAircraft,
    basePlaneAtHub, removePlaneFromHub,
    openRoute, addPlaneToRoute, removePlaneFromRoute,
    canUnlockAC, canBuyAirport, ownedTiers,
    freePlanes, planesAvailableAtHub,
    planesAssignedToRoutes, totalBasedPlanes,
    fmt, doTap, resetGame,
  }
}