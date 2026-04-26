import { useState } from 'react'
import { useGameState } from './hooks/useGameState'
import GameMap from './components/Map'
import TopHUD from './components/TopHUD'
import BottomSheet from './components/BottomSheet'
import FleetPanel from './components/FleetPanel'
import './index.css'

export default function App() {
  const [selectedAirport, setSelectedAirport] = useState(null)
  const [activeTab, setActiveTab] = useState('map')

  const {
    money, owned, fleet, hubs, routes,
    bestAC, calcIncome, getStatus,
    getRoutesFromHub, getAvailableDestinations,
    getPlanePositions, getRevenuePerCycle,
    getCycleTime, getRouteCost,
    buyAirport, buyAircraft,
    basePlaneAtHub, removePlaneFromHub,
    openRoute, addPlaneToRoute, removePlaneFromRoute,
    canUnlockAC, ownedTiers,
    freePlanes, planesAvailableAtHub,
    fmt, doTap,
  } = useGameState()

  function handleSelectAirport(iata) {
    if (iata === null) { setSelectedAirport(null); return }
    setSelectedAirport(iata)
    setActiveTab('map')
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    setSelectedAirport(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d1f2e' }}>

      <GameMap
        getStatus={getStatus}
        onSelectAirport={handleSelectAirport}
        selectedAirport={selectedAirport}
        getAvailableDestinations={getAvailableDestinations}
        routes={routes}
        owned={owned}
        planePositions={getPlanePositions()}
      />

      <TopHUD
        money={money}
        income={calcIncome()}
        airportCount={owned.length}
        bestAC={bestAC()}
        fmt={fmt}
        onTap={doTap}
      />

      {activeTab === 'map' && selectedAirport && (
        <BottomSheet
          selectedAirport={selectedAirport}
          getStatus={getStatus}
          money={money}
          buyAirport={buyAirport}
          bestAC={bestAC()}
          fmt={fmt}
          onClose={() => setSelectedAirport(null)}
          getRoutesFromHub={getRoutesFromHub}
          getAvailableDestinations={getAvailableDestinations}
          getRevenuePerCycle={getRevenuePerCycle}
          getCycleTime={getCycleTime}
          getRouteCost={getRouteCost}
          openRoute={openRoute}
          addPlaneToRoute={addPlaneToRoute}
          removePlaneFromRoute={removePlaneFromRoute}
          basePlaneAtHub={basePlaneAtHub}
          removePlaneFromHub={removePlaneFromHub}
          routes={routes}
          owned={owned}
          fleet={fleet}
          hubs={hubs}
          freePlanes={freePlanes}
          planesAvailableAtHub={planesAvailableAtHub}
        />
      )}

      {activeTab === 'fleet' && (
        <FleetPanel
          fleet={fleet}
          money={money}
          buyAircraft={buyAircraft}
          canUnlockAC={canUnlockAC}
          bestAC={bestAC()}
          fmt={fmt}
          onClose={() => handleTabChange('map')}
        />
      )}

      {/* Bottom tabs */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 1000,
        background: 'rgba(8,18,28,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', backdropFilter: 'blur(16px)',
      }}>
        {[
          { id: 'map', icon: '🗺', label: 'Map' },
          { id: 'fleet', icon: '✈', label: 'Fleet' },
          { id: 'stats', icon: '📊', label: 'Empire' },
        ].map(tab => (
          <div
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              flex: 1, padding: '7px 4px 6px',
              textAlign: 'center', cursor: 'pointer',
              color: activeTab === tab.id ? '#38bdf8' : '#5d7d96',
              fontSize: 9, fontWeight: 600, letterSpacing: 0.3,
              borderTop: `2px solid ${activeTab === tab.id ? '#38bdf8' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 1 }}>{tab.icon}</div>
            {tab.label}
          </div>
        ))}
      </div>
    </div>
  )
}