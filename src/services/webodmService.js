const STORAGE_KEY = "webodmConnection"

const cleanUrl = (url = "") => url.trim().replace(/\/+$/, "")

function getEnvConfig() {
  return {
    baseUrl: import.meta.env.VITE_WEBODM_URL || "",
    token: import.meta.env.VITE_WEBODM_TOKEN || "",
    projectId: import.meta.env.VITE_WEBODM_PROJECT_ID || "",
    taskId: import.meta.env.VITE_WEBODM_TASK_ID || "",
    detectionsUrl: import.meta.env.VITE_WEBODM_DETECTIONS_URL || "",
    publicTaskUrl: import.meta.env.VITE_WEBODM_PUBLIC_TASK_URL || "",
  }
}

export function getStoredWebODMConfig() {
  return getEnvConfig()
}

export function hasWebODMConfig(config = getEnvConfig()) {
  return Boolean(config.publicTaskUrl || (config.baseUrl && config.projectId && config.taskId))
}

export function saveWebODMConfig(config) {
  const nextConfig = {
    baseUrl: cleanUrl(config.baseUrl),
    token: config.token?.trim() || "",
    projectId: String(config.projectId || "").trim(),
    taskId: String(config.taskId || "").trim(),
    detectionsUrl: config.detectionsUrl?.trim() || "",
    publicTaskUrl: config.publicTaskUrl?.trim() || "",
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig))
  return nextConfig
}

function assertConfig(config) {
  if (!config.baseUrl || !config.projectId || !config.taskId) {
    throw new Error("Informe URL do WebODM, ID do projeto e ID da task.")
  }
}

async function webodmFetch(config, path) {
  const headers = {}
  if (config.token) {
    headers.Authorization = `JWT ${config.token}`
  }

  const response = await fetch(`${cleanUrl(config.baseUrl)}${path}`, { headers })

  if (!response.ok) {
    throw new Error(`WebODM respondeu ${response.status} ao acessar ${path}`)
  }

  return response.json()
}

async function fetchOptional(config, path) {
  try {
    return await webodmFetch(config, path)
  } catch {
    return null
  }
}

function normalizeDetections(payload) {
  if (!payload) return []

  if (payload.type === "FeatureCollection") {
    return payload.features.map((feature, index) => {
      const props = feature.properties || {}
      const coordinates = feature.geometry?.coordinates?.[0] || []
      const polygon = coordinates.map(([lng, lat]) => [lat, lng])
      const center = polygon.length
        ? polygon.reduce(
            (acc, point) => [acc[0] + point[0] / polygon.length, acc[1] + point[1] / polygon.length],
            [0, 0]
          )
        : null

      return {
        id: feature.id || `geojson-${index}`,
        label: props.label || props.problema || props.name || "Problema detectado",
        severity: Number(props.severity || props.severidade || 0),
        confidence: Number(props.confidence || props.confianca || 0),
        affectedHa: Number(props.affectedHa || props.area_ha || 0),
        prescription: props.prescription || props.prescricao || "",
        color: props.color || props.cor || "#d94841",
        center,
        polygon,
      }
    }).filter(item => item.center && item.polygon.length >= 3)
  }

  const detections = Array.isArray(payload) ? payload : payload.detections
  if (!Array.isArray(detections)) return []

  return detections.map((item, index) => ({
    id: item.id || `detection-${index}`,
    label: item.label || item.problema || "Problema detectado",
    severity: Number(item.severity || item.severidade || 0),
    confidence: Number(item.confidence || item.confianca || 0),
    affectedHa: Number(item.affectedHa || item.areaHa || item.area_ha || 0),
    prescription: item.prescription || item.prescricao || "",
    color: item.color || item.cor || "#d94841",
    center: item.center || (item.lat && item.lng ? [Number(item.lat), Number(item.lng)] : null),
    polygon: item.polygon || item.coordinates || [],
  })).filter(item => item.center)
}

async function fetchDetections(config) {
  if (!config.detectionsUrl) return []

  const headers = {}
  if (config.token && cleanUrl(config.detectionsUrl).startsWith(cleanUrl(config.baseUrl))) {
    headers.Authorization = `JWT ${config.token}`
  }

  const response = await fetch(config.detectionsUrl, { headers })
  if (!response.ok) {
    throw new Error(`Fonte de detecções respondeu ${response.status}.`)
  }

  return normalizeDetections(await response.json())
}

export async function loadWebODMAnalysis(configInput) {
  const config = saveWebODMConfig(configInput)

  if (config.publicTaskUrl && (!config.projectId || !config.taskId)) {
    return {
      config,
      projectId: "publico",
      taskId: extractTaskUuid(config.publicTaskUrl) || "task-publica",
      task: { status: "link publico" },
      bounds: null,
      detections: [],
      affectedHa: 0,
      affectedPct: 0,
      severity: 0,
      orthophotoTiles: null,
      dsmTiles: null,
      dtmTiles: null,
      orthophoto: "Link publico WebODM carregado",
      dsm: "Visualizacao 3D disponivel",
      resolutionCm: "-",
      indices: {
        ndvi: "-",
        vari: "-",
        drainageRisk: "indisponivel",
      },
      route: [],
      timeline: [],
      prescription: [],
      productivityLoss: "-",
      publicTaskUrl: config.publicTaskUrl,
    }
  }

  assertConfig(config)

  const [task, orthophotoTiles, dsmTiles, dtmTiles, bounds, detections] = await Promise.all([
    webodmFetch(config, `/api/projects/${config.projectId}/tasks/${config.taskId}/`),
    fetchOptional(config, `/api/projects/${config.projectId}/tasks/${config.taskId}/orthophoto/tiles.json`),
    fetchOptional(config, `/api/projects/${config.projectId}/tasks/${config.taskId}/dsm/tiles.json`),
    fetchOptional(config, `/api/projects/${config.projectId}/tasks/${config.taskId}/dtm/tiles.json`),
    fetchOptional(config, `/api/projects/${config.projectId}/tasks/${config.taskId}/bounds/`),
    fetchDetections(config),
  ])

  const affectedHa = Number(detections.reduce((sum, item) => sum + (item.affectedHa || 0), 0).toFixed(2))
  const averageSeverity = detections.length
    ? Math.round(detections.reduce((sum, item) => sum + item.severity, 0) / detections.length)
    : 0

  return {
    config,
    projectId: config.projectId,
    taskId: config.taskId,
    task,
    bounds,
    detections,
    affectedHa,
    affectedPct: 0,
    severity: averageSeverity,
    orthophotoTiles,
    dsmTiles,
    dtmTiles,
    orthophoto: orthophotoTiles ? "Ortomosaico WebODM carregado" : "Ortomosaico sem tiles disponíveis",
    dsm: dsmTiles || dtmTiles ? "Elevação disponível" : "DSM/DTM não disponível",
    resolutionCm: task?.options?.find?.(option => option.name === "orthophoto-resolution")?.value || "-",
    indices: {
      ndvi: "-",
      vari: "-",
      drainageRisk: dsmTiles || dtmTiles ? "disponível" : "indisponível",
    },
    route: detections.map(item => item.center),
    timeline: [],
    prescription: detections.map(item => ({
      area: item.label,
      action: item.prescription || "Revisar no campo e registrar recomendação agronômica.",
      dose: item.severity >= 70 ? "Prioridade alta" : item.severity >= 45 ? "Prioridade média" : "Acompanhar",
    })),
    productivityLoss: "-",
  }
}

function extractTaskUuid(publicTaskUrl = "") {
  return publicTaskUrl.match(/\/public\/task\/([^/]+)/)?.[1] || ""
}

export function getTileUrl(config, projectId, taskId, layer = "orthophoto") {
  return `${cleanUrl(config.baseUrl)}/api/projects/${projectId}/tasks/${taskId}/${layer}/tiles/{z}/{x}/{y}.png`
}
