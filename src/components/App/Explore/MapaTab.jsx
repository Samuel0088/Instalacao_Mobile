import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useFarm } from "./hooks/useFarm"
import "../../../styles/App/MapaTab.css"

import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

function calculateArea(latLngs) {
  if (!latLngs || latLngs.length < 3) return 0
  const points = latLngs.map(p => [p.lat, p.lng])
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i][0] * points[j][1]
    area -= points[j][0] * points[i][1]
  }
  area = Math.abs(area) / 2
  const metersPerDegree = 111319.9
  const areaM2 = area * metersPerDegree * metersPerDegree
  return areaM2 / 10000
}

export default function MapaTab() {
  const { farmData, loading: farmLoading } = useFarm()

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const isDrawingRef = useRef(false)

  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [locationStatus, setLocationStatus] = useState("loading")
  const [searchAddress, setSearchAddress] = useState("")
  const [searching, setSearching] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [currentPolygon, setCurrentPolygon] = useState(null)
  const [tempMarkers, setTempMarkers] = useState([])
  const [currentArea, setCurrentArea] = useState(0)

  // manter ref sincronizada
  useEffect(() => {
    isDrawingRef.current = isDrawing
  }, [isDrawing])

  // carregar áreas com segurança
  useEffect(() => {
    const saved = localStorage.getItem("farmPolygons")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const safeAreas = parsed.map(area => ({
          ...area,
          areaHa: area.areaHa ?? 0
        }))
        setAreas(safeAreas)
      } catch {
        setAreas([])
      }
    }
  }, [])

  const saveAreas = useCallback((newAreas) => {
    const safeAreas = newAreas.map(area => ({
      ...area,
      areaHa: area.areaHa ?? 0
    }))
    setAreas(safeAreas)
    localStorage.setItem("farmPolygons", JSON.stringify(safeAreas))
    
    // Atualizar polígonos no mapa
    if (mapInstanceRef.current) {
      // Remover polígonos existentes
      mapInstanceRef.current.eachLayer(layer => {
        if (layer.options && layer.options.isAreaPolygon) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })
      
      // Adicionar polígonos salvos
      safeAreas.forEach(area => {
        if (area.coordinates && area.coordinates.length >= 3) {
          const polygon = L.polygon(area.coordinates, {
            color: area.color || "#00ffaa",
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3,
            isAreaPolygon: true
          })
          polygon.bindPopup(`
            <strong>${area.name || "Área"}</strong><br>
            Cultura: ${area.crop || "Soja"}<br>
            Área: ${(area.areaHa ?? 0).toFixed(2)} ha
          `)
          polygon.addTo(mapInstanceRef.current)
        }
      })
    }
  }, [])

  const addPoint = useCallback((latlng) => {
    if (!isDrawingRef.current || !mapInstanceRef.current) return

    const newPoints = [...currentPoints, latlng]
    setCurrentPoints(newPoints)
    
    // Adicionar marcador temporário
    const marker = L.marker(latlng, {
      icon: L.divIcon({
        className: 'temp-marker',
        html: `<div style="background: #00ffaa; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [14, 14]
      })
    }).addTo(mapInstanceRef.current)
    setTempMarkers(prev => [...prev, marker])
    
    // Remover polígono anterior
    if (currentPolygon) {
      mapInstanceRef.current.removeLayer(currentPolygon)
    }
    
    // Criar novo polígono se tiver pelo menos 3 pontos
    if (newPoints.length >= 3) {
      const area = calculateArea(newPoints)
      setCurrentArea(area)
      
      const polygon = L.polygon(newPoints, {
        color: '#00ffaa',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.3,
        dashArray: '5, 5'
      }).addTo(mapInstanceRef.current)
      
      polygon.bindTooltip(`Área: ${area.toFixed(2)} ha`, { permanent: true, direction: 'center' })
      setCurrentPolygon(polygon)
    } else {
      setCurrentArea(0)
    }
  }, [currentPoints, currentPolygon])

  const startDrawing = () => {
    setIsDrawing(true)
    setCurrentPoints([])
    setCurrentArea(0)
    setCurrentPolygon(null)
    setTempMarkers([])
  }

  const finishDrawing = () => {
    if (currentPoints.length >= 3) {
      const areaHa = calculateArea(currentPoints)
      
      // Perguntar nome da área
      const areaName = prompt("Nome da área:", `Área ${areas.length + 1}`)
      if (areaName) {
        const crop = prompt("Cultura plantada:", "Soja")
        
        const newArea = {
          id: Date.now(),
          name: areaName,
          crop: crop || "Soja",
          coordinates: currentPoints.map(p => [p.lat, p.lng]),
          areaHa: areaHa ?? 0,
          color: "#" + Math.floor(Math.random()*16777215).toString(16),
          createdAt: new Date().toISOString()
        }
        
        saveAreas([...areas, newArea])
      }
    }
    
    // Limpar desenho
    tempMarkers.forEach(m => m.remove())
    if (currentPolygon) mapInstanceRef.current?.removeLayer(currentPolygon)
    
    setIsDrawing(false)
    setCurrentPoints([])
    setCurrentPolygon(null)
    setTempMarkers([])
    setCurrentArea(0)
  }

  const cancelDrawing = () => {
    tempMarkers.forEach(m => m.remove())
    if (currentPolygon) mapInstanceRef.current?.removeLayer(currentPolygon)
    
    setIsDrawing(false)
    setCurrentPoints([])
    setCurrentPolygon(null)
    setTempMarkers([])
    setCurrentArea(0)
  }

  // Centralizar na área
  const centerOnArea = useCallback((area) => {
    if (mapInstanceRef.current && area.coordinates && area.coordinates.length >= 3) {
      const bounds = L.latLngBounds(area.coordinates.map(p => [p[0], p[1]]))
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [])

  // MAPA (roda só uma vez)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current).setView([-15.7934, -47.8823], 4)
    mapInstanceRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map)

    map.on("click", (e) => {
      if (isDrawingRef.current) {
        addPoint(e.latlng)
      }
    })

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [addPoint])

  // localização da fazenda
  useEffect(() => {
    const locate = async () => {
      if (!mapInstanceRef.current) return

      if (farmData?.municipio) {
        setLocationStatus("loading")
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(farmData.municipio + ", " + (farmData.uf || ""))}&format=json&limit=1`
          )
          const data = await response.json()

          if (data.length > 0) {
            const lat = parseFloat(data[0].lat)
            const lng = parseFloat(data[0].lon)
            mapInstanceRef.current.setView([lat, lng], 13)
            setLocationStatus("success")
          } else {
            setLocationStatus("error")
          }
        } catch {
          setLocationStatus("error")
        }
      } else {
        setLocationStatus("no-location")
      }
    }

    if (!farmLoading && farmData) {
      locate()
    }
  }, [farmData, farmLoading])

  // Buscar por endereço
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchAddress.trim()) return
    
    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`
      )
      const data = await response.json()
      
      if (data.length > 0 && mapInstanceRef.current) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        mapInstanceRef.current.setView([lat, lng], 16)
        setLocationStatus("success")
      } else {
        setLocationStatus("not-found")
      }
    } catch {
      setLocationStatus("error")
    } finally {
      setSearching(false)
    }
  }

  const deleteArea = (id) => {
    if (window.confirm("Remover esta área?")) {
      saveAreas(areas.filter(area => area.id !== id))
    }
  }

  const totalArea = areas.reduce((sum, a) => sum + (a.areaHa ?? 0), 0)

  return (
    <div className="mapa-container">
      <div className="mapa-header">
        <h2>Mapa da Fazenda</h2>
        <p>Clique no mapa para adicionar pontos e desenhar sua área</p>
      </div>

      {/* Barra de busca */}
      <form className="mapa-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Buscar endereço, cidade ou CEP..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />
        <button type="submit" disabled={searching}>
          <span className="material-symbols-outlined">search</span>
          Buscar
        </button>
      </form>

      {/* Botões de controle */}
      {!isDrawing ? (
        <button className="draw-area-btn" onClick={startDrawing}>
          <span className="material-symbols-outlined">draw</span>
          Desenhar nova área
        </button>
      ) : (
        <div className="drawing-controls">
          <div className="drawing-info">
            <span>✏️ Desenhando: clique no mapa para adicionar pontos</span>
            {currentPoints.length >= 3 && (
              <span className="current-area">Área atual: {currentArea.toFixed(2)} ha</span>
            )}
            <div className="drawing-buttons">
              <button className="finish-btn" onClick={finishDrawing}>
                ✅ Finalizar
              </button>
              <button className="cancel-btn" onClick={cancelDrawing}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {locationStatus === "loading" && (
        <div className="location-status loading">Buscando localização...</div>
      )}
      {locationStatus === "error" && (
        <div className="location-status error">Localização não encontrada</div>
      )}
      {locationStatus === "no-location" && (
        <div className="location-status info">Digite um endereço para localizar</div>
      )}

      {/* Mapa */}
      <div className="mapa-area">
        <div ref={mapContainerRef} className="map-container"></div>
      </div>

      {/* Resumo */}
      <div className="mapa-summary">
        <div className="summary-card">
          <span className="material-symbols-outlined">agriculture</span>
          <div>
            <strong>{areas.length}</strong>
            <p>Áreas demarcadas</p>
          </div>
        </div>
        <div className="summary-card">
          <span className="material-symbols-outlined">square_foot</span>
          <div>
            <strong>{totalArea.toFixed(2)} ha</strong>
            <p>Área total</p>
          </div>
        </div>
      </div>

      {/* Lista de áreas */}
      {areas.length > 0 && (
        <div className="mapa-areas-list">
          <h3>Minhas Áreas de Plantio</h3>
          <div className="areas-grid">
            {areas.map((area, index) => (
              <motion.div
                key={area.id}
                className="area-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  centerOnArea(area)
                  setSelectedArea(area)
                }}
              >
                <div className="area-color" style={{ background: area.color || "#00ffaa" }}></div>
                <div className="area-info">
                  <h4>{area.name || "Área sem nome"}</h4>
                  <div className="area-details">
                    <span className="crop-badge">
                      <span className="material-symbols-outlined">eco</span>
                      {area.crop || "Soja"}
                    </span>
                    <span className="area-size">{(area.areaHa ?? 0).toFixed(2)} ha</span>
                  </div>
                </div>
                <button
                  className="delete-area"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteArea(area.id)
                  }}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal detalhes */}
      <AnimatePresence>
        {selectedArea && (
          <motion.div
            className="mapa-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedArea(null)}
          >
            <motion.div
              className="area-detail-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-btn" onClick={() => setSelectedArea(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="detail-header">
                <div className="detail-color" style={{ background: selectedArea.color || "#00ffaa" }}></div>
                <div>
                  <h3>{selectedArea.name || "Área sem nome"}</h3>
                  <p>Cultura: {selectedArea.crop || "Soja"}</p>
                </div>
              </div>
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="material-symbols-outlined">square_foot</span>
                  <div>
                    <strong>{(selectedArea.areaHa ?? 0).toFixed(2)} ha</strong>
                    <p>Área total</p>
                  </div>
                </div>
                <div className="detail-stat">
                  <span className="material-symbols-outlined">calendar_today</span>
                  <div>
                    <strong>{selectedArea.createdAt ? new Date(selectedArea.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</strong>
                    <p>Data de cadastro</p>
                  </div>
                </div>
              </div>
              <div className="detail-actions">
                <button className="action-btn" onClick={() => {
                  centerOnArea(selectedArea)
                  setSelectedArea(null)
                }}>
                  <span className="material-symbols-outlined">center_focus_strong</span>
                  Centralizar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}