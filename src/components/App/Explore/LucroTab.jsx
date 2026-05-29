import { useEffect, useMemo, useState } from "react"
import { useFarm } from "./hooks/useFarm"
import { buscarCotacaoSoja } from "../../../services/cotacaoSojaService"
import "../../../styles/App/Explore.css"

const DEFAULT_PRODUTIVIDADE = 60

function parseNumber(value) {
  if (value === null || value === undefined) return 0
  const match = String(value).replace(",", ".").match(/-?\d+(\.\d+)?/)
  const normalized = match?.[0] || ""
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value || 0)
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value || 0)
}

function formatDate(value) {
  if (!value) return "Atualização não informada"
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return `Fechamento: ${value}`

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Atualização não informada"

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export default function LucroTab() {
  const { farmData, loading: farmLoading } = useFarm()
  const [produtividade, setProdutividade] = useState(DEFAULT_PRODUTIVIDADE)
  const [custoPorHectare, setCustoPorHectare] = useState(0)
  const [cotacao, setCotacao] = useState(null)
  const [loadingCotacao, setLoadingCotacao] = useState(true)
  const [cotacaoError, setCotacaoError] = useState("")
  const [cepLocation, setCepLocation] = useState(null)

  const areaHectares = parseNumber(
    farmData?.area_total ??
      farmData?.areaTotal ??
      farmData?.area ??
      farmData?.hectares ??
      farmData?.tamanho ??
      farmData?.tamanho_plantacao
  )
  const areaLabel = areaHectares ? `${formatNumber(areaHectares, 1)} ha` : "Área não informada"
  const municipioCotacao = cepLocation?.municipio || farmData?.municipio
  const ufCotacao = cepLocation?.uf || farmData?.uf
  const precoSaca = cotacao?.valor || 0

  const calculo = useMemo(() => {
    const sacasEstimadas = areaHectares * parseNumber(produtividade)
    const faturamento = sacasEstimadas * precoSaca
    const custoTotal = areaHectares * parseNumber(custoPorHectare)
    const lucroLiquido = faturamento - custoTotal

    return {
      sacasEstimadas,
      faturamento,
      custoTotal,
      lucroLiquido
    }
  }, [areaHectares, produtividade, precoSaca, custoPorHectare])

  async function carregarCotacao() {
    setLoadingCotacao(true)
    setCotacaoError("")

    try {
      const data = await buscarCotacaoSoja({
        uf: ufCotacao,
        municipio: municipioCotacao
      })
      setCotacao(data)
    } catch (error) {
      console.error(error)
      setCotacao(null)
      setCotacaoError("Não foi possível buscar a cotação agora. O cálculo será atualizado assim que a API responder.")
    } finally {
      setLoadingCotacao(false)
    }
  }

  useEffect(() => {
    if (farmData) carregarCotacao()
  }, [ufCotacao, municipioCotacao])

  useEffect(() => {
    const cepLimpo = farmData?.cep?.replace(/\D/g, "")

    if (!cepLimpo || cepLimpo.length !== 8) {
      setCepLocation(null)
      return
    }

    let active = true

    async function carregarCidadeDoCep() {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        const data = await response.json()

        if (!active) return

        if (!data.erro) {
          setCepLocation({
            municipio: data.localidade,
            uf: data.uf
          })
        }
      } catch (error) {
        console.error("Erro ao buscar cidade pelo CEP:", error)
        if (active) setCepLocation(null)
      }
    }

    carregarCidadeDoCep()

    return () => {
      active = false
    }
  }, [farmData?.cep])

  if (farmLoading) {
    return (
      <div className="lucro-state-card">
        <span className="material-symbols-outlined">hourglass_top</span>
        <h3>Carregando fazenda</h3>
        <p>Buscando a área cadastrada para montar a estimativa.</p>
      </div>
    )
  }

  if (!farmData) {
    return (
      <div className="lucro-state-card">
        <span className="material-symbols-outlined">agriculture</span>
        <h3>Nenhuma fazenda cadastrada</h3>
        <p>Cadastre uma fazenda para calcular a estimativa usando a área total da plantação.</p>
      </div>
    )
  }

  return (
    <div className="lucro-container">
      <section className="lucro-hero">
        <div>
          <span className="lucro-kicker">Estimativa da safra</span>
          <h2>Lucro e faturamento da soja</h2>
          <p>
            Área cadastrada de {farmData.name || "sua fazenda"}:{" "}
            <strong>{areaLabel}</strong>
          </p>
        </div>

        <div className="lucro-price-card">
          <span className="material-symbols-outlined">monitoring</span>
          <small>Cotação da soja</small>
          <strong>{loadingCotacao ? "Atualizando..." : formatCurrency(precoSaca)}</strong>
          <span>por saca de 60 kg</span>
          {municipioCotacao && (
            <span>{municipioCotacao}{ufCotacao ? ` - ${ufCotacao}` : ""}</span>
          )}
        </div>
      </section>

      <section className="lucro-grid">
        <div className="lucro-panel">
          <div className="lucro-panel-header">
            <div>
              <h3>Parâmetros</h3>
              <p>Ajuste os números para simular diferentes cenários.</p>
            </div>
            <button className="lucro-refresh-btn" onClick={carregarCotacao} disabled={loadingCotacao}>
              <span className="material-symbols-outlined">refresh</span>
              {loadingCotacao ? "Atualizando" : "Atualizar"}
            </button>
          </div>

          <div className="lucro-form-grid">
            <label className="lucro-field">
              <span>Área cadastrada</span>
              <input
                type="text"
                value={areaLabel}
                disabled
              />
              <small>hectares</small>
            </label>

            <label className="lucro-field">
              <span>Produtividade média</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={produtividade}
                onChange={(event) => setProdutividade(event.target.value)}
              />
              <small>sacas por hectare</small>
            </label>

            <label className="lucro-field">
              <span>Preço da saca</span>
              <input
                type="text"
                value={loadingCotacao ? "Atualizando..." : formatCurrency(precoSaca)}
                disabled
              />
              <small>{cotacao?.praca || "valor carregado pela API"}</small>
            </label>

            <label className="lucro-field">
              <span>Custo estimado</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={custoPorHectare}
                onChange={(event) => setCustoPorHectare(event.target.value)}
              />
              <small>R$ por hectare</small>
            </label>
          </div>

          {cotacaoError && (
            <p className="lucro-alert">
              <span className="material-symbols-outlined">info</span>
              {cotacaoError}
            </p>
          )}

          <p className="lucro-source">
            Fonte: {cotacao?.fonte || "AgroDoc AI"} · {formatDate(cotacao?.atualizado)}
          </p>
        </div>

        <div className="lucro-result-panel">
          <span className="lucro-result-label">Resultado estimado</span>
          <strong>{formatCurrency(calculo.lucroLiquido)}</strong>
          <p>Lucro estimado considerando o custo informado.</p>

          <div className="lucro-math">
            <span>{formatNumber(areaHectares, 1)} ha</span>
            <span>x</span>
            <span>{formatNumber(parseNumber(produtividade), 1)} sacas/ha</span>
            <span>x</span>
            <span>{formatCurrency(precoSaca)}</span>
          </div>
        </div>
      </section>

      <section className="lucro-summary-grid">
        <article>
          <span className="material-symbols-outlined">grain</span>
          <small>Sacas estimadas</small>
          <strong>{formatNumber(calculo.sacasEstimadas, 0)}</strong>
        </article>
        <article>
          <span className="material-symbols-outlined">payments</span>
          <small>Faturamento bruto</small>
          <strong>{formatCurrency(calculo.faturamento)}</strong>
        </article>
        <article>
          <span className="material-symbols-outlined">receipt_long</span>
          <small>Custo total</small>
          <strong>{formatCurrency(calculo.custoTotal)}</strong>
        </article>
      </section>
    </div>
  )
}
