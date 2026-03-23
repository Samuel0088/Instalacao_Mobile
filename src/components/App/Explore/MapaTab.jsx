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
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [locationStatus, setLocationStatus] = useState("loading")
  const [searchAddress, setSearchAddress] = useState("")
  const [searching, setSearching] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [currentPolygon, setCurrentPolygon] = useState(null)
  const [tempMarkers, setTempMarkers] = useState([])

  // Carregar áreas salvas
  useEffect(() => {
    const saved = localStorage.getItem("farmPolygons")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Garantir que todos os campos existem
        const safeAreas = parsed.map(area => ({
          id: area.id || Date.now(),
          name: area.name || "Área sem nome",
          crop: area.crop || "Soja",
          coordinates: area.coordinates || [],
          areaHa: typeof area.areaHa === 'number' ? area.areaHa : 0,
          color: area.color || "#00ff88",
          createdAt: area.createdAt || new Date().toISOString()
        }))
        setAreas(safeAreas)
      } catch (e) {
        console.error("Erro ao carregar áreas:", e)
        setAreas([])
      }
    }
  }, [])

  // Salvar áreas
  const saveAreas = useCallback((newAreas) => {
    setAreas(newAreas)
    localStorage.setItem("farmPolygons", JSON.stringify(newAreas))
    
    if (mapInstanceRef.current) {
      // Remover polígonos existentes
      mapInstanceRef.current.eachLayer(layer => {
        if (layer.options && layer.options.isAreaPolygon) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })
      
      // Adicionar polígonos salvos
      newAreas.forEach(area => {
        if (area.coordinates && area.coordinates.length >= 3) {
          const polygon = L.polygon(area.coordinates, {
            color: area.color || "#00ff88",
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3,
            isAreaPolygon: true
          })
          const areaValue = typeof area.areaHa === 'number' ? area.areaHa : 0
          polygon.bindPopup(`
            <strong>${area.name || "Área"}</strong><br>
            Cultura: ${area.crop || "Soja"}<br>
            Área: ${areaValue.toFixed(2)} ha
          `)
          polygon.addTo(mapInstanceRef.current)
        }
      })
    }
  }, [])

  // Finalizar desenho
  const finishDrawing = useCallback(() => {
    if (currentPoints.length >= 3) {
      const areaHa = calculateArea(currentPoints)
      const areaName = prompt("Nome da área:", `Área ${areas.length + 1}`)
      if (areaName) {
        const crop = prompt("Cultura plantada:", "Soja")
        
        const newArea = {
          id: Date.now(),
          name: areaName,
          crop: crop || "Soja",
          coordinates: currentPoints.map(p => [p.lat, p.lng]),
          areaHa: areaHa,
          color: "#" + Math.floor(Math.random()*16777215).toString(16),
          createdAt: new Date().toISOString()
        }
        
        saveAreas([...areas, newArea])
      }
    }
    
    // Limpar desenho
    tempMarkers.forEach(marker => {
      if (marker && mapInstanceRef.current) marker.remove()
    })
    if (currentPolygon && mapInstanceRef.current) currentPolygon.remove()
    
    setIsDrawing(false)
    setCurrentPoints([])
    setCurrentPolygon(null)
    setTempMarkers([])
  }, [currentPoints, areas, saveAreas, tempMarkers, currentPolygon])

  // Cancelar desenho
  const cancelDrawing = useCallback(() => {
    tempMarkers.forEach(marker => {
      if (marker && mapInstanceRef.current) marker.remove()
    })
    if (currentPolygon && mapInstanceRef.current) currentPolygon.remove()
    
    setIsDrawing(false)
    setCurrentPoints([])
    setCurrentPolygon(null)
    setTempMarkers([])
  }, [tempMarkers, currentPolygon])

  // Adicionar ponto no mapa
  const addPoint = useCallback((latlng) => {
    if (!isDrawing) return
    
    const newPoints = [...currentPoints, latlng]
    setCurrentPoints(newPoints)
    
    // Adicionar marcador
    const marker = L.marker(latlng, {
      icon: L.divIcon({
        className: 'temp-marker',
        html: `<div style="background: #00ff88; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [14, 14]
      })
    }).addTo(mapInstanceRef.current)
    setTempMarkers(prev => [...prev, marker])
    
    // Atualizar polígono
    if (currentPolygon) currentPolygon.remove()
    
    if (newPoints.length >= 3) {
      const polygon = L.polygon(newPoints, {
        color: '#00ff88',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.3,
        dashArray: '5, 5'
      }).addTo(mapInstanceRef.current)
      setCurrentPolygon(polygon)
      
      const areaHa = calculateArea(newPoints)
      polygon.bindTooltip(`Área: ${areaHa.toFixed(2)} ha`, { permanent: true, direction: 'center' })
    }
  }, [isDrawing, currentPoints, currentPolygon])

  // Iniciar desenho
  const startDrawing = useCallback(() => {
    setIsDrawing(true)
    setCurrentPoints([])
  }, [])

  // Buscar localização por CEP
  const searchByCep = useCallback(async (cep) => {
    setSearching(true)
    try {
      const cleanCep = cep.replace(/\D/g, '')
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        setLocationStatus("error")
        return null
      }
      
      const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`
      )
      const geoData = await geoResponse.json()
      
      if (geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat)
        const lng = parseFloat(geoData[0].lng)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16)
        }
        setLocationStatus("success")
        setSearchAddress(fullAddress)
        return { lat, lng }
      } else {
        setLocationStatus("not-found")
        return null
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      setLocationStatus("error")
      return null
    } finally {
      setSearching(false)
    }
  }, [])

  // Buscar por endereço
  const searchLocation = useCallback(async (address) => {
    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      )
      const data = await response.json()
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lng)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16)
        }
        setLocationStatus("success")
        return { lat, lng }
      } else {
        setLocationStatus("not-found")
        return null
      }
    } catch (error) {
      console.error("Erro ao buscar localização:", error)
      setLocationStatus("error")
      return null
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    if (!searchAddress.trim()) return
    
    const isCep = /^\d{5}-?\d{3}$/.test(searchAddress.trim()) || /^\d{8}$/.test(searchAddress.trim())
    
    if (isCep) {
      await searchByCep(searchAddress)
    } else {
      await searchLocation(searchAddress)
    }
  }, [searchAddress, searchByCep, searchLocation])

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const mapInstance = L.map(mapContainerRef.current).setView([-15.7934, -47.8823], 4)
    mapInstanceRef.current = mapInstance
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(mapInstance)

    mapInstance.on('click', (e) => addPoint(e.latlng))

    // Carregar áreas salvas com segurança
    const savedAreas = localStorage.getItem("farmPolygons")
    if (savedAreas) {
      try {
        const parsedAreas = JSON.parse(savedAreas)
        parsedAreas.forEach(area => {
          if (area.coordinates && area.coordinates.length >= 3) {
            const polygon = L.polygon(area.coordinates, {
              color: area.color || "#00ff88",
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.3,
              isAreaPolygon: true
            })
            const areaValue = typeof area.areaHa === 'number' ? area.areaHa : 0
            polygon.bindPopup(`
              <strong>${area.name || "Área"}</strong><br>
              Cultura: ${area.crop || "Soja"}<br>
              Área: ${areaValue.toFixed(2)} ha
            `)
            polygon.addTo(mapInstance)
          }
        })
      } catch (e) {
        console.error("Erro ao carregar áreas:", e)
      }
    }

    const locateFarm = async () => {
      if (farmData?.cep) {
        setLocationStatus("loading")
        await searchByCep(farmData.cep)
      } else if (farmData?.municipio && farmData?.uf) {
        setLocationStatus("loading")
        await searchLocation(`${farmData.municipio}, ${farmData.uf}`)
      } else {
        setLocationStatus("no-location")
      }
    }

    if (!farmLoading && farmData) {
      locateFarm()
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click')
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [farmData, farmLoading, addPoint, searchByCep, searchLocation])

  const deleteArea = (id) => {
    if (window.confirm("Remover esta área?")) {
      saveAreas(areas.filter(area => area.id !== id))
    }
  }

  // Calcular área total com segurança
  const totalArea = areas.reduce((sum, area) => {
    const areaValue = typeof area.areaHa === 'number' ? area.areaHa : 0
    return sum + areaValue
  }, 0)

  return (
    <div className="mapa-container">
      <div className="mapa-header">
        <h2>Mapa da Fazenda</h2>
        <p>Desenhe as áreas da sua plantação diretamente no mapa</p>
      </div>

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

      {!isDrawing ? (
        <button className="draw-area-btn" onClick={startDrawing}>
          <span className="material-symbols-outlined">draw</span>
          Desenhar nova área
        </button>
      ) : (
        <div className="drawing-controls">
          <div className="drawing-info">
            <span>✏️ Desenhando: clique no mapa para adicionar pontos</span>
            <div className="drawing-buttons">
              <button className="finish-btn" onClick={finishDrawing}>✅ Finalizar</button>
              <button className="cancel-btn" onClick={cancelDrawing}>❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {locationStatus === "loading" && (
        <div className="location-status loading">
          <span className="material-symbols-outlined">location_searching</span>
          <p>Buscando localização da fazenda...</p>
        </div>
      )}
      
      {locationStatus === "error" && (
        <div className="location-status error">
          <span className="material-symbols-outlined">error</span>
          <p>Use a busca acima para encontrar sua fazenda.</p>
        </div>
      )}
      
      {locationStatus === "no-location" && (
        <div className="location-status info">
          <span className="material-symbols-outlined">info</span>
          <p>Use a busca acima para encontrar sua fazenda.</p>
        </div>
      )}

      <div className="mapa-area">
        <div ref={mapContainerRef} className="map-container"></div>
      </div>

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
            <p>Área total plantada</p>
          </div>
        </div>
      </div>

      {areas.length > 0 && (
        <div className="mapa-areas-list">
          <h3>Minhas Áreas de Plantio</h3>
          <div className="areas-grid">
            {areas.map((area, index) => {
              const areaValue = typeof area.areaHa === 'number' ? area.areaHa : 0
              return (
                <motion.div
                  key={area.id}
                  className="area-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (mapInstanceRef.current && area.coordinates && area.coordinates.length >= 3) {
                      const bounds = L.latLngBounds(area.coordinates.map(p => [p[0], p[1]]))
                      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
                    }
                    setSelectedArea(area)
                  }}
                >
                  <div className="area-color" style={{ background: area.color || "#00ff88" }}></div>
                  <div className="area-info">
                    <h4>{area.name || "Área sem nome"}</h4>
                    <div className="area-details">
                      <span className="crop-badge">
                        <span className="material-symbols-outlined">eco</span>
                        {area.crop || "Soja"}
                      </span>
                      <span className="area-size">{areaValue.toFixed(2)} ha</span>
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
              )
            })}
          </div>
        </div>
      )}

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
                <div className="detail-color" style={{ background: selectedArea.color || "#00ff88" }}></div>
                <div>
                  <h3>{selectedArea.name || "Área sem nome"}</h3>
                  <p>Cultura: {selectedArea.crop || "Soja"}</p>
                </div>
              </div>
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="material-symbols-outlined">square_foot</span>
                  <div>
                    <strong>{(typeof selectedArea.areaHa === 'number' ? selectedArea.areaHa : 0).toFixed(2)} ha</strong>
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
                  if (mapInstanceRef.current && selectedArea.coordinates && selectedArea.coordinates.length >= 3) {
                    const bounds = L.latLngBounds(selectedArea.coordinates.map(p => [p[0], p[1]]))
                    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
                    setSelectedArea(null)
                  }
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