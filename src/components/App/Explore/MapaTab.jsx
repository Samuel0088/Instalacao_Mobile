import { useState, useEffect, useRef } from "react"
import { useFarm } from "./hooks/useFarm"
import "../../../styles/App/MapaTab.css"

import L from "leaflet"
import "leaflet/dist/leaflet.css"

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

// calcular área
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
  const { farmData } = useFarm()

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const isDrawingRef = useRef(false)
  const currentPointsRef = useRef([])

  const polygonsRef = useRef({})
  const lineRef = useRef(null)
  const tooltipRef = useRef(null)

  const [areas, setAreas] = useState([])
  const [selectedAreaId, setSelectedAreaId] = useState(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [currentArea, setCurrentArea] = useState(0)

  // 🔍 busca
  const [searchAddress, setSearchAddress] = useState("")
  const [searching, setSearching] = useState(false)

  // sync refs
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

  // desenhar áreas salvas
  useEffect(() => {
    if (!mapInstanceRef.current) return

    Object.values(polygonsRef.current).forEach(p => p.remove())
    polygonsRef.current = {}

    areas.forEach(area => {
      if (!area.coordinates || area.coordinates.length < 3) return

      const polygon = L.polygon(area.coordinates, {
        color: "#00ffaa",
        fillOpacity: 0.3
      })

      polygon.on("click", () => setSelectedAreaId(area.id))

      polygon.addTo(mapInstanceRef.current)
      polygonsRef.current[area.id] = polygon
    })
  }, [areas])

  // destacar selecionado
  useEffect(() => {
    Object.entries(polygonsRef.current).forEach(([id, polygon]) => {
      polygon.setStyle({
        color: Number(id) === selectedAreaId ? "#ffff00" : "#00ffaa",
        fillOpacity: Number(id) === selectedAreaId ? 0.6 : 0.3,
        weight: Number(id) === selectedAreaId ? 4 : 2
      })
    })
  }, [selectedAreaId])

  // adicionar ponto
  const addPoint = (latlng) => {
    if (!isDrawingRef.current || !mapInstanceRef.current) return

    const newPoints = [...currentPointsRef.current, latlng]
    setCurrentPoints(newPoints)

    L.circleMarker(latlng, {
      radius: 5,
      color: "#00ffaa",
      fillColor: "#00ffaa",
      fillOpacity: 1
    }).addTo(mapInstanceRef.current)

    if (lineRef.current) {
      mapInstanceRef.current.removeLayer(lineRef.current)
    }

    lineRef.current = L.polyline(newPoints, {
      color: "#00ffaa"
    }).addTo(mapInstanceRef.current)

    if (newPoints.length >= 3) {
      const area = calculateArea(newPoints)
      setCurrentArea(area)

      if (tooltipRef.current) {
        mapInstanceRef.current.removeLayer(tooltipRef.current)
      }

      tooltipRef.current = L.marker(newPoints[0], {
        icon: L.divIcon({
          html: `<div style="background:#00ffaa;padding:4px 8px;border-radius:6px;color:#000;font-weight:bold;">
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

    const newArea = {
      id: Date.now(),
      coordinates: points.map(p => [p.lat, p.lng]),
      areaHa: calculateArea(points)
    }

    saveAreas([...areas, newArea])

    setIsDrawing(false)
    setCurrentPoints([])
    currentPointsRef.current = []
  }

  // 🔍 buscar endereço / CEP
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

        L.marker([lat, lng]).addTo(mapInstanceRef.current)
      } else {
        alert("Endereço não encontrado")
      }
    } catch {
      alert("Erro ao buscar endereço")
    } finally {
      setSearching(false)
    }
  }

  // MAPA (corrigido)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const timeout = setTimeout(() => {
      if (!mapContainerRef.current) return

      const map = L.map(mapContainerRef.current).setView([-15, -47], 4)
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map)

      map.on("click", (e) => {
        if (isDrawingRef.current) addPoint(e.latlng)
      })

      setTimeout(() => map.invalidateSize(), 200)
    }, 300)

    return () => {
      clearTimeout(timeout)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const totalArea = areas.reduce((sum, a) => sum + (a.areaHa || 0), 0)

  return (
    <div className="mapa-container">
      <h2>Mapa da Fazenda</h2>

      {/* 🔍 BUSCA */}
      <form className="mapa-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Digite CEP ou endereço..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />
        <button type="submit">
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {!isDrawing ? (
        <button className="draw-area-btn" onClick={startDrawing}>
          Desenhar área
        </button>
      ) : (
        <div className="drawing-controls">
          <p>Pontos: {currentPoints.length}</p>
          <strong>Área: {formatArea(currentArea)}</strong>
          <button onClick={finishDrawing}>Finalizar</button>
        </div>
      )}

      <div className="mapa-area">
        <div ref={mapContainerRef} className="map-container"></div>
      </div>

      <h3>Total: {formatArea(totalArea)}</h3>
    </div>
  )
}