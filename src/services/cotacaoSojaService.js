const COTACAO_API_URL = "https://agrodocai.com.br/api/v1/cotacao"

function buildCotacaoUrl({ uf, municipio } = {}) {
  const params = new URLSearchParams({ produto: "soja" })

  if (uf) params.set("uf", String(uf).trim().toUpperCase())
  if (municipio) params.set("cidade", String(municipio).trim())

  return `${COTACAO_API_URL}?${params.toString()}`
}

function getCotacaoValue(data) {
  const candidates = [
    data?.valor,
    data?.preco,
    data?.soja,
    data?.soja_uf?.preco,
    data?.soja_uf?.valor,
    data?.cotacao?.valor,
    data?.cotacao?.preco
  ]

  return candidates.map(Number).find((value) => Number.isFinite(value) && value > 0)
}

export async function buscarCotacaoSoja(localizacao = {}) {
  const response = await fetch(buildCotacaoUrl(localizacao))

  if (!response.ok) {
    throw new Error("Não foi possível buscar a cotação da soja")
  }

  const data = await response.json()
  const valor = getCotacaoValue(data)

  if (!valor) {
    throw new Error("Cotação da soja indisponível")
  }

  const uf = data?.uf || localizacao.uf
  const municipio = data?.cidade || data?.municipio || localizacao.municipio
  const praca = data?.praca || data?.soja_praca || data?.cotacao?.praca

  return {
    valor,
    atualizado: data?.atualizado || data?.data_cotacao || data?.data || null,
    data: data?.data_cotacao || data?.data || data?.atualizado || null,
    variacao: data?.variacao ?? null,
    fonte: data?.fonte || "AgroDoc AI",
    praca: praca || [municipio, uf].filter(Boolean).join(" - ") || "Cotação da soja",
    unidade: data?.unidade || "saca de 60 kg",
    raw: data
  }
}
