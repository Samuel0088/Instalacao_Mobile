const AGRODOC_COTACAO_API_URL = "https://agrodocai.com.br/api/v1/cotacao"
const GIRORURAL_API_URL = "https://api.girorural.com/api/v1"
const REDACAO_AGRO_API_URL = "https://www.redacaoagro.com.br/api/cotacoes.php"

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function buildAgroDocUrl({ uf, municipio } = {}) {
  const params = new URLSearchParams({ produto: "soja" })

  if (uf) params.set("uf", String(uf).trim().toUpperCase())
  if (municipio) params.set("cidade", String(municipio).trim())

  return `${AGRODOC_COTACAO_API_URL}?${params.toString()}`
}

function toNumber(value) {
  if (typeof value === "number") return value

  const parsed = Number(
    String(value)
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  )

  return Number.isFinite(parsed) ? parsed : 0
}

function getCotacaoValue(data) {
  const candidates = [
    data?.valor,
    data?.value,
    data?.preco,
    data?.price,
    data?.preco_saca,
    data?.precoSaca,
    data?.saca,
    data?.soja,
    data?.soja_uf?.preco,
    data?.soja_uf?.valor,
    data?.cotacao?.valor,
    data?.cotacao?.preco,
    data?.commodities?.soja?.valor
  ]

  return candidates.map(toNumber).find((value) => value > 0)
}

function flattenCotacoes(data) {
  if (!data) return []
  if (Array.isArray(data)) return data.flatMap(flattenCotacoes)
  if (typeof data !== "object") return []

  const nested = [
    data.data,
    data.items,
    data.results,
    data.cotacoes,
    data.quotes,
    data.physical,
    data.markets,
    data.graos,
    data.soja
  ].flatMap(flattenCotacoes)

  return [data, ...nested]
}

function getLocalName(item) {
  return item?.cidade || item?.municipio || item?.city || item?.praca || item?.local || item?.location || ""
}

function getStateName(item) {
  return item?.uf || item?.estado || item?.state || ""
}

function pickBestCotacao(data, localizacao) {
  const city = normalizeText(localizacao?.municipio)
  const state = normalizeText(localizacao?.uf)
  const items = flattenCotacoes(data).filter((item) => getCotacaoValue(item))

  if (!items.length) return null

  const exactCity = items.find((item) => normalizeText(getLocalName(item)) === city)
  if (exactCity) return exactCity

  const cityContains = items.find((item) => {
    const local = normalizeText(getLocalName(item))
    return city && (local.includes(city) || city.includes(local))
  })
  if (cityContains) return cityContains

  const sameState = items.find((item) => normalizeText(getStateName(item)) === state)
  if (sameState) return sameState

  return items[0]
}

function formatCotacao(item, localizacao, fonte) {
  const valor = getCotacaoValue(item)

  if (!valor) {
    throw new Error("Cotação da soja indisponível")
  }

  const uf = item?.uf || item?.estado || item?.state || localizacao.uf
  const municipio = item?.cidade || item?.municipio || item?.city || localizacao.municipio
  const praca = item?.praca || item?.local || item?.location || [municipio, uf].filter(Boolean).join(" - ")

  return {
    valor,
    atualizado: item?.atualizado || item?.updated_at || item?.data_cotacao || item?.data || item?.date || null,
    data: item?.data_cotacao || item?.data || item?.date || item?.atualizado || null,
    variacao: item?.variacao ?? item?.variation ?? null,
    fonte,
    praca: praca || "Cotação da soja",
    unidade: item?.unidade || item?.unit || "saca de 60 kg",
    raw: item
  }
}

async function fetchGiroRural(localizacao = {}) {
  const uf = String(localizacao.uf || "").trim().toLowerCase()
  const endpoints = [
    uf && `${GIRORURAL_API_URL}/grains/physical/${uf}`,
    `${GIRORURAL_API_URL}/physical/soja`,
    `${GIRORURAL_API_URL}/grains/physical`
  ].filter(Boolean)

  let lastError = null

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint)

      if (!response.ok) {
        lastError = new Error("Não foi possível buscar a cotação na GiroRural")
        continue
      }

      const data = await response.json()
      const item = pickBestCotacao(data, localizacao)

      if (item) return formatCotacao(item, localizacao, "GiroRural")
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("Cotação da soja indisponível")
}

async function fetchAgroDoc(localizacao = {}) {
  const response = await fetch(buildAgroDocUrl(localizacao))

  if (!response.ok) {
    throw new Error("Não foi possível buscar a cotação da soja")
  }

  const data = await response.json()
  return formatCotacao(data, localizacao, data?.fonte || "AgroDoc AI")
}

async function fetchRedacaoAgro(localizacao = {}) {
  const response = await fetch(REDACAO_AGRO_API_URL)

  if (!response.ok) {
    throw new Error("Não foi possível buscar a cotação na Redação Agro")
  }

  const data = await response.json()
  const item = {
    ...data?.commodities?.soja,
    praca: [localizacao.municipio, localizacao.uf].filter(Boolean).join(" - ") || "Referência CEPEA/ESALQ",
    unidade: "saca de 60 kg",
    data: data?.data || data?.ticker?.data || null
  }

  return formatCotacao(item, localizacao, "Redação Agro")
}

export async function buscarCotacaoSoja(localizacao = {}) {
  try {
    return await fetchGiroRural(localizacao)
  } catch (giroRuralError) {
    console.warn("GiroRural indisponível, tentando Redação Agro:", giroRuralError)
    try {
      return await fetchRedacaoAgro(localizacao)
    } catch (redacaoAgroError) {
      console.warn("Redação Agro indisponível, usando AgroDoc:", redacaoAgroError)
      return fetchAgroDoc(localizacao)
    }
  }
}
