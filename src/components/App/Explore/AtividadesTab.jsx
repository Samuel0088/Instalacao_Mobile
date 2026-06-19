import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import "../../../styles/App/AtividadesTab.css"

const initialForm = {
  title: "",
  description: "",
  type: "plantio",
  date: new Date().toISOString().split("T")[0],
  priority: "media",
  status: "pendente",
  responsible: ""
}

const sampleActivities = [
  {
    id: 1,
    title: "Vistoria da lavoura",
    description: "Verificar desenvolvimento das plantas e presença de pragas na área norte.",
    type: "monitoramento",
    date: new Date().toISOString().split("T")[0],
    priority: "alta",
    status: "pendente",
    responsible: "Equipe de campo"
  },
  {
    id: 2,
    title: "Aplicação de fertilizante",
    description: "Aplicar adubação conforme recomendação técnica do último diagnóstico.",
    type: "adubacao",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    priority: "media",
    status: "em_andamento",
    responsible: "Operador"
  }
]

const typeLabels = {
  tarefa: "Tarefa",
  voo: "Voo de Drone",
  plantio: "Plantio",
  monitoramento: "Monitoramento",
  irrigacao: "Irrigação",
  adubacao: "Adubação",
  pulverizacao: "Pulverização",
  colheita: "Colheita",
  manutencao: "Manutenção"
}

const statusLabels = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada"
}

function getTypeIcon(type) {
  switch (type) {
    case "tarefa":
      return "assignment"
    case "voo":
      return "flight"
    case "plantio":
      return "grass"
    case "irrigacao":
      return "water_drop"
    case "adubacao":
      return "science"
    case "pulverizacao":
      return "spray"
    case "colheita":
      return "agriculture"
    case "manutencao":
      return "build"
    default:
      return "assignment"
  }
}

function getTypeColor(type) {
  switch (type) {
    case "tarefa":
      return "#56a870"
    case "voo":
      return "#0066ff"
    case "plantio":
      return "#56a870"
    case "irrigacao":
      return "#0077ff"
    case "adubacao":
      return "#8a63d2"
    case "pulverizacao":
      return "#ffaa00"
    case "colheita":
      return "#d28a24"
    case "manutencao":
      return "#6d7882"
    default:
      return "#2d6140"
  }
}

function formatDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function isOverdue(activity) {
  if (activity.status === "concluida" || activity.status === "cancelada") return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${activity.date}T00:00:00`) < today
}

export default function AtividadesTab() {
  const [activities, setActivities] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todas")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    const saved = localStorage.getItem("activities")
    if (saved) {
      setActivities(JSON.parse(saved))
    } else {
      setActivities(sampleActivities)
      localStorage.setItem("activities", JSON.stringify(sampleActivities))
    }
  }, [])

  const saveActivities = (nextActivities) => {
    setActivities(nextActivities)
    localStorage.setItem("activities", JSON.stringify(nextActivities))
  }

  const filteredActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return activities.filter((activity) => {
      const matchesSearch =
        !normalizedSearch ||
        activity.title.toLowerCase().includes(normalizedSearch) ||
        activity.description.toLowerCase().includes(normalizedSearch)

      const matchesStatus = statusFilter === "todas" || activity.status === statusFilter
      const matchesType = typeFilter === "todos" || activity.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [activities, search, statusFilter, typeFilter])

  const stats = useMemo(() => ({
    total: activities.length,
    pending: activities.filter((activity) => activity.status === "pendente").length,
    progress: activities.filter((activity) => activity.status === "em_andamento").length,
    completed: activities.filter((activity) => activity.status === "concluida").length
  }), [activities])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) return

    const activity = {
      ...form,
      id: Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      responsible: form.responsible.trim()
    }

    saveActivities([activity, ...activities])
    setForm(initialForm)
    setShowForm(false)
  }

  const updateStatus = (id, status) => {
    saveActivities(activities.map((activity) => (
      activity.id === id ? { ...activity, status } : activity
    )))
  }

  const deleteActivity = (id) => {
    if (window.confirm("Deseja excluir esta atividade?")) {
      saveActivities(activities.filter((activity) => activity.id !== id))
    }
  }

  return (
    <div className="atividades-container">
      <div className="atividades-header">
        <h2>Atividades</h2>
        <p>Organize as tarefas do campo</p>
      </div>

      <div className="atividades-controls">
        <div className="search-bar">
          <span className="material-symbols-outlined">search</span>
          <input
            type="search"
            placeholder="Buscar atividade"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="filters-row">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="todas">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="todos">Todos os tipos</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="atividades-stats">
        <div className="stat-card">
          <span className="material-symbols-outlined">list_alt</span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total</p>
          </div>
        </div>
        <div className="stat-card pending">
          <span className="material-symbols-outlined">schedule</span>
          <div>
            <strong>{stats.pending}</strong>
            <p>Pendentes</p>
          </div>
        </div>
        <div className="stat-card progress">
          <span className="material-symbols-outlined">autorenew</span>
          <div>
            <strong>{stats.progress}</strong>
            <p>Em andamento</p>
          </div>
        </div>
        <div className="stat-card completed">
          <span className="material-symbols-outlined">check_circle</span>
          <div>
            <strong>{stats.completed}</strong>
            <p>Concluídas</p>
          </div>
        </div>
      </div>

      <button className="add-activity-btn" onClick={() => setShowForm(true)}>
        <span className="material-symbols-outlined">add</span>
        Nova atividade
      </button>

      <div className="activities-list">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <motion.article
              key={activity.id}
              className={`activity-card ${isOverdue(activity) ? "overdue" : ""}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="activity-header">
                <div
                  className="activity-icon"
                  style={{
                    color: getTypeColor(activity.type),
                    background: `${getTypeColor(activity.type)}22`
                  }}
                >
                  <span className="material-symbols-outlined">{getTypeIcon(activity.type)}</span>
                </div>

                <div className="activity-info">
                  <h3>{activity.title}</h3>
                  <div className="activity-meta">
                    <span className="activity-type">{typeLabels[activity.type] || "Atividade"}</span>
                    <span className="activity-date">
                      <span className="material-symbols-outlined">event</span>
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>

                <div className="activity-badges">
                  <span className={`priority-badge ${activity.priority}`}>
                    <span className="material-symbols-outlined">flag</span>
                    {activity.priority}
                  </span>
                  <span className={`status-badge ${activity.status}`}>
                    {statusLabels[activity.status] || activity.status}
                  </span>
                </div>
              </div>

              {activity.description && (
                <p className="activity-description">{activity.description}</p>
              )}

              {activity.responsible && (
                <div className="activity-responsible">
                  <span className="material-symbols-outlined">person</span>
                  {activity.responsible}
                </div>
              )}

              {isOverdue(activity) && (
                <div className="overdue-badge">
                  <span className="material-symbols-outlined">warning</span>
                  Atrasada
                </div>
              )}

              <div className="activity-actions">
                {activity.status === "pendente" && (
                  <button className="action-start" onClick={() => updateStatus(activity.id, "em_andamento")}>
                    <span className="material-symbols-outlined">play_arrow</span>
                    Iniciar
                  </button>
                )}
                {activity.status !== "concluida" && activity.status !== "cancelada" && (
                  <button className="action-complete" onClick={() => updateStatus(activity.id, "concluida")}>
                    <span className="material-symbols-outlined">check</span>
                    Concluir
                  </button>
                )}
                <button className="action-delete" onClick={() => deleteActivity(activity.id)} aria-label="Excluir atividade">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </motion.article>
          ))
        ) : (
          <div className="empty-state">
            <span className="material-symbols-outlined">assignment</span>
            <p>Nenhuma atividade encontrada</p>
            <button onClick={() => setShowForm(true)}>Criar atividade</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="atividades-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              className="activity-form"
              onSubmit={handleSubmit}
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
            >
              <div className="form-header">
                <h3>Nova atividade</h3>
                <button type="button" className="close-btn" onClick={() => setShowForm(false)} aria-label="Fechar">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="activity-title">Título</label>
                <input
                  id="activity-title"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Ex.: Inspeção do talhão"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="activity-description">Descrição</label>
                <textarea
                  id="activity-description"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Detalhes da atividade"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="activity-type">Tipo</label>
                  <select
                    id="activity-type"
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="activity-date">Data</label>
                  <input
                    id="activity-date"
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="activity-priority">Prioridade</label>
                  <select
                    id="activity-priority"
                    value={form.priority}
                    onChange={(event) => setForm({ ...form, priority: event.target.value })}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="activity-status">Status</label>
                  <select
                    id="activity-status"
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="activity-responsible">Responsável</label>
                <input
                  id="activity-responsible"
                  value={form.responsible}
                  onChange={(event) => setForm({ ...form, responsible: event.target.value })}
                  placeholder="Nome ou equipe"
                />
              </div>

              <button type="submit" className="submit-btn">Salvar atividade</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
