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

const statusFilters = [
  { value: "todas", label: "Todas", icon: "format_list_bulleted" },
  { value: "pendente", label: "Pendentes", icon: "schedule" },
  { value: "em_andamento", label: "Em andamento", icon: "sync" },
  { value: "concluida", label: "Concluídas", icon: "check" }
]

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

function formatActivityDate(dateStr) {
  const activityDate = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const differenceInDays = Math.round((activityDate - today) / 86400000)
  if (differenceInDays === 0) return "Hoje"
  if (differenceInDays === 1) return "Amanhã"
  if (differenceInDays === -1) return "Ontem"
  return formatDate(dateStr)
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
  const [dateFilter, setDateFilter] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [expandedActivityId, setExpandedActivityId] = useState(null)
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    const saved = localStorage.getItem("activities")
    if (saved) {
      try {
        const parsedActivities = JSON.parse(saved)
        setActivities(Array.isArray(parsedActivities) ? parsedActivities : [])
      } catch {
        setActivities([])
      }
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
        (activity.title || "").toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        (activity.description || "").toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        (activity.responsible || "").toLocaleLowerCase("pt-BR").includes(normalizedSearch)

      const matchesStatus = statusFilter === "todas" || activity.status === statusFilter
      const matchesType = typeFilter === "todos" || activity.type === typeFilter
      const matchesDate = !dateFilter || activity.date === dateFilter

      return matchesSearch && matchesStatus && matchesType && matchesDate
    })
  }, [activities, search, statusFilter, typeFilter, dateFilter])

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
    <div className="atividades-container activities-dashboard">
      <header className="activities-page-header">
        <div>
          <h1>Atividades</h1>
          <p>Acompanhe e gerencie suas tarefas</p>
        </div>
        <button
          type="button"
          className="activities-add-button"
          aria-label="Criar nova atividade"
          onClick={() => setShowForm(true)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
        </button>
      </header>

      <nav className="activities-status-tabs" aria-label="Filtrar por status">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={statusFilter === filter.value ? "active" : ""}
            onClick={() => setStatusFilter(filter.value)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </nav>

      <div className="activities-search-row">
        <label className="activities-search">
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <input
            type="search"
            aria-label="Buscar atividades"
            placeholder="Buscar atividades..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button
          type="button"
          className={`activities-filter-button ${filtersOpen ? "active" : ""}`}
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((current) => !current)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
          Filtros
          <span className="material-symbols-outlined activities-filter-chevron" aria-hidden="true">expand_more</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            className="activities-type-filter"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label htmlFor="activity-type-filter">Tipo de atividade</label>
            <select
              id="activity-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="todos">Todos os tipos</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="activities-summary" aria-labelledby="activities-summary-title">
        <h2 id="activities-summary-title">Resumo</h2>
        <div className="atividades-stats">
          <div className="stat-card">
            <span className="material-symbols-outlined" aria-hidden="true">description</span>
            <strong>{stats.total}</strong>
            <p>Total</p>
          </div>
          <div className="stat-card pending">
            <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
            <strong>{stats.pending}</strong>
            <p>Pendentes</p>
          </div>
          <div className="stat-card progress">
            <span className="material-symbols-outlined" aria-hidden="true">sync</span>
            <strong>{stats.progress}</strong>
            <p>Em andamento</p>
          </div>
          <div className="stat-card completed">
            <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
            <strong>{stats.completed}</strong>
            <p>Concluídas</p>
          </div>
        </div>
      </section>

      <section className="activities-recent" aria-labelledby="activities-recent-title">
        <h2 id="activities-recent-title">Atividades recentes</h2>
        <div className="activities-list">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => {
              const expanded = expandedActivityId === activity.id

              return (
                <motion.article
                  key={activity.id}
                  className={`activity-card ${isOverdue(activity) ? "overdue" : ""} ${expanded ? "expanded" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.2) }}
                >
                  <button
                    type="button"
                    className="activity-row-toggle"
                    aria-expanded={expanded}
                    onClick={() => setExpandedActivityId(expanded ? null : activity.id)}
                  >
                    <span
                      className="activity-icon"
                      style={{ color: getTypeColor(activity.type), background: `${getTypeColor(activity.type)}18` }}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">{getTypeIcon(activity.type)}</span>
                    </span>

                    <span className="activity-info">
                      <strong>{activity.title}</strong>
                      <small>
                        {activity.responsible || typeLabels[activity.type] || "Atividade"}
                        {activity.responsible && ` · ${typeLabels[activity.type] || "Atividade"}`}
                      </small>
                      {activity.description && <span>{activity.description}</span>}
                    </span>

                    <span className="activity-row-side">
                      <span className={`status-badge ${activity.status}`}>
                        {isOverdue(activity) ? "Atrasada" : statusLabels[activity.status] || activity.status}
                      </span>
                      <small>{formatActivityDate(activity.date)}</small>
                    </span>

                    <span className="material-symbols-outlined activity-row-chevron" aria-hidden="true">
                      chevron_right
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        className="activity-actions"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {activity.status === "pendente" && (
                          <button className="action-start" onClick={() => updateStatus(activity.id, "em_andamento")}>
                            <span className="material-symbols-outlined" aria-hidden="true">play_arrow</span>
                            Iniciar
                          </button>
                        )}
                        {activity.status !== "concluida" && activity.status !== "cancelada" && (
                          <button className="action-complete" onClick={() => updateStatus(activity.id, "concluida")}>
                            <span className="material-symbols-outlined" aria-hidden="true">check</span>
                            Concluir
                          </button>
                        )}
                        <button className="action-delete" onClick={() => deleteActivity(activity.id)} aria-label="Excluir atividade">
                          <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              )
            })
          ) : (
            <div className="empty-state">
              <span className="material-symbols-outlined">assignment</span>
              <p>Nenhuma atividade encontrada</p>
              <button onClick={() => setShowForm(true)}>Criar atividade</button>
            </div>
          )}
        </div>
      </section>

      <section className="activities-calendar-card">
        <span className="activities-calendar-icon material-symbols-outlined" aria-hidden="true">calendar_month</span>
        <div>
          <h2>Planeje suas atividades</h2>
          <p>Organize suas tarefas e acompanhe os próximos trabalhos da lavoura.</p>
        </div>
        <button type="button" onClick={() => setCalendarOpen((current) => !current)}>
          {calendarOpen ? "Fechar" : "Ver calendário"}
        </button>
        <AnimatePresence initial={false}>
          {calendarOpen && (
            <motion.div
              className="activities-calendar-filter"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <input
                type="date"
                aria-label="Filtrar atividades por data"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              />
              {dateFilter && (
                <button type="button" onClick={() => setDateFilter("")}>Limpar data</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

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
