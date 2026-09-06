import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { formatDiagnosisName } from "./diagnosisLabels"
import "../../../../styles/App/AllHistory.css"

export default function AllHistory({ onBack }) {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
    try {
      const saved = localStorage.getItem("diagnosticHistory")
      if (saved) setHistory(JSON.parse(saved))
    } catch {
      setHistory([])
    }
  }, [])

  const getDisplayName = (item) => formatDiagnosisName(item?.disease || item?.resultado || "Diagnóstico")
  const getConfidence = (item) => Math.max(0, Math.min(100, Math.round(Number(item?.confidence) || 0)))

  const getConfidenceClass = (confidence) => {
    if (confidence >= 80) return "high"
    if (confidence >= 50) return "medium"
    return "low"
  }

  const getConfidenceText = (confidence) => {
    if (confidence >= 80) return "Alta confiança"
    if (confidence >= 50) return "Média confiança"
    return "Baixa confiança"
  }

  const filteredHistory = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return [...history]
      .filter((item) => {
        const confidence = getConfidence(item)
        return (
          (!search || getDisplayName(item).toLowerCase().includes(search)) &&
          (filterType === "all" ||
            (filterType === "high" && confidence >= 80) ||
            (filterType === "medium" && confidence >= 50 && confidence < 80) ||
            (filterType === "low" && confidence < 50))
        )
      })
      .sort((a, b) => {
        if (sortBy === "confidence") return getConfidence(b) - getConfidence(a)
        if (sortBy === "name") return getDisplayName(a).localeCompare(getDisplayName(b))
        return Number(b.id || 0) - Number(a.id || 0)
      })
  }, [filterType, history, searchTerm, sortBy])

  const saveHistory = (updatedHistory) => {
    setHistory(updatedHistory)
    localStorage.setItem("diagnosticHistory", JSON.stringify(updatedHistory))
  }

  const deleteDiagnostic = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este diagnóstico?")) {
      saveHistory(history.filter((item) => item.id !== id))
    }
  }

  const clearAllHistory = () => {
    if (window.confirm("Tem certeza que deseja excluir TODO o histórico? Esta ação não pode ser desfeita.")) {
      saveHistory([])
    }
  }

  const sanitizePdfText = (value) => {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
  }

  const wrapPdfText = (text, maxLength = 74) => {
    const words = sanitizePdfText(text).split(" ")
    const lines = []
    let current = ""

    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word
      if (next.length > maxLength && current) {
        lines.push(current)
        current = word
      } else {
        current = next
      }
    })

    if (current) lines.push(current)
    return lines
  }

  const buildPdf = (lines) => {
    const pageWidth = 595
    const pageHeight = 842
    const margin = 48
    const lineHeight = 16
    const pages = []
    let currentPage = []
    let y = pageHeight - margin

    lines.forEach((line) => {
      const wrapped = wrapPdfText(line.text, line.maxLength)
      wrapped.forEach((wrappedLine, index) => {
        if (y < margin) {
          pages.push(currentPage)
          currentPage = []
          y = pageHeight - margin
        }

        currentPage.push({
          text: wrappedLine,
          x: margin + (line.indent || 0),
          y,
          size: line.size || 11,
          bold: line.bold || false,
        })
        y -= line.after && index === wrapped.length - 1 ? line.after : lineHeight
      })
    })

    if (currentPage.length) pages.push(currentPage)

    const objects = []
    const addObject = (content) => {
      objects.push(content)
      return objects.length
    }

    const fontRegular = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    const pageRefs = []

    pages.forEach((page) => {
      const content = [
        "BT",
        ...page.map((item) => {
          const font = item.bold ? "F2" : "F1"
          return `/${font} ${item.size} Tf 1 0 0 1 ${item.x} ${item.y} Tm (${item.text}) Tj`
        }),
        "ET",
      ].join("\n")
      const contentRef = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
      const pageRef = addObject(
        `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentRef} 0 R >>`
      )
      pageRefs.push(pageRef)
    })

    const pagesRef = addObject(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`)
    pageRefs.forEach((pageRef) => {
      objects[pageRef - 1] = objects[pageRef - 1].replace("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`)
    })
    const catalogRef = addObject(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`)

    let pdf = "%PDF-1.4\n"
    const offsets = [0]
    objects.forEach((object, index) => {
      offsets.push(pdf.length)
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    })

    const xrefOffset = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
    })
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

    return new Blob([pdf], { type: "application/pdf" })
  }

  const totalDiagnostics = history.length
  const averageConfidence = history.length > 0
    ? Math.round(history.reduce((acc, item) => acc + getConfidence(item), 0) / history.length)
    : 0
  const mostCommonDisease = history.length > 0
    ? Object.entries(history.reduce((acc, item) => {
        const name = getDisplayName(item)
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nenhum"
    : "Nenhum"

  const exportHistory = () => {
    const lines = [
      { text: "Historico de Diagnosticos", size: 20, bold: true, after: 24 },
      { text: `Gerado em: ${new Date().toLocaleString("pt-BR")}`, size: 10, after: 22 },
      { text: "Resumo", size: 14, bold: true, after: 18 },
      { text: `Total de diagnosticos: ${totalDiagnostics}`, after: 16 },
      { text: `Confianca media: ${averageConfidence}%`, after: 16 },
      { text: `Diagnostico mais comum: ${mostCommonDisease}`, after: 24 },
      { text: "Diagnosticos", size: 14, bold: true, after: 18 },
    ]

    history.forEach((item, index) => {
      const confidence = getConfidence(item)
      lines.push(
        { text: `${index + 1}. ${getDisplayName(item)}`, bold: true, after: 16 },
        { text: `Data: ${item.date || "-"}`, indent: 16, after: 16 },
        { text: `Confianca: ${confidence}% (${getConfidenceText(confidence)})`, indent: 16, after: 16 }
      )

      if (item.type === "batch") {
        lines.push({
          text: `Lote: ${item.imageCount || 0} fotos, ${item.reliableCount || 0} confiaveis, ${item.conditionCount || 0} condicoes`,
          indent: 16,
          after: 16,
        })
      }

      lines.push({ text: "Observacao: use este resultado como apoio e acompanhe a planta nos proximos dias.", indent: 16, after: 22 })
    })

    const url = URL.createObjectURL(buildPdf(lines))
    const linkElement = document.createElement("a")
    linkElement.href = url
    linkElement.download = `diagnosticos_${new Date().toISOString().slice(0, 10)}.pdf`
    linkElement.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="all-history-container">
      <div className="history-header">
        <button className="back-button" onClick={onBack || (() => navigate(-1))} aria-label="Voltar">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1>Histórico de Diagnósticos</h1>
        <div className="header-actions">
          {history.length > 0 && (
            <>
              <button className="export-button" onClick={exportHistory} aria-label="Exportar relatório">
                <span className="material-symbols-outlined">download</span>
              </button>
              <button className="clear-button" onClick={clearAllHistory} aria-label="Limpar histórico">
                <span className="material-symbols-outlined">delete_sweep</span>
              </button>
            </>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="stats-cards">
          <div className="stat-card">
            <span className="material-symbols-outlined">analytics</span>
            <div className="stat-info">
              <strong>{totalDiagnostics}</strong>
              <p>Total de diagnósticos</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="material-symbols-outlined">verified</span>
            <div className="stat-info">
              <strong>{averageConfidence}%</strong>
              <p>Confiança média</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="material-symbols-outlined">eco</span>
            <div className="stat-info">
              <strong>{mostCommonDisease}</strong>
              <p>Mais comum</p>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="filters-section">
          <div className="search-box">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Buscar por doença..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button aria-pressed={filterType === "all"} className={`filter-btn ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>Todos</button>
            <button aria-pressed={filterType === "high"} className={`filter-btn high ${filterType === "high" ? "active" : ""}`} onClick={() => setFilterType("high")}>Alta confiança</button>
            <button aria-pressed={filterType === "medium"} className={`filter-btn medium ${filterType === "medium" ? "active" : ""}`} onClick={() => setFilterType("medium")}>Média confiança</button>
            <button aria-pressed={filterType === "low"} className={`filter-btn low ${filterType === "low" ? "active" : ""}`} onClick={() => setFilterType("low")}>Baixa confiança</button>
          </div>

          <div className="sort-buttons">
            <span>Ordenar por:</span>
            <button aria-pressed={sortBy === "date"} className={`sort-btn ${sortBy === "date" ? "active" : ""}`} onClick={() => setSortBy("date")}>Data</button>
            <button aria-pressed={sortBy === "confidence"} className={`sort-btn ${sortBy === "confidence" ? "active" : ""}`} onClick={() => setSortBy("confidence")}>Confiança</button>
            <button aria-pressed={sortBy === "name"} className={`sort-btn ${sortBy === "name" ? "active" : ""}`} onClick={() => setSortBy("name")}>Nome</button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-results-heading">
          <div>
            <span className="material-symbols-outlined" aria-hidden="true">history</span>
            <h2>Diagnósticos</h2>
          </div>
          <span>{filteredHistory.length} {filteredHistory.length === 1 ? "resultado" : "resultados"}</span>
        </div>
      )}

      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <span className="material-symbols-outlined">history</span>
            </div>
            <h3>Nenhum diagnóstico encontrado</h3>
            {searchTerm || filterType !== "all" ? (
              <p>Tente ajustar os filtros ou a busca</p>
            ) : (
              <p>Realize seu primeiro diagnóstico tirando uma foto ou selecionando da galeria</p>
            )}
            <button className="new-diagnostic-btn" onClick={onBack || (() => navigate(-1))}>
              <span className="material-symbols-outlined">add</span>
              Novo diagnóstico
            </button>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const confidence = getConfidence(item)
            return (
              <div key={item.id} className={`history-card ${getConfidenceClass(confidence)}`}>
                <div className="history-card-content">
                  <div className="history-card-icon">
                    <span className="material-symbols-outlined">{item.type === "batch" ? "flight" : "eco"}</span>
                  </div>
                  <div className="history-card-info">
                    <h3>{getDisplayName(item)}</h3>
                    {item.type === "batch" && (
                      <div className="batch-history-meta">
                        <span><strong>{item.imageCount || 0}</strong> fotos</span>
                        <span><strong>{item.reliableCount || 0}</strong> confiáveis</span>
                        <span><strong>{item.conditionCount || 0}</strong> condições</span>
                      </div>
                    )}
                    <div className="history-card-meta">
                      <span className="date">
                        <span className="material-symbols-outlined">schedule</span>
                        {item.date}
                      </span>
                      <span className={`confidence-badge ${getConfidenceClass(confidence)}`}>
                        {getConfidenceText(confidence)}
                      </span>
                    </div>
                    <div className="confidence-bar-container">
                      <div className="confidence-bar-label">
                        <span>{item.type === "batch" ? "Confiança média" : "Confiança"}</span>
                        <span>{confidence}%</span>
                      </div>
                      <div className="confidence-bar">
                        <div className="confidence-fill" style={{ width: `${confidence}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <button className="delete-item-btn" onClick={() => deleteDiagnostic(item.id)} aria-label="Excluir diagnóstico">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
