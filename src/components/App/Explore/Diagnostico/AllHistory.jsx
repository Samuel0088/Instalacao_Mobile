import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../../../../styles/App/AllHistory.css"

export default function AllHistory({ onBack }) {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all") // all, high, medium, low
  const [sortBy, setSortBy] = useState("date") // date, confidence, name

  // Carregar histórico do localStorage
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })

    const saved = localStorage.getItem("diagnosticHistory")
    if (saved) {
      const parsedHistory = JSON.parse(saved)
      setHistory(parsedHistory)
      setFilteredHistory(parsedHistory)
    }
  }, [])

  // Filtrar e ordenar histórico
  useEffect(() => {
    let filtered = [...history]

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.disease.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por confiança
    if (filterType === "high") {
      filtered = filtered.filter(item => item.confidence >= 80)
    } else if (filterType === "medium") {
      filtered = filtered.filter(item => item.confidence >= 50 && item.confidence < 80)
    } else if (filterType === "low") {
      filtered = filtered.filter(item => item.confidence < 50)
    }

    // Ordenar
    if (sortBy === "date") {
      filtered.sort((a, b) => b.id - a.id)
    } else if (sortBy === "confidence") {
      filtered.sort((a, b) => b.confidence - a.confidence)
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.disease.localeCompare(b.disease))
    }

    setFilteredHistory(filtered)
  }, [searchTerm, filterType, sortBy, history])

  // Função para deletar um diagnóstico
  const deleteDiagnostic = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este diagnóstico?")) {
      const updatedHistory = history.filter(item => item.id !== id)
      setHistory(updatedHistory)
      localStorage.setItem("diagnosticHistory", JSON.stringify(updatedHistory))
    }
  }

  // Função para limpar todo o histórico
  const clearAllHistory = () => {
    if (window.confirm("Tem certeza que deseja excluir TODO o histórico? Esta ação não pode ser desfeita.")) {
      setHistory([])
      localStorage.setItem("diagnosticHistory", JSON.stringify([]))
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

  // Função para exportar histórico em PDF legível
  const exportHistory = () => {
    const totalDiagnostics = history.length
    const averageConfidence = history.length > 0
      ? Math.round(history.reduce((acc, item) => acc + item.confidence, 0) / history.length)
      : 0
    const mostCommonDisease = history.length > 0
      ? Object.entries(history.reduce((acc, item) => {
          acc[item.disease] = (acc[item.disease] || 0) + 1
          return acc
        }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nenhum"
      : "Nenhum"

    const lines = [
      { text: "Historico de Diagnosticos", size: 20, bold: true, after: 24 },
      { text: `Gerado em: ${new Date().toLocaleString("pt-BR")}`, size: 10, after: 22 },
      { text: "Resumo", size: 14, bold: true, after: 18 },
      { text: `Total de diagnosticos: ${totalDiagnostics}`, after: 16 },
      { text: `Confianca media: ${averageConfidence}%`, after: 16 },
      { text: `Doenca mais comum: ${mostCommonDisease}`, after: 24 },
      { text: "Como interpretar", size: 14, bold: true, after: 18 },
      { text: "Alta confianca: resultado com 80% ou mais de certeza.", after: 16 },
      { text: "Media confianca: resultado entre 50% e 79%. Vale conferir com outra foto.", after: 16 },
      { text: "Baixa confianca: resultado abaixo de 50%. Tire uma nova foto com melhor iluminacao.", after: 24 },
      { text: "Diagnosticos", size: 14, bold: true, after: 18 },
    ]

    history.forEach((item, index) => {
      lines.push(
        { text: `${index + 1}. ${item.disease}`, bold: true, after: 16 },
        { text: `Data: ${item.date}`, indent: 16, after: 16 },
        { text: `Confianca: ${item.confidence}% (${getConfidenceText(item.confidence)})`, indent: 16, after: 16 },
        { text: "Observacao: use este resultado como apoio e acompanhe a planta nos proximos dias.", indent: 16, after: 22 }
      )
    })

    const pdfBlob = buildPdf(lines)
    const url = URL.createObjectURL(pdfBlob)
    const linkElement = document.createElement("a")
    linkElement.href = url
    linkElement.download = `diagnosticos_${new Date().toISOString().slice(0, 10)}.pdf`
    linkElement.click()
    URL.revokeObjectURL(url)
  }

  // Estatísticas
  const totalDiagnostics = history.length
  const averageConfidence = history.length > 0 
    ? Math.round(history.reduce((acc, item) => acc + item.confidence, 0) / history.length)
    : 0
  const mostCommonDisease = history.length > 0
    ? Object.entries(history.reduce((acc, item) => {
        acc[item.disease] = (acc[item.disease] || 0) + 1
        return acc
      }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nenhum"
    : "Nenhum"

  // Função para obter classe de severidade
  const getConfidenceClass = (confidence) => {
    if (confidence >= 80) return "high"
    if (confidence >= 50) return "medium"
    return "low"
  }

  // Função para obter texto de severidade
  const getConfidenceText = (confidence) => {
    if (confidence >= 80) return "Alta confiança"
    if (confidence >= 50) return "Média confiança"
    return "Baixa confiança"
  }

  return (
    <div className="all-history-container">
      {/* Header */}
      <div className="history-header">
        <button className="back-button" onClick={onBack || (() => navigate(-1))}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1>Histórico de Diagnósticos</h1>
        <div className="header-actions">
          {history.length > 0 && (
            <>
              <button className="export-button" onClick={exportHistory}>
                <span className="material-symbols-outlined">download</span>
              </button>
              <button className="clear-button" onClick={clearAllHistory}>
                <span className="material-symbols-outlined">delete_sweep</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Estatísticas */}
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
              <p>Doença mais comum</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e Busca */}
      {history.length > 0 && (
        <div className="filters-section">
          <div className="search-box">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Buscar por doença..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              Todos
            </button>
            <button
              className={`filter-btn high ${filterType === "high" ? "active" : ""}`}
              onClick={() => setFilterType("high")}
            >
              Alta confiança
            </button>
            <button
              className={`filter-btn medium ${filterType === "medium" ? "active" : ""}`}
              onClick={() => setFilterType("medium")}
            >
              Média confiança
            </button>
            <button
              className={`filter-btn low ${filterType === "low" ? "active" : ""}`}
              onClick={() => setFilterType("low")}
            >
              Baixa confiança
            </button>
          </div>

          <div className="sort-buttons">
            <span>Ordenar por:</span>
            <button
              className={`sort-btn ${sortBy === "date" ? "active" : ""}`}
              onClick={() => setSortBy("date")}
            >
              Data
            </button>
            <button
              className={`sort-btn ${sortBy === "confidence" ? "active" : ""}`}
              onClick={() => setSortBy("confidence")}
            >
              Confiança
            </button>
            <button
              className={`sort-btn ${sortBy === "name" ? "active" : ""}`}
              onClick={() => setSortBy("name")}
            >
              Nome
            </button>
          </div>
        </div>
      )}

      {/* Lista de Diagnósticos */}
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
          filteredHistory.map((item) => (
            <div key={item.id} className={`history-card ${getConfidenceClass(item.confidence)}`}>
              <div className="history-card-content">
                <div className="history-card-icon">
                  <span className="material-symbols-outlined">eco</span>
                </div>
                <div className="history-card-info">
                  <h3>{item.disease}</h3>
                  <div className="history-card-meta">
                    <span className="date">
                      <span className="material-symbols-outlined">schedule</span>
                      {item.date}
                    </span>
                    <span className={`confidence-badge ${getConfidenceClass(item.confidence)}`}>
                      {getConfidenceText(item.confidence)}
                    </span>
                  </div>
                  <div className="confidence-bar-container">
                    <div className="confidence-bar-label">
                      <span>Confiança</span>
                      <span>{item.confidence}%</span>
                    </div>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{ width: `${item.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <button
                  className="delete-item-btn"
                  onClick={() => deleteDiagnostic(item.id)}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
