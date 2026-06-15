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
    return { label: "Saudável", color: "#56a870" }
  } else if (rand < 0.66) {
    return { label: "Atenção", color: "#FFC107" }
  } else {
    return { label: "Crítico", color: "#F44336" }
  }
}

function generateZones(points) {
  if (!points || points.length < 3) return []

  const center = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat / points.length,
      lng: acc.lng + point.lng / points.length,
    }),
    { lat: 0, lng: 0 }
  )
  const split = Math.max(1, Math.ceil(points.length / 2))
  const firstEdge = points.slice(0, split + 1)
  const secondEdge = [...points.slice(split), points[0]]

  return [
    {
      coordinates: [center, ...firstEdge].map(p => [p.lat, p.lng]),
      color: "#2196F3",
      status: "Precisa de água"
    },
    {
      coordinates: [center, ...secondEdge].map(p => [p.lat, p.lng]),
      color: "#FF5722",
      status: "Solo fraco"
    }
  ]
}

function getAreaStatusTone(status = "") {
  const normalized = status.toLowerCase()
  if (normalized.includes("crítico")) return "critical"
  if (normalized.includes("atenção")) return "warning"
  return "healthy"
}

function getAreaMetrics(area) {
  const seed = Number(String(area?.id || 0).slice(-3)) || 127
  const tone = getAreaStatusTone(area?.status)

  return {
    moisture: tone === "critical" ? 42 : tone === "warning" ? 58 : 74,
    fertility: Math.min(96, 66 + (seed % 28)),
    yield: Math.min(94, 70 + (seed % 22)),
    pest: tone === "critical" ? 86 : tone === "warning" ? 62 : 24,
  }
}

function createFieldProjection(coordinates = []) {
  if (!coordinates || coordinates.length < 3) return null

  const lats = coordinates.map(([lat]) => lat)
  const lngs = coordinates.map(([, lng]) => lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latRange = maxLat - minLat || 0.0001
  const lngRange = maxLng - minLng || 0.0001
  const width = 620
  const height = 380
  const padding = 52

  const projectCoordinate = ([lat, lng]) => {
    const x = padding + ((lng - minLng) / lngRange) * (width - padding * 2)
    const y = padding + ((maxLat - lat) / latRange) * (height - padding * 2)
    return { x, y }
  }

  const points = coordinates.map(projectCoordinate)

  const pointsString = points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")
  const center = points.reduce(
    (acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }),
    { x: 0, y: 0 }
  )

  return { points, pointsString, center, width, height, projectCoordinate }
}

function getStatusColors(area) {
  const tone = getAreaStatusTone(area?.status)

  if (tone === "critical") {
    return { start: "#8f2d25", middle: "#cf5b46", end: "#5f1f1a" }
  }

  if (tone === "warning") {
    return { start: "#9d7a20", middle: "#d9b64c", end: "#5f5120" }
  }

  return { start: area?.color || "#2f8f45", middle: "#78b56a", end: "#215c32" }
}

function getProjectedZones(area, projection) {
  if (!area?.zones?.length || !projection) return []

  return area.zones
    .filter(zone => zone.coordinates?.length >= 3)
    .map((zone, index) => {
      const projected = zone.coordinates.map(projection.projectCoordinate)
      const points = projected.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")
      const center = projected.reduce(
        (acc, point) => ({ x: acc.x + point.x / projected.length, y: acc.y + point.y / projected.length }),
        { x: 0, y: 0 }
      )

      return {
        ...zone,
        id: `${area.id}-zone-${index}`,
        points,
        center,
        opacity: zone.color === "#2196F3" ? 0.46 : 0.42
      }
    })
}

function getFieldMarkers(area, projection) {
  if (!area || !projection) return []

  const tone = getAreaStatusTone(area.status)
  const seed = Number(String(area.id).slice(-4)) || 731
  const issueCount = tone === "critical" ? 18 : tone === "warning" ? 10 : 5
  const markers = []

  for (let index = 0; index < issueCount; index += 1) {
    const angle = (seed + index * 49) * 0.017
    const radiusX = 46 + ((seed + index * 23) % 120)
    const radiusY = 24 + ((seed + index * 17) % 70)
    markers.push({
      x: projection.center.x + Math.cos(angle) * radiusX,
      y: projection.center.y + Math.sin(angle) * radiusY,
      tone: index % 4 === 0 || tone === "critical" ? "critical" : "warning"
    })
  }

  return markers
}

function FieldSparkline({ type = "good" }) {
  const path = type === "danger"
    ? "M4 42 C42 42 44 8 72 8 S96 9 126 9"
    : "M4 34 C30 32 42 20 62 18 S78 30 92 22 112 20 126 20"

  return (
    <svg viewBox="0 0 130 52" className="metric-sparkline" aria-hidden="true">
      <path d="M4 44 H126" />
      <path d={path} />
    </svg>
  )
}

function MetricCard({ icon, label, value, tone = "good" }) {
  return (
    <div className={`farm3d-metric ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <FieldSparkline type={tone === "danger" ? "danger" : "good"} />
    </div>
  )
}

function Field3DView({ area }) {
  const dragRef = useRef(null)
  const pointersRef = useRef(new Map())
  const pinchRef = useRef(null)
  const touchGestureRef = useRef(null)
  const sceneViewRef = useRef(null)
  const [sceneView, setSceneView] = useState({
    rotateX: 58,
    rotateZ: -14,
    scale: 1,
    panX: 0,
    panY: 0,
  })

  useEffect(() => {
    pointersRef.current.clear()
    pinchRef.current = null
    touchGestureRef.current = null
    dragRef.current = null
    setSceneView({
      rotateX: 58,
      rotateZ: -14,
      scale: 1,
      panX: 0,
      panY: 0,
    })
  }, [area?.id])

  useEffect(() => {
    sceneViewRef.current = sceneView
  }, [sceneView])

  if (!area) {
    return (
      <section className="farm3d-panel empty">
        <div>
          <span className="farm3d-eyebrow">Modelo 3D</span>
          <h3>Selecione uma área para gerar a plantação em 3D</h3>
          <p>Depois de desenhar a lavoura, toque em um card de área para abrir a maquete visual com os pontos de atenção.</p>
        </div>
      </section>
    )
  }

  const projection = createFieldProjection(area.coordinates)
  const metrics = getAreaMetrics(area)
  const markers = getFieldMarkers(area, projection)
  const tone = getAreaStatusTone(area.status)
  const fieldColors = getStatusColors(area)
  const projectedZones = getProjectedZones(area, projection)
  const alertText = tone === "critical"
    ? "Ir primeiro aos pontos vermelhos: risco alto de pragas e queda de produtividade."
    : tone === "warning"
      ? "Verificar as faixas amarelas: solo e irrigação precisam de acompanhamento."
      : "Área estável: manter rotina de monitoramento e irrigação programada."

  if (!projection) return null

  const updateScale = (direction) => {
    setSceneView(view => ({
      ...view,
      scale: Math.min(1.55, Math.max(0.76, view.scale + direction * 0.12))
    }))
  }

  const getPointerDistance = () => {
    const pointers = Array.from(pointersRef.current.values())
    if (pointers.length < 2) return 0

    const [first, second] = pointers
    return Math.hypot(second.x - first.x, second.y - first.y)
  }

  const resetScene = () => {
    pointersRef.current.clear()
    pinchRef.current = null
    touchGestureRef.current = null
    dragRef.current = null
    setSceneView({
      rotateX: 58,
      rotateZ: -14,
      scale: 1,
      panX: 0,
      panY: 0,
    })
  }

  const handleScenePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (pointersRef.current.size >= 2) {
      pinchRef.current = {
        distance: getPointerDistance(),
        scale: sceneViewRef.current?.scale || sceneView.scale,
      }
      dragRef.current = null
      return
    }

    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      view: sceneViewRef.current || sceneView,
    }
  }

  const handleScenePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const nextDistance = getPointerDistance()
      if (!nextDistance || !pinchRef.current.distance) return

      const nextScale = pinchRef.current.scale * (nextDistance / pinchRef.current.distance)
      setSceneView(view => ({
        ...view,
        scale: Math.min(1.55, Math.max(0.76, nextScale))
      }))
      return
    }

    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return

    const deltaX = event.clientX - drag.x
    const deltaY = event.clientY - drag.y

    setSceneView({
      ...drag.view,
      rotateX: Math.min(68, Math.max(44, drag.view.rotateX - deltaY * 0.12)),
      rotateZ: Math.min(10, Math.max(-34, drag.view.rotateZ + deltaX * 0.12)),
      panX: Math.min(42, Math.max(-42, drag.view.panX + deltaX * 0.08)),
      panY: Math.min(26, Math.max(-26, drag.view.panY + deltaY * 0.06)),
    })
  }

  const handleScenePointerEnd = (event) => {
    pointersRef.current.delete(event.pointerId)
    pinchRef.current = null

    const remainingPointer = Array.from(pointersRef.current.entries())[0]
    if (remainingPointer) {
      const [id, pointer] = remainingPointer
      dragRef.current = {
        id,
        x: pointer.x,
        y: pointer.y,
        view: sceneViewRef.current || sceneView,
      }
      return
    }

    dragRef.current = null
  }

  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0

    return Math.hypot(
      touches[1].clientX - touches[0].clientX,
      touches[1].clientY - touches[0].clientY
    )
  }

  const getTouchCenter = (touches) => {
    if (touches.length < 2) {
      return {
        x: touches[0]?.clientX || 0,
        y: touches[0]?.clientY || 0,
      }
    }

    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }

  const handleSceneTouchStart = (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      touchGestureRef.current = {
        type: "drag",
        x: touch.clientX,
        y: touch.clientY,
        view: sceneViewRef.current || sceneView,
      }
      return
    }

    if (event.touches.length >= 2) {
      event.preventDefault()
      const center = getTouchCenter(event.touches)
      touchGestureRef.current = {
        type: "pinch",
        distance: getTouchDistance(event.touches),
        centerX: center.x,
        centerY: center.y,
        view: sceneViewRef.current || sceneView,
      }
    }
  }

  const handleSceneTouchMove = (event) => {
    const gesture = touchGestureRef.current
    if (!gesture) return

    if (event.touches.length >= 2) {
      event.preventDefault()
      const nextDistance = getTouchDistance(event.touches)
      const center = getTouchCenter(event.touches)
      if (!nextDistance || !gesture.distance) return

      const nextScale = gesture.view.scale * (nextDistance / gesture.distance)
      setSceneView({
        ...gesture.view,
        scale: Math.min(1.65, Math.max(0.72, nextScale)),
        panX: Math.min(52, Math.max(-52, gesture.view.panX + (center.x - gesture.centerX) * 0.05)),
        panY: Math.min(34, Math.max(-34, gesture.view.panY + (center.y - gesture.centerY) * 0.05)),
      })
      return
    }

    if (event.touches.length === 1 && gesture.type === "drag") {
      const touch = event.touches[0]
      const deltaX = touch.clientX - gesture.x
      const deltaY = touch.clientY - gesture.y

      setSceneView({
        ...gesture.view,
        rotateX: Math.min(68, Math.max(44, gesture.view.rotateX - deltaY * 0.12)),
        rotateZ: Math.min(10, Math.max(-34, gesture.view.rotateZ + deltaX * 0.12)),
        panX: Math.min(42, Math.max(-42, gesture.view.panX + deltaX * 0.08)),
        panY: Math.min(26, Math.max(-26, gesture.view.panY + deltaY * 0.06)),
      })
    }
  }

  const handleSceneTouchEnd = (event) => {
    if (event.touches.length === 0) {
      touchGestureRef.current = null
      return
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0]
      touchGestureRef.current = {
        type: "drag",
        x: touch.clientX,
        y: touch.clientY,
        view: sceneViewRef.current || sceneView,
      }
    }
  }

  const sceneTransform = `translate(${sceneView.panX}px, ${sceneView.panY}px) rotateX(${sceneView.rotateX}deg) rotateZ(${sceneView.rotateZ}deg) scale(${sceneView.scale})`

  return (
    <section className="farm3d-panel">
      <div className="farm3d-heading">
        <div>
          <span className="farm3d-eyebrow">Modelo 3D da plantação</span>
          <h3>Área #{String(area.id).slice(-6)}</h3>
          <p>{formatArea(area.areaHa)} mapeados para inspeção rápida do produtor</p>
        </div>
        <div className={`farm3d-status ${tone}`}>
          <span></span>
          {area.status || "Saudável"}
        </div>
      </div>

      <div className="farm3d-dashboard">
        <aside className="farm3d-side left">
          <div className="weather-card">
            <strong>28°C, céu limpo</strong>
            <span>Sem chuva nas próximas horas</span>
          </div>
          <div className="distribution-card">
            <h4>Distribuição da área</h4>
            <div className="crop-ring">
              <span></span>
            </div>
            <div className="crop-legend">
              <p><i></i> Soja <strong>68%</strong></p>
              <p><i></i> Milho <strong>18%</strong></p>
              <p><i></i> Atenção <strong>14%</strong></p>
            </div>
          </div>
        </aside>

        <div
          className="farm3d-scene"
          aria-label="Plantação em 3D da área selecionada"
          onPointerDown={handleScenePointerDown}
          onPointerMove={handleScenePointerMove}
          onPointerUp={handleScenePointerEnd}
          onPointerCancel={handleScenePointerEnd}
          onTouchStart={handleSceneTouchStart}
          onTouchMove={handleSceneTouchMove}
          onTouchEnd={handleSceneTouchEnd}
          onTouchCancel={handleSceneTouchEnd}
        >
          <div className="farm3d-ground"></div>
          <div className="farm3d-stage" style={{ transform: sceneTransform }}>
            <svg
              className="farm3d-field"
              viewBox={`0 0 ${projection.width} ${projection.height}`}
              role="img"
              aria-label="Maquete 3D da área selecionada"
            >
              <defs>
                <clipPath id={`field-clip-${area.id}`}>
                  <polygon points={projection.pointsString} />
                </clipPath>
                <linearGradient id={`field-gradient-${area.id}`} x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor={fieldColors.start} />
                  <stop offset="54%" stopColor={fieldColors.middle} />
                  <stop offset="100%" stopColor={fieldColors.end} />
                </linearGradient>
                <pattern id={`field-lines-${area.id}`} width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
                  <rect width="46" height="46" fill="transparent" />
                  <path d="M0 12 H46 M0 30 H46" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
                </pattern>
              </defs>

              <polygon className="field-shadow" points={projection.pointsString} transform="translate(16 24)" />
              <polygon className="field-base" points={projection.pointsString} fill={`url(#field-gradient-${area.id})`} />
              <polygon className="field-texture" points={projection.pointsString} fill={`url(#field-lines-${area.id})`} />

              <g clipPath={`url(#field-clip-${area.id})`}>
                <path className="water-channel" d={`M20 ${projection.center.y - 14} C180 ${projection.center.y - 70} 352 ${projection.center.y + 72} 600 ${projection.center.y - 18}`} />
                <path className="field-road" d={`M70 ${projection.center.y + 96} C220 ${projection.center.y + 28} 390 ${projection.center.y + 126} 570 ${projection.center.y + 70}`} />
                {projectedZones.length > 0 ? (
                  projectedZones.map(zone => (
                    <polygon
                      key={zone.id}
                      className="zone zone-map"
                      points={zone.points}
                      fill={zone.color}
                      opacity={zone.opacity}
                    />
                  ))
                ) : (
                  <>
                    <rect className="zone zone-light" x="340" y="88" width="200" height="130" rx="16" transform={`rotate(10 ${projection.center.x} ${projection.center.y})`} />
                    {tone !== "healthy" && (
                      <rect className="zone zone-warning" x="190" y="232" width="250" height="104" rx="16" transform={`rotate(-5 ${projection.center.x} ${projection.center.y})`} />
                    )}
                  </>
                )}
              </g>

              <polygon className="field-border" points={projection.pointsString} />

              {markers.map((marker, index) => (
                <circle
                  key={`${marker.x}-${marker.y}-${index}`}
                  className={`field-marker ${marker.tone}`}
                  cx={marker.x}
                  cy={marker.y}
                  r={marker.tone === "critical" ? 5 : 4}
                />
              ))}

              <g className="site-pin" transform={`translate(${projection.center.x - 8} ${projection.center.y - 12})`}>
                <circle r="16" />
                <circle r="7" />
              </g>
            </svg>

            <div className="farm3d-label site-a">Talhão A<br /><strong>Soja</strong></div>
            {projectedZones.slice(0, 2).map((zone, index) => (
              <div
                key={`${zone.id}-label`}
                className={`farm3d-label zone-label zone-label-${index}`}
                style={{
                  left: `${(zone.center.x / projection.width) * 100}%`,
                  top: `${(zone.center.y / projection.height) * 100}%`,
                  borderColor: zone.color,
                }}
              >
                Zona {index + 1}<br /><strong>{zone.status}</strong>
              </div>
            ))}
            {projectedZones.length === 0 && (
              <>
                <div className="farm3d-label site-b">Talhão B<br /><strong>Irrigação</strong></div>
                <div className="farm3d-label site-c">Talhão C<br /><strong>Pragas</strong></div>
              </>
            )}
          </div>

          <div className="farm3d-controls" onPointerDown={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => updateScale(1)} aria-label="Aproximar modelo 3D">+</button>
            <button type="button" onClick={() => updateScale(-1)} aria-label="Afastar modelo 3D">−</button>
            <button type="button" onClick={resetScene} aria-label="Restaurar visão 3D">↺</button>
          </div>
        </div>

        <aside className="farm3d-side right">
          <MetricCard icon="💧" label="Umidade do solo" value={metrics.moisture} />
          <MetricCard icon="🌿" label="Fertilidade" value={metrics.fertility} />
          <MetricCard icon="📈" label="Produção prevista" value={metrics.yield} />
          <MetricCard icon="⚠️" label="Risco de pragas" value={metrics.pest} tone={metrics.pest > 70 ? "danger" : "warning"} />
        </aside>
      </div>

      <div className="farm3d-actions">
        <div>
          <strong>Rota recomendada</strong>
          <span>{alertText}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            document.querySelector(".mapa-area")?.scrollIntoView({ behavior: "smooth", block: "center" })
          }}
        >
          Ver no mapa
        </button>
      </div>
    </section>
  )
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
  const [visibleAreasCount, setVisibleAreasCount] = useState(3)

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
        color: area.color || "#3d8057",
        fillColor: area.color || "#3d8057",
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
              background:${area.color || "#3d8057"};
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
        color: Number(id) === selectedAreaId ? "#56a870" : (areas.find(a => a.id == id)?.color || "#3d8057"),
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
      color: "#3d8057",
      fillColor: "#56a870",
      fillOpacity: 1,
      weight: 2
    }).addTo(mapInstanceRef.current)

    markersRef.current.push(marker)

    if (lineRef.current) {
      mapInstanceRef.current.removeLayer(lineRef.current)
    }

    lineRef.current = L.polyline(newPoints, {
      color: "#3d8057",
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
          html: `<div style="background:#3d8057;padding:6px 12px;border-radius:10px;color:#fff;font-weight:600;font-size:12px;">
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
  const visibleAreas = areas.slice(0, visibleAreasCount)
  const hasMoreAreas = visibleAreasCount < areas.length
  const selectedArea = areas.find(area => area.id === selectedAreaId) || areas[areas.length - 1] || null

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
            <span className="material-symbols-outlined btn-icon">edit_location_alt</span>
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

      <Field3DView area={selectedArea} />

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
          <>
            <div className="areas-cards">
              {visibleAreas.map((area) => (
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

            {hasMoreAreas && (
              <button
                className="show-more-areas-btn"
                onClick={() => setVisibleAreasCount(count => count + 3)}
              >
                Ver mais áreas
                <span>{areas.length - visibleAreasCount} restante(s)</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
