import { useState, useEffect, useRef } from "react"
import { useFarm } from "./hooks/useFarm"
import "../../../styles/App/MapaTab.css"

import L from "leaflet"
import "leaflet/dist/leaflet.css"
import * as turf from "@turf/turf"

// corrigir ícones
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// formatar área
function formatArea(areaHa) {
  if (areaHa < 1) return `${(areaHa * 10000).toFixed(0)} m²`
  return `${areaHa.toFixed(2)} ha`
}

// cálculo com Turf
function calculateArea(latLngs) {
  if (!latLngs || latLngs.length < 3) return 0

  const coordinates = latLngs.map(p => [p.lng, p.lat])
  coordinates.push(coordinates[0])

  const polygon = turf.polygon([coordinates])
  const areaM2 = turf.area(polygon)

  return areaM2 / 10000
}

// status dinâmico
function getAreaStatus() {
  const rand = Math.random()

  if (rand < 0.33) {
    return { label: "Saudável", color: "#4CAF50" }
  } else if (rand < 0.66) {
    return { label: "Atenção", color: "#FFC107" }
  } else {
    return { label: "Crítico", color: "#F44336" }
  }
}

function generateZones(points) {
  // ✅ agora aceita a partir de 3 pontos
  if (!points || points.length < 3) return []

  const half = Math.floor(points.length / 2)

  return [
    {
      coordinates: points.slice(0, half).map(p => [p.lat, p.lng]),
      color: "#2196F3",
      status: "Precisa de água"
    },
    {
      coordinates: points.slice(half).map(p => [p.lat, p.lng]),
      color: "#FF5722",
      status: "Solo fraco"
    }
  ]
}

export default function MapaTab() {
  const { farmData } = useFarm()

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const isDrawingRef = useRef(false)
  const currentPointsRef = useRef([])

  const polygonsRef = useRef({})
  const lineRef = useRef(null)
  const tooltipRef = useRef(null)
  const markersRef = useRef([])

  const [areas, setAreas] = useState([])
  const [selectedAreaId, setSelectedAreaId] = useState(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [currentArea, setCurrentArea] = useState(0)

  const [searchAddress, setSearchAddress] = useState("")
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    isDrawingRef.current = isDrawing
  }, [isDrawing])

  useEffect(() => {
    currentPointsRef.current = currentPoints
  }, [currentPoints])

  // carregar áreas
  useEffect(() => {
    const saved = localStorage.getItem("farmPolygons")
    if (saved) {
      try {
        setAreas(JSON.parse(saved))
      } catch {
        setAreas([])
      }
    }
  }, [])

  const saveAreas = (newAreas) => {
    setAreas(newAreas)
    localStorage.setItem("farmPolygons", JSON.stringify(newAreas))
  }

  // deletar área
  const deleteArea = (id) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir essa área?")
    if (!confirmDelete) return

    const newAreas = areas.filter(area => area.id !== id)

    setAreas(newAreas)
    localStorage.setItem("farmPolygons", JSON.stringify(newAreas))

    if (selectedAreaId === id) {
      setSelectedAreaId(null)
    }

    if (polygonsRef.current[id]) {
      polygonsRef.current[id].remove()
      delete polygonsRef.current[id]
    }
  }

  // cancelar desenho
  const cancelDrawing = () => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (lineRef.current) {
      mapInstanceRef.current.removeLayer(lineRef.current)
      lineRef.current = null
    }

    if (tooltipRef.current) {
      mapInstanceRef.current.removeLayer(tooltipRef.current)
      tooltipRef.current = null
    }

    setIsDrawing(false)
    setCurrentPoints([])
    currentPointsRef.current = []
    setCurrentArea(0)
  }

  // desenhar áreas
  useEffect(() => {
    if (!mapInstanceRef.current) return

    Object.values(polygonsRef.current).forEach(p => p.remove())
    polygonsRef.current = {}

    areas.forEach(area => {
      // 🔥 ZONAS INTERNAS
      if (area.zones && area.zones.length > 0) {
        area.zones.forEach(zone => {
          const zonePolygon = L.polygon(zone.coordinates, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.5,
            weight: 1
          }).addTo(mapInstanceRef.current)

          zonePolygon.on("click", () => {
            const center = zonePolygon.getBounds().getCenter()

            L.popup()
              .setLatLng(center)
              .setContent(`
                <div style="
                  background:${zone.color};
                  padding:8px;
                  border-radius:10px;
                  color:#fff;
                ">
                  ${zone.status}
                </div>
              `)
              .openOn(mapInstanceRef.current)
          })
        })
      }
      
      if (!area.coordinates || area.coordinates.length < 3) return

      const polygon = L.polygon(area.coordinates, {
        color: area.color || "#2E7D32",
        fillColor: area.color || "#2E7D32",
        fillOpacity: 0.25,
        weight: 2,
        smoothFactor: 1
      })

      polygon.on("click", () => {
        setSelectedAreaId(area.id)

        const center = polygon.getBounds().getCenter()

        // ✅ monta HTML das zonas
        let zonesHtml = ""

        if (area.zones && area.zones.length > 0) {
          zonesHtml = area.zones.map(zone => `
            <div style="
              background:${zone.color};
              padding:6px;
              border-radius:8px;
              margin-top:6px;
              font-size:12px;
            ">
              📍 ${zone.status}
            </div>
          `).join("")
        }

        L.popup()
          .setLatLng(center)
          .setContent(`
            <div style="
              background:${area.color || "#2E7D32"};
              padding:10px 12px;
              border-radius:12px;
              color:#fff;
              font-weight:600;
              font-size:14px;
              font-family:'Inter', sans-serif;
              min-width:160px;
            ">
              🌱 Área: ${formatArea(area.areaHa)}<br/>
              📊 Status: ${area.status || "Saudável"}
              ${zonesHtml}
            </div>
          `)
          .openOn(mapInstanceRef.current)
      })

      polygon.addTo(mapInstanceRef.current)
      polygonsRef.current[area.id] = polygon
    })
  }, [areas])

  // destaque
  useEffect(() => {
    Object.entries(polygonsRef.current).forEach(([id, polygon]) => {
      polygon.setStyle({
        color: Number(id) === selectedAreaId ? "#4CAF50" : (areas.find(a => a.id == id)?.color || "#2E7D32"),
        fillOpacity: Number(id) === selectedAreaId ? 0.4 : 0.25,
        weight: Number(id) === selectedAreaId ? 3 : 2
      })
    })
  }, [selectedAreaId, areas])

  const addPoint = (latlng) => {
    if (!isDrawingRef.current || !mapInstanceRef.current) return

    const newPoints = [...currentPointsRef.current, latlng]
    setCurrentPoints(newPoints)

    const marker = L.circleMarker(latlng, {
      radius: 5,
      color: "#2E7D32",
      fillColor: "#4CAF50",
      fillOpacity: 1,
      weight: 2
    }).addTo(mapInstanceRef.current)

    markersRef.current.push(marker)

    if (lineRef.current) {
      mapInstanceRef.current.removeLayer(lineRef.current)
    }

    lineRef.current = L.polyline(newPoints, {
      color: "#2E7D32",
      weight: 3,
      opacity: 0.8
    }).addTo(mapInstanceRef.current)

    if (newPoints.length >= 3) {
      const area = calculateArea(newPoints)
      setCurrentArea(area)

      if (tooltipRef.current) {
        mapInstanceRef.current.removeLayer(tooltipRef.current)
      }

      tooltipRef.current = L.marker(newPoints[0], {
        icon: L.divIcon({
          html: `<div style="background:#2E7D32;padding:6px 12px;border-radius:10px;color:#fff;font-weight:600;font-size:12px;">
            ${formatArea(area)}
          </div>`
        })
      }).addTo(mapInstanceRef.current)
    }
  }

  const startDrawing = () => {
    setIsDrawing(true)
    setCurrentPoints([])
    currentPointsRef.current = []
    setCurrentArea(0)
  }

  const finishDrawing = () => {
    const points = currentPointsRef.current

    if (points.length < 3) {
      alert("Adicione pelo menos 3 pontos!")
      return
    }

    const statusData = getAreaStatus()

    const newArea = {
      id: Date.now(),
      coordinates: points.map(p => [p.lat, p.lng]),
      areaHa: calculateArea(points),
      status: statusData.label,
      color: statusData.color,
      zones: generateZones(points) // 🔥 AQUI
    }

    saveAreas([...areas, newArea])

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (lineRef.current) {
      mapInstanceRef.current.removeLayer(lineRef.current)
      lineRef.current = null
    }

    if (tooltipRef.current) {
      mapInstanceRef.current.removeLayer(tooltipRef.current)
      tooltipRef.current = null
    }

    setIsDrawing(false)
    setCurrentPoints([])
    currentPointsRef.current = []
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchAddress.trim()) return

    setSearching(true)

    try {
      let lat, lng

      if (/^\d{8}$/.test(searchAddress.replace("-", ""))) {
        const cep = searchAddress.replace("-", "")

        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()

        const fullAddress = `${data.logradouro}, ${data.localidade}, ${data.uf}`

        const geo = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`
        )

        const geoData = await geo.json()

        lat = parseFloat(geoData[0].lat)
        lng = parseFloat(geoData[0].lon)
      } else {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1`
        )

        const data = await response.json()
        lat = parseFloat(data[0].lat)
        lng = parseFloat(data[0].lon)
      }

      mapInstanceRef.current.setView([lat, lng], 16)
      L.marker([lat, lng]).addTo(mapInstanceRef.current)

    } catch {
      alert("Erro ao buscar localização")
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current).setView([-15, -47], 4)
    mapInstanceRef.current = map

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    ).addTo(map)

    map.on("click", (e) => {
      if (isDrawingRef.current) addPoint(e.latlng)
    })

    map.on("dblclick", () => {
      if (isDrawingRef.current) finishDrawing()
    })

    setTimeout(() => map.invalidateSize(), 200)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  const totalArea = areas.reduce((sum, a) => sum + (a.areaHa || 0), 0)

  return (
    <div className="mapa-container">
      <div className="mapa-header">
        <h2>🗺️ Mapa da Fazenda</h2>
      </div>

      <form className="mapa-search" onSubmit={handleSearch}>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Digite CEP ou endereço..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
        </div>
        <button type="submit" className="search-btn">
          {searching ? "..." : "Buscar"}
        </button>
      </form>

      <div className="draw-button-container">
        {!isDrawing ? (
          <button className="draw-area-btn" onClick={startDrawing}>
            <span className="btn-icon">✏️</span>
            Desenhar área
          </button>
        ) : (
          <div className="drawing-controls">
            <div className="drawing-info">
              <span className="info-badge">✏️ Modo desenho</span>
              <span className="info-points">📍 Pontos: {currentPoints.length}</span>
              <strong className="info-area">📐 Área: {formatArea(currentArea)}</strong>
            </div>
            <div className="drawing-buttons">
              <button onClick={finishDrawing} className="finish-draw-btn">
                ✅ Finalizar
              </button>
              <button onClick={cancelDrawing} className="cancel-draw-btn">
                ❌ Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mapa-area">
        <div ref={mapContainerRef} className="map-container"></div>
      </div>

      <div className="areas-grid">
        <div className="areas-header">
          <h3>📌 Áreas cadastradas</h3>
          <span className="areas-count">{areas.length} área(s)</span>
        </div>

        {areas.length === 0 ? (
          <div className="empty-areas">
            <div className="empty-icon">🗺️</div>
            <p>Nenhuma área desenhada ainda</p>
            <span>Clique em "Desenhar área" para começar</span>
          </div>
        ) : (
          <div className="areas-cards">
            {areas.map((area) => (
              <div
                key={area.id}
                className={`area-card-modern ${selectedAreaId === area.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedAreaId(area.id)
                  const polygon = polygonsRef.current[area.id]
                  if (polygon && mapInstanceRef.current) {
                    mapInstanceRef.current.fitBounds(polygon.getBounds())
                  }
                }}
              >
                <div className="card-header">
                  <div className="card-icon">🌾</div>
                  <div className="card-title">
                    <h4>Área #{String(area.id).slice(-6)}</h4>
                    <span className="card-date">
                      {new Date(area.id).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-label">Tamanho</span>
                    <span className="stat-value">{formatArea(area.areaHa)}</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat">
                    <span className="stat-label">Status</span>
                    <span className="stat-value">
                      <span className="status-dot"></span>
                      {area.status || "Saudável"}
                    </span>
                  </div>
                </div>

                <div className="card-footer-actions">
                  <button
                    className="view-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      const polygon = polygonsRef.current[area.id]
                      if (polygon && mapInstanceRef.current) {
                        mapInstanceRef.current.fitBounds(polygon.getBounds())
                      }
                    }}
                  >
                    👁️ Ver no mapa
                  </button>
                  <button
                    className="delete-btn-modern"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteArea(area.id)
                    }}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}