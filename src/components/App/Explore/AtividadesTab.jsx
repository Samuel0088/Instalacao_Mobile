import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import "../../../styles/App/AtividadesTab.css"

export default function AtividadesTab() {
  const [activities, setActivities] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [filterType, setFilterType] = useState("todas")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    type: "tarefa",
    status: "pendente",
    priority: "media",
    date: new Date().toISOString().split("T")[0],
    time: "",
    responsible: ""
  })

  // Tipos de atividade
  const activityTypes = [
    { id: "tarefa", name: "Tarefa", icon: "assignment", color: "#00ffaa" },
    { id: "voo", name: "Voo de Drone", icon: "flight", color: "#0066ff" },
    { id: "irrigacao", name: "Irrigação", icon: "water_drop", color: "#00ccff" },
    { id: "pulverizacao", name: "Pulverização", icon: "spray", color: "#ffaa00" },
    { id: "colheita", name: "Colheita", icon: "agriculture", color: "#00ffaa" },
    { id: "manutencao", name: "Manutenção", icon: "handyman", color: "#ff6b6b" }
  ]

  // Prioridades
  const priorities = [
    { id: "alta", name: "Alta", icon: "priority_high", color: "#ff4d4d" },
    { id: "media", name: "Média", icon: "drag_handle", color: "#ffaa00" },
    { id: "baixa", name: "Baixa", icon: "low_priority", color: "#00ffaa" }
  ]

  // Status
  const statuses = [
    { id: "pendente", name: "Pendente", icon: "pending", color: "#ffaa00" },
    { id: "em_andamento", name: "Em andamento", icon: "play_circle", color: "#0066ff" },
    { id: "concluida", name: "Concluída", icon: "check_circle", color: "#00ffaa" },
    { id: "cancelada", name: "Cancelada", icon: "cancel", color: "#ff4d4d" }
  ]

  // Carregar atividades
  useEffect(() => {
    const saved = localStorage.getItem("activities")
    if (saved) {
      setActivities(JSON.parse(saved))
    } else {
      // Dados de exemplo
      const sampleActivities = [
        {
          id: 1,
          title: "Aplicação de fungicida",
          description: "Aplicar fungicida na área norte da fazenda",
          type: "pulverizacao",
          status: "concluida",
          priority: "alta",
          date: "2024-03-20",
          time: "08:00",
          responsible: "João Silva",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Voo de mapeamento",
          description: "Realizar voo de mapeamento da área sul",
          type: "voo",
          status: "em_andamento",
          priority: "media",
          date: "2024-03-21",
          time: "14:00",
          responsible: "Drone Team",
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: "Irrigação programada",
          description: "Ativar sistema de irrigação na área central",
          type: "irrigacao",
          status: "pendente",
          priority: "alta",
          date: "2024-03-22",
          time: "06:00",
          responsible: "Sistema Automático",
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          title: "Manutenção de equipamentos",
          description: "Revisão dos pulverizadores",
          type: "manutencao",
          status: "pendente",
          priority: "media",
          date: "2024-03-23",
          time: "09:00",
          responsible: "Equipe Manutenção",
          createdAt: new Date().toISOString()
        }
      ]
      setActivities(sampleActivities)
      localStorage.setItem("activities", JSON.stringify(sampleActivities))
    }
  }, [])

  // Salvar atividades
  const saveActivities = (newActivities) => {
    setActivities(newActivities)
    localStorage.setItem("activities", JSON.stringify(newActivities))
  }

  // Adicionar atividade
  const addActivity = () => {
    if (!newActivity.title.trim()) return

    const activity = {
      id: Date.now(),
      ...newActivity,
      createdAt: new Date().toISOString()
    }

    saveActivities([activity, ...activities])
    setNewActivity({
      title: "",
      description: "",
      type: "tarefa",
      status: "pendente",
      priority: "media",
      date: new Date().toISOString().split("T")[0],
      time: "",
      responsible: ""
    })
    setShowForm(false)
  }

  // Atualizar atividade
  const updateActivity = () => {
    if (!selectedActivity) return

    const updatedActivities = activities.map(a =>
      a.id === selectedActivity.id ? { ...selectedActivity } : a
    )
    saveActivities(updatedActivities)
    setSelectedActivity(null)
  }

  // Deletar atividade
  const deleteActivity = (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta atividade?")) {
      saveActivities(activities.filter(a => a.id !== id))
    }
  }

  // Alterar status
  const changeStatus = (id, newStatus) => {
    const updatedActivities = activities.map(a => {
      if (a.id === id) {
        return { ...a, status: newStatus }
      }
      return a
    })
    saveActivities(updatedActivities)
  }

  // Filtrar atividades
  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === "todas" || activity.type === filterType
    const matchesStatus = filterStatus === "todos" || activity.status === filterStatus
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })

  // Ordenar por data
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    return new Date(b.date + " " + b.time) - new Date(a.date + " " + a.time)
  })

  // Estatísticas
  const totalActivities = activities.length
  const pendingActivities = activities.filter(a => a.status === "pendente").length
  const completedActivities = activities.filter(a => a.status === "concluida").length
  const inProgressActivities = activities.filter(a => a.status === "em_andamento").length

  // Obter dados do tipo
  const getTypeInfo = (typeId) => {
    return activityTypes.find(t => t.id === typeId) || activityTypes[0]
  }

  // Obter dados da prioridade
  const getPriorityInfo = (priorityId) => {
    return priorities.find(p => p.id === priorityId) || priorities[1]
  }

  // Obter dados do status
  const getStatusInfo = (statusId) => {
    return statuses.find(s => s.id === statusId) || statuses[0]
  }

  // Formatar data
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoje"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Amanhã"
    } else {
      return date.toLocaleDateString("pt-BR")
    }
  }

  // Verificar se está atrasada
  const isOverdue = (activity) => {
    if (activity.status === "concluida" || activity.status === "cancelada") return false
    const activityDate = new Date(activity.date + " " + activity.time)
    return activityDate < new Date()
  }

  return (
    <div className="atividades-container">
      {/* Header */}
      <div className="atividades-header">
        <h2>Atividades</h2>
        <p>Gerencie suas tarefas e operações do campo</p>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="atividades-controls">
        <div className="search-bar">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Buscar atividade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="todas">Todos os tipos</option>
            {activityTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="todos">Todos os status</option>
            {statuses.map(status => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="atividades-stats">
        <div className="stat-card">
          <span className="material-symbols-outlined">assignment</span>
          <div>
            <strong>{totalActivities}</strong>
            <p>Total</p>
          </div>
        </div>
        <div className="stat-card pending">
          <span className="material-symbols-outlined">pending</span>
          <div>
            <strong>{pendingActivities}</strong>
            <p>Pendentes</p>
          </div>
        </div>
        <div className="stat-card progress">
          <span className="material-symbols-outlined">play_circle</span>
          <div>
            <strong>{inProgressActivities}</strong>
            <p>Em andamento</p>
          </div>
        </div>
        <div className="stat-card completed">
          <span className="material-symbols-outlined">check_circle</span>
          <div>
            <strong>{completedActivities}</strong>
            <p>Concluídas</p>
          </div>
        </div>
      </div>

      {/* Botão Nova Atividade */}
      <button className="add-activity-btn" onClick={() => setShowForm(true)}>
        <span className="material-symbols-outlined">add</span>
        Nova atividade
      </button>

      {/* Lista de Atividades */}
      <div className="activities-list">
        {sortedActivities.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">assignment_turned_in</span>
            <p>Nenhuma atividade encontrada</p>
            <button onClick={() => setShowForm(true)}>Criar atividade</button>
          </div>
        ) : (
          sortedActivities.map((activity, index) => {
            const typeInfo = getTypeInfo(activity.type)
            const priorityInfo = getPriorityInfo(activity.priority)
            const statusInfo = getStatusInfo(activity.status)
            const overdue = isOverdue(activity)

            return (
              <motion.div
                key={activity.id}
                className={`activity-card ${activity.status} ${overdue ? "overdue" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="activity-header">
                  <div className="activity-icon" style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                    <span className="material-symbols-outlined">{typeInfo.icon}</span>
                  </div>
                  <div className="activity-info">
                    <h3>{activity.title}</h3>
                    <div className="activity-meta">
                      <span className="activity-type">{typeInfo.name}</span>
                      <span className="activity-date">
                        <span className="material-symbols-outlined">schedule</span>
                        {formatDate(activity.date)} {activity.time && `às ${activity.time}`}
                      </span>
                    </div>
                  </div>
                  <div className="activity-badges">
                    <div className={`priority-badge ${activity.priority}`}>
                      <span className="material-symbols-outlined">{priorityInfo.icon}</span>
                      {priorityInfo.name}
                    </div>
                    <div className={`status-badge ${activity.status}`}>
                      <span className="material-symbols-outlined">{statusInfo.icon}</span>
                      {statusInfo.name}
                    </div>
                  </div>
                </div>

                {activity.description && (
                  <p className="activity-description">{activity.description}</p>
                )}

                {activity.responsible && (
                  <div className="activity-responsible">
                    <span className="material-symbols-outlined">person</span>
                    <span>{activity.responsible}</span>
                  </div>
                )}

                {overdue && activity.status !== "concluida" && (
                  <div className="overdue-badge">
                    <span className="material-symbols-outlined">warning</span>
                    Atrasada
                  </div>
                )}

                <div className="activity-actions">
                  {activity.status === "pendente" && (
                    <button
                      className="action-start"
                      onClick={(e) => {
                        e.stopPropagation()
                        changeStatus(activity.id, "em_andamento")
                      }}
                    >
                      <span className="material-symbols-outlined">play_arrow</span>
                      Iniciar
                    </button>
                  )}
                  {activity.status === "em_andamento" && (
                    <button
                      className="action-complete"
                      onClick={(e) => {
                        e.stopPropagation()
                        changeStatus(activity.id, "concluida")
                      }}
                    >
                      <span className="material-symbols-outlined">check</span>
                      Concluir
                    </button>
                  )}
                  <button
                    className="action-delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteActivity(activity.id)
                    }}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Modal Nova Atividade */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="atividades-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="activity-form"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="form-header">
                <h3>Nova Atividade</h3>
                <button className="close-btn" onClick={() => setShowForm(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Ex: Aplicação de fungicida"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  rows="3"
                  placeholder="Detalhes da atividade..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  >
                    {activityTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridade</label>
                  <select
                    value={newActivity.priority}
                    onChange={(e) => setNewActivity({...newActivity, priority: e.target.value})}
                  >
                    {priorities.map(priority => (
                      <option key={priority.id} value={priority.id}>{priority.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={newActivity.date}
                    onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Horário</label>
                  <input
                    type="time"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({...newActivity, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Responsável</label>
                <input
                  type="text"
                  placeholder="Nome do responsável"
                  value={newActivity.responsible}
                  onChange={(e) => setNewActivity({...newActivity, responsible: e.target.value})}
                />
              </div>

              <button className="submit-btn" onClick={addActivity}>
                Criar atividade
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar Atividade */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            className="atividades-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              className="activity-form"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="form-header">
                <h3>Editar Atividade</h3>
                <button className="close-btn" onClick={() => setSelectedActivity(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={selectedActivity.title}
                  onChange={(e) => setSelectedActivity({...selectedActivity, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  rows="3"
                  value={selectedActivity.description}
                  onChange={(e) => setSelectedActivity({...selectedActivity, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={selectedActivity.type}
                    onChange={(e) => setSelectedActivity({...selectedActivity, type: e.target.value})}
                  >
                    {activityTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridade</label>
                  <select
                    value={selectedActivity.priority}
                    onChange={(e) => setSelectedActivity({...selectedActivity, priority: e.target.value})}
                  >
                    {priorities.map(priority => (
                      <option key={priority.id} value={priority.id}>{priority.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={selectedActivity.date}
                    onChange={(e) => setSelectedActivity({...selectedActivity, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Horário</label>
                  <input
                    type="time"
                    value={selectedActivity.time || ""}
                    onChange={(e) => setSelectedActivity({...selectedActivity, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Responsável</label>
                <input
                  type="text"
                  value={selectedActivity.responsible || ""}
                  onChange={(e) => setSelectedActivity({...selectedActivity, responsible: e.target.value})}
                />
              </div>

              <button className="submit-btn" onClick={updateActivity}>
                Salvar alterações
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}