import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import "../../../styles/App/DiarioTab.css"

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function DiarioTab() {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newEntry, setNewEntry] = useState({
    title: "",
    description: "",
    type: "observacao",
    date: getLocalDateValue()
  })
  const [selectedEntry, setSelectedEntry] = useState(null)

  // Carregar entradas do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("diaryEntries")
    if (saved) {
      setEntries(JSON.parse(saved))
    } else {
      // Dados de exemplo
      const sampleEntries = [
        {
          id: 1,
          title: "Aplicação de fungicida",
          description: "Aplicação preventiva na área norte da fazenda. Clima favorável, sem ventos.",
          type: "tratamento",
          date: "2024-03-20",
          time: "08:30"
        },
        {
          id: 2,
          title: "Irrigação realizada",
          description: "Sistema de irrigação ativado por 2 horas na área central.",
          type: "irrigacao",
          date: "2024-03-19",
          time: "16:00"
        },
        {
          id: 3,
          title: "Pragas detectadas",
          description: "Foco de lagarta identificado na borda da plantação. Monitoramento necessário.",
          type: "alerta",
          date: "2024-03-18",
          time: "10:15"
        }
      ]
      setEntries(sampleEntries)
      localStorage.setItem("diaryEntries", JSON.stringify(sampleEntries))
    }
  }, [])

  // Salvar entradas
  const saveEntries = (newEntries) => {
    setEntries(newEntries)
    localStorage.setItem("diaryEntries", JSON.stringify(newEntries))
  }

  // Adicionar nova entrada
  const addEntry = () => {
    if (!newEntry.title.trim()) return

    const entry = {
      id: Date.now(),
      ...newEntry,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }

    saveEntries([entry, ...entries])
    setNewEntry({
      title: "",
      description: "",
      type: "observacao",
      date: getLocalDateValue()
    })
    setShowForm(false)
  }

  // Deletar entrada
  const deleteEntry = (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta entrada?")) {
      saveEntries(entries.filter(entry => entry.id !== id))
    }
  }

  const parseLocalDate = (dateStr) => {
    const [year, month, day] = String(dateStr).split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  // Formatar data sem deslocamento de fuso horario
  const formatDate = (dateStr) => {
    const date = parseLocalDate(dateStr)
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
  }

  // Obter ícone baseado no tipo
  const getTypeIcon = (type) => {
    switch(type) {
      case "tratamento": return "experiment"
      case "irrigacao": return "water_drop"
      case "alerta": return "pest_control"
      default: return "edit_note"
    }
  }

  const getTypeColor = (type) => {
    switch(type) {
      case "tratamento": return "#2d6140"
      case "irrigacao": return "#0077ff"
      case "alerta": return "#ff9f1c"
      default: return "#3d8057"
    }
  }

  return (
    <div className="diario-container">
      <section className="diario-hero">
        <div className="diario-header">
          <h2>Diário de Campo</h2>
          <p>Registre suas atividades diárias</p>
        </div>
      </section>

      {/* Botão Nova Entrada */}
      <button 
        type="button"
        className="diario-add-btn"
        onClick={() => setShowForm(true)}
      >
        <span className="material-symbols-outlined">add</span>
        Nova entrada
      </button>

      {/* Formulário Nova Entrada */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="diario-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="diario-form"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="diario-form-header">
                <h3>Nova entrada</h3>
                <button className="close-btn" onClick={() => setShowForm(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Ex: Aplicação de fungicida"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  rows="3"
                  placeholder="Detalhes da atividade..."
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({...newEntry, type: e.target.value})}
                >
                  <option value="observacao">Observação</option>
                  <option value="tratamento">Tratamento</option>
                  <option value="irrigacao">Irrigação</option>
                  <option value="alerta">Alerta</option>
                </select>
              </div>

              <button className="submit-btn" onClick={addEntry}>
                Salvar entrada
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Entradas */}
      <div className="diario-list">
        {entries.length === 0 ? (
          <div className="diario-empty">
            <span className="material-symbols-outlined">menu_book</span>
            <p>Nenhuma entrada no diário</p>
            <p className="empty-hint">Clique em "Nova entrada" para começar</p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const entryColor = getTypeColor(entry.type)

            return (
            <motion.article
              key={entry.id}
              className="diario-card"
              style={{ "--entry-color": entryColor, "--entry-soft": `${entryColor}18` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedEntry(entry)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setSelectedEntry(entry)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="diario-card-icon" aria-hidden="true">
                <span className="material-symbols-outlined">{getTypeIcon(entry.type)}</span>
              </div>

              <div className="diario-card-content">
                <div className="diario-card-meta">
                  <span>
                    <span className="material-symbols-outlined" aria-hidden="true">calendar_today</span>
                    {formatDate(entry.date)}
                  </span>
                  <span>
                    <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
                    {entry.time}
                  </span>
                </div>

                <div className="diario-card-header">
                  <h3>{entry.title}</h3>
                  <button 
                    type="button"
                    className="delete-entry"
                    aria-label={`Excluir ${entry.title}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteEntry(entry.id)
                    }}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <p>{entry.description}</p>
              </div>
            </motion.article>
            )
          })
        )}
      </div>

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div 
            className="diario-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div 
              className="diario-detail"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-btn" onClick={() => setSelectedEntry(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
              <div className="detail-header">
                <span 
                  className="type-icon large"
                  style={{ background: `${getTypeColor(selectedEntry.type)}20`, color: getTypeColor(selectedEntry.type) }}
                >
                  <span className="material-symbols-outlined">{getTypeIcon(selectedEntry.type)}</span>
                </span>
                <div>
                  <h3>{selectedEntry.title}</h3>
                  <p className="detail-date">
                    {parseLocalDate(selectedEntry.date).toLocaleDateString("pt-BR")} • {selectedEntry.time}
                  </p>
                </div>
              </div>
              <p className="detail-description">{selectedEntry.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
