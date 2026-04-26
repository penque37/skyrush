import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMapEvents } from 'react-leaflet'
import { AIRPORTS, MAX_PAX } from '../data/airports'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const TIER_COLORS = {
  start:     { color: '#fbbf24', fill: '#fbbf24' },
  owned:     { color: '#38bdf8', fill: '#38bdf8' },
  available: { color: '#34d399', fill: '#34d399' },
  needac:    { color: '#a78bfa', fill: '#a78bfa' },
  locked:    { color: '#4a6a7a', fill: '#1a2a38' },
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (e.originalEvent.target.closest('.leaflet-marker-icon')) return
      onMapClick()
    },
  })
  return null
}

function AirportMarkers({ getStatus, onSelect, selectedAirport }) {
  return AIRPORTS.map(airport => {
    const status = getStatus(airport.i)
    const colors = TIER_COLORS[status]
    const size = Math.round(10 + Math.pow(airport.p / MAX_PAX, 0.42) * 18)
    const isSelected = airport.i === selectedAirport
    const displaySize = isSelected ? size * 1.4 : size

    const icon = L.divIcon({
      className: '',
      iconSize: [displaySize, displaySize + 6],
      iconAnchor: [displaySize / 2, displaySize + 6],
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <div style="
            width:${displaySize}px;
            height:${displaySize}px;
            background:${colors.fill}33;
            border:${isSelected ? 3 : 2}px solid ${colors.color};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 0 ${isSelected ? 16 : 8}px ${colors.color}${isSelected ? 'cc' : '88'};
            transition:all 0.2s;
          "></div>
        </div>
      `,
    })

    return (
      <Marker
        key={airport.i}
        position={[airport.la, airport.lo]}
        icon={icon}
        eventHandlers={{
          click: (e) => {
            L.DomEvent.stopPropagation(e)
            onSelect(airport.i)
          },
        }}
      >
        <Tooltip
          direction="top"
          offset={[0, -(displaySize + 6)]}
          opacity={1}
        >
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            fontSize: 11,
            color: colors.color,
            background: 'rgba(8,18,28,0.95)',
            border: `1px solid ${colors.color}44`,
            borderRadius: 5,
            padding: '2px 6px',
            whiteSpace: 'nowrap',
          }}>
            {airport.i} · {airport.n}
          </div>
        </Tooltip>
      </Marker>
    )
  })
}

function RouteLines({ selectedAirport, getAvailableDestinations, routes, owned }) {
  if (!selectedAirport) return null

  const hub = AIRPORTS.find(x => x.i === selectedAirport)
  if (!hub) return null

  const activeRoutes = Object.values(routes).filter(
    r => r.from === selectedAirport || r.to === selectedAirport
  )

  const activeDests = new Set(activeRoutes.map(r =>
    r.from === selectedAirport ? r.to : r.from
  ))

  const potentialDests = owned.includes(selectedAirport)
    ? getAvailableDestinations(selectedAirport).filter(d => !activeDests.has(d.i))
    : getAvailableDestinations(selectedAirport)

  return (
    <>
      {activeRoutes.map(route => {
        const other = AIRPORTS.find(x =>
          x.i === (route.from === selectedAirport ? route.to : route.from)
        )
        if (!other) return null
        return (
          <Polyline
            key={`active-${route.from}-${route.to}`}
            positions={[[hub.la, hub.lo], [other.la, other.lo]]}
            pathOptions={{
              color: '#38bdf8',
              weight: 2,
              opacity: 0.8,
              dashArray: '6, 4',
            }}
          />
        )
      })}

      {potentialDests.map(dest => (
        <Polyline
          key={`potential-${selectedAirport}-${dest.i}`}
          positions={[[hub.la, hub.lo], [dest.la, dest.lo]]}
          pathOptions={{
            color: '#4a5a6a',
            weight: 1,
            opacity: 0.35,
            dashArray: '3, 8',
          }}
        />
      ))}
    </>
  )
}

function PlaneMarkers({ planePositions }) {
  const [smoothPositions, setSmoothPositions] = useState(planePositions)
  const targetRef = useRef(planePositions)
  const animRef = useRef(null)

  useEffect(() => {
    targetRef.current = planePositions
  }, [planePositions])

  useEffect(() => {
    function animate() {
      setSmoothPositions(prev => {
        const targets = targetRef.current
        const next = []

        targets.forEach(target => {
          const existing = prev.find(p => p.id === target.id)
          if (!existing) {
            next.push(target)
            return
          }
          const speed = 0.12
          next.push({
            ...target,
            lat: existing.lat + (target.lat - existing.lat) * speed,
            lng: existing.lng + (target.lng - existing.lng) * speed,
          })
        })

        return next
      })
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return smoothPositions.map(plane => {
    const icon = L.divIcon({
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      html: `
  <div style="
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(${plane.angle}deg);
    filter: drop-shadow(0 0 3px rgba(251,191,36,0.9));
    transform-origin: center center;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill="#fbbf24"
        stroke="#d97706"
        stroke-width="0.5"
      />
    </svg>
  </div>
`,
    })

    return (
      <Marker
        key={plane.id}
        position={[plane.lat, plane.lng]}
        icon={icon}
        zIndexOffset={500}
      >
        <Tooltip direction="top" offset={[0, -10]} opacity={1}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: '#fbbf24',
            background: 'rgba(8,18,28,0.95)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 4,
            padding: '2px 6px',
            whiteSpace: 'nowrap',
          }}>
            {plane.from} → {plane.to}
          </div>
        </Tooltip>
      </Marker>
    )
  })
}

export default function GameMap({
  getStatus,
  onSelectAirport,
  selectedAirport,
  getAvailableDestinations,
  routes,
  owned,
  planePositions,
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <style>{`
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-top:before {
          display: none !important;
        }
      `}</style>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
          maxZoom={19}
        />

        <MapClickHandler onMapClick={() => onSelectAirport(null)} />

        <RouteLines
          selectedAirport={selectedAirport}
          getAvailableDestinations={getAvailableDestinations}
          routes={routes}
          owned={owned}
        />

        <PlaneMarkers planePositions={planePositions} />

        <AirportMarkers
          getStatus={getStatus}
          onSelect={onSelectAirport}
          selectedAirport={selectedAirport}
        />

      </MapContainer>
    </div>
  )
}