import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore"
import { auth, db } from "../../services/firebase"
import MenuBar from "../../components/App/Global/MenuBar"
import DroneIcon from "../../components/App/Global/DroneIcon"
import { ACCOUNT_ROLES } from "../../services/accessControl"
import "../../styles/App/TeamAccess.css"

const DRONE_MODELS = [
  "DJI Agras T10",
  "DJI Agras T20P",
  "DJI Agras T25",
  "DJI Agras T30",
  "DJI Agras T40",
  "DJI Mavic 3 Multispectral",
  "DJI Phantom 4 Multispectral",
  "XAG P100 Pro",
]

const statusLabels = {
  online: "Online",
  offline: "Offline",
  trabalhando: "Trabalhando",
  pausa: "Em pausa",
  ausente: "Ausente",
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function getTaskDate(task) {
  const rawDate = task.completedAt || task.updatedAt || task.createdAt
  if (!rawDate) return null
  const date = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate)
  return Number.isNaN(date.getTime()) ? null : date
}

function getCompletionRate(tasks, periodInDays = null) {
  const cutoff = periodInDays ? Date.now() - periodInDays * 24 * 60 * 60 * 1000 : null
  const scopedTasks = cutoff
    ? tasks.filter((task) => {
        const date = getTaskDate(task)
        return date && date.getTime() >= cutoff
      })
    : tasks

  if (scopedTasks.length === 0) return null
  const completed = scopedTasks.filter((task) => task.status === "concluida").length
  return Math.round((completed / scopedTasks.length) * 100)
}

export default function AdminTeamDashboard() {
  const location = useLocation()
  const assignTaskRef = useRef(null)
  const taskInputRef = useRef(null)
  const newEmployeeFormRef = useRef(null)
  const newEmployeeNameRef = useRef(null)
  const droneSelectRef = useRef(null)
  const [employees, setEmployees] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [isTeamLoading, setIsTeamLoading] = useState(true)
  const [filters, setFilters] = useState({ employee: "", sector: "todos", status: "todos", date: "" })
  const [taskTitle, setTaskTitle] = useState("")
  const [showNewEmployee, setShowNewEmployee] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    position: "",
    sector: "",
    droneModel: "",
    role: ACCOUNT_ROLES.EMPLOYEE,
  })

  useEffect(() => {
    async function loadEmployees() {
      try {
        const [usersSnap, tasksSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "tasks")),
        ])
        const ownerId = auth.currentUser?.uid
        const employeeDocs = usersSnap.docs.filter((docSnap) => (
          (docSnap.data().role === ACCOUNT_ROLES.EMPLOYEE ||
            docSnap.data().role === ACCOUNT_ROLES.COLLABORATOR) &&
          (docSnap.data().ownerId === ownerId || docSnap.data().teamId === ownerId)
        ))
        const tasks = tasksSnap.docs.map((taskDoc) => ({ id: taskDoc.id, ...taskDoc.data() }))

        if (employeeDocs.length > 0) {
          setEmployees(employeeDocs.map((docSnap) => {
            const data = docSnap.data()
            const employeeTasks = tasks.filter((task) => task.employeeId === docSnap.id)

            return {
              id: docSnap.id,
              name: data.name || "Funcionário",
              position: data.position || "Funcionário de campo",
              sector: data.sector || "Campo",
              status: data.status || "offline",
              entry: data.entry || "--:--",
              exit: data.exit || "--:--",
              hours: Number(data.hours) || 0,
              pending: employeeTasks.filter((task) => task.status === "pendente").length,
              active: employeeTasks.filter((task) => task.status === "andamento").length,
              done: employeeTasks.filter((task) => task.status === "concluida").length,
              productivity: getCompletionRate(employeeTasks),
              daily: getCompletionRate(employeeTasks, 1),
              weekly: getCompletionRate(employeeTasks, 7),
              monthly: getCompletionRate(employeeTasks, 30),
              tasks: employeeTasks,
              delays: Number(data.delays) || 0,
              absences: Number(data.absences) || 0,
              lastActivity: data.lastActivity || "Sem atividade registrada",
              droneModel: data.droneModel || "",
            }
          }))
          setSelectedId(employeeDocs[0].id)
        } else {
          setEmployees([])
          setSelectedId("")
        }
      } catch (error) {
        console.error("Erro ao carregar equipe:", error)
      } finally {
        setIsTeamLoading(false)
      }
    }

    loadEmployees()
  }, [])

  const sectors = useMemo(() => ["todos", ...new Set(employees.map((employee) => employee.sector))], [employees])

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const byEmployee = !filters.employee || employee.name.toLowerCase().includes(filters.employee.toLowerCase())
    const bySector = filters.sector === "todos" || employee.sector === filters.sector
    const byStatus = filters.status === "todos" || employee.status === filters.status
    return byEmployee && bySector && byStatus
  }), [employees, filters])

  const selected = filteredEmployees.find((employee) => employee.id === selectedId) || filteredEmployees[0] || employees[0]

  useEffect(() => {
    if (location.hash === "#novo-funcionario") {
      setShowNewEmployee(true)
      window.setTimeout(() => {
        newEmployeeFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
        newEmployeeNameRef.current?.focus()
      }, 120)
      return
    }

    if (location.hash === "#configurar-drone") {
      window.setTimeout(() => {
        droneSelectRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
        droneSelectRef.current?.focus()
      }, 120)
      return
    }

    if (location.hash !== "#nova-tarefa" || !assignTaskRef.current) return

    assignTaskRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    window.setTimeout(() => taskInputRef.current?.focus(), 360)
  }, [location.hash, selected?.id])

  const totals = useMemo(() => ({
    employees: employees.length,
    working: employees.filter((employee) => employee.status === "trabalhando" || employee.status === "online").length,
    pending: employees.reduce((sum, employee) => sum + employee.pending, 0),
    productivity: (() => {
      const measured = employees.filter((employee) => employee.productivity !== null)
      if (measured.length === 0) return null
      return Math.round(measured.reduce((sum, employee) => sum + employee.productivity, 0) / measured.length)
    })(),
  }), [employees])

  const assignTask = async () => {
    if (!taskTitle.trim() || !selected) return

    try {
      const taskPayload = {
        employeeId: selected.id,
        employeeName: selected.name,
        title: taskTitle.trim(),
        status: "pendente",
        priority: "Media",
        due: filters.date || "Sem prazo",
        ownerId: auth.currentUser?.uid || "",
        createdAt: new Date().toISOString(),
      }
      const taskRef = await addDoc(collection(db, "tasks"), taskPayload)
      setEmployees((current) => current.map((employee) => {
        if (employee.id !== selected.id) return employee

        const employeeTasks = [...(employee.tasks || []), { id: taskRef.id, ...taskPayload }]
        return {
          ...employee,
          tasks: employeeTasks,
          pending: employeeTasks.filter((task) => task.status === "pendente").length,
          active: employeeTasks.filter((task) => task.status === "andamento").length,
          done: employeeTasks.filter((task) => task.status === "concluida").length,
          productivity: getCompletionRate(employeeTasks),
          daily: getCompletionRate(employeeTasks, 1),
          weekly: getCompletionRate(employeeTasks, 7),
          monthly: getCompletionRate(employeeTasks, 30),
        }
      }))
      setTaskTitle("")
    } catch (error) {
      console.error("Erro ao atribuir tarefa:", error)
    }
  }

  const registerEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.email.trim()) return

    const employeePayload = {
      name: newEmployee.name.trim(),
      email: newEmployee.email.trim().toLowerCase(),
      position: newEmployee.position.trim() || (newEmployee.role === ACCOUNT_ROLES.COLLABORATOR ? "Colaborador" : "Funcionário de campo"),
      sector: newEmployee.sector.trim() || "Campo",
      droneModel: newEmployee.droneModel,
      role: newEmployee.role,
      ownerId: auth.currentUser?.uid || "",
      teamId: auth.currentUser?.uid || "",
      status: "offline",
      entry: "--:--",
      exit: "--:--",
      hours: 0,
      delays: 0,
      absences: 0,
      lastActivity: "Cadastro criado pelo administrador",
      inviteStatus: "pending",
      createdAt: new Date().toISOString(),
    }

    try {
      const docRef = await addDoc(collection(db, "users"), employeePayload)
      const createdEmployee = {
        id: docRef.id,
        ...employeePayload,
        entry: employeePayload.entry,
        exit: employeePayload.exit,
        hours: employeePayload.hours,
        pending: 0,
        active: 0,
        done: 0,
        productivity: null,
        daily: null,
        weekly: null,
        monthly: null,
        tasks: [],
        delays: 0,
        absences: 0,
        lastActivity: employeePayload.lastActivity,
      }

      setEmployees((current) => [createdEmployee, ...current])
      setSelectedId(docRef.id)
      setNewEmployee({ name: "", email: "", position: "", sector: "", droneModel: "", role: ACCOUNT_ROLES.EMPLOYEE })
      setShowNewEmployee(false)
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error)
    }
  }

  const updateDroneModel = async (droneModel) => {
    if (!selected) return
    const previousDroneModel = selected.droneModel

    setEmployees((current) => current.map((employee) => (
      employee.id === selected.id ? { ...employee, droneModel } : employee
    )))

    try {
      await updateDoc(doc(db, "users", selected.id), {
        droneModel,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Erro ao atualizar modelo do drone:", error)
      setEmployees((current) => current.map((employee) => (
        employee.id === selected.id ? { ...employee, droneModel: previousDroneModel } : employee
      )))
    }
  }

  return (
    <main className="team-page admin-page" data-system-bar-color="#f7f5f0">
      <section className="team-hero admin-hero">
        <div className="team-hero-copy">
          <span className="team-kicker">Dashboard administrativo</span>
          <h1>Monitoramento da equipe</h1>
          <p>Controle status, tarefas, horários, produtividade e desempenho de cada funcionário.</p>
        </div>
      </section>

      <section className="team-metrics">
        <article>
          <span className="material-symbols-outlined" aria-hidden="true">groups</span>
          <div><small>Funcionários</small><strong>{isTeamLoading ? "--" : totals.employees}</strong><p>Total na equipe</p></div>
        </article>
        <article>
          <span className="material-symbols-outlined" aria-hidden="true">agriculture</span>
          <div><small>Em operação</small><strong>{isTeamLoading ? "--" : totals.working}</strong><p>No momento</p></div>
        </article>
        <article>
          <span className="material-symbols-outlined" aria-hidden="true">assignment</span>
          <div><small>Tarefas pendentes</small><strong>{isTeamLoading ? "--" : totals.pending}</strong><p>Aguardando execução</p></div>
        </article>
        <article>
          <span className="material-symbols-outlined" aria-hidden="true">monitoring</span>
          <div><small>Produtividade média</small><strong>{isTeamLoading || totals.productivity === null ? "--" : `${totals.productivity}%`}</strong><p>Com base nas tarefas</p></div>
        </article>
      </section>

      <section className="team-filters">
        <label className="team-filter-field team-filter-search">
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <input
            value={filters.employee}
            onChange={(event) => setFilters((current) => ({ ...current, employee: event.target.value }))}
            placeholder="Filtrar funcionário"
          />
        </label>
        <label className="team-filter-field">
          <select value={filters.sector} onChange={(event) => setFilters((current) => ({ ...current, sector: event.target.value }))}>
            {sectors.map((sector) => <option key={sector} value={sector}>{sector === "todos" ? "Todos os setores" : sector}</option>)}
          </select>
        </label>
        <label className="team-filter-field">
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="todos">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="team-filter-field">
          <input
            type="date"
            value={filters.date}
            onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
          />
        </label>
      </section>

      <section className="admin-grid">
        <div className="team-panel team-roster-panel">
          <div className="team-section-header">
            <h2>Equipe</h2>
            <button className="team-link-btn" onClick={() => setShowNewEmployee((value) => !value)}>
              <span className="material-symbols-outlined" aria-hidden="true">{showNewEmployee ? "close" : "add"}</span>
              {showNewEmployee ? "Fechar" : "Novo funcionário"}
            </button>
          </div>

          {showNewEmployee && (
            <div className="new-employee-form" ref={newEmployeeFormRef}>
              <input
                ref={newEmployeeNameRef}
                value={newEmployee.name}
                onChange={(event) => setNewEmployee((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome do funcionário"
              />
              <input
                value={newEmployee.email}
                onChange={(event) => setNewEmployee((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email de acesso"
                type="email"
              />
              <input
                value={newEmployee.position}
                onChange={(event) => setNewEmployee((current) => ({ ...current, position: event.target.value }))}
                placeholder="Cargo"
              />
              <input
                value={newEmployee.sector}
                onChange={(event) => setNewEmployee((current) => ({ ...current, sector: event.target.value }))}
                placeholder="Setor"
              />
              <select
                value={newEmployee.droneModel}
                onChange={(event) => setNewEmployee((current) => ({ ...current, droneModel: event.target.value }))}
                aria-label="Modelo de drone do funcionário"
              >
                <option value="">Selecionar drone</option>
                {DRONE_MODELS.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
              <select
                value={newEmployee.role}
                onChange={(event) => setNewEmployee((current) => ({ ...current, role: event.target.value }))}
              >
                <option value={ACCOUNT_ROLES.EMPLOYEE}>Funcionário</option>
                <option value={ACCOUNT_ROLES.COLLABORATOR}>Colaborador</option>
              </select>
              <button onClick={registerEmployee}>Cadastrar</button>
            </div>
          )}

          <div className="employee-table">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                className={`employee-row ${selected?.id === employee.id ? "active" : ""}`}
                onClick={() => setSelectedId(employee.id)}
              >
                <span className={`status-dot ${employee.status}`}></span>
                <span className="employee-list-avatar">{getInitials(employee.name)}</span>
                <span className="employee-identity">
                  <strong>{employee.name}</strong>
                  <small>{employee.position} · {employee.sector}</small>
                </span>
                <span className="employee-productivity">
                  {employee.productivity === null ? "--" : `${employee.productivity}%`}
                </span>
                <span className="material-symbols-outlined employee-chevron" aria-hidden="true">chevron_right</span>
              </button>
            ))}
            {filteredEmployees.length === 0 && (
              <p className="team-empty-text">
                {isTeamLoading ? "Carregando equipe..." : "Nenhum funcionário encontrado com esses filtros."}
              </p>
            )}
          </div>
        </div>

        {selected && (
          <aside className="team-panel employee-detail">
            <div className="detail-header">
              <div className="employee-avatar">{getInitials(selected.name)}</div>
              <div className="detail-identity">
                <h2>{selected.name}</h2>
                <p>{selected.position} · {selected.sector}</p>
                <span className={`detail-status ${selected.status}`}>
                  <i></i>{statusLabels[selected.status] || selected.status}
                </span>
              </div>
            </div>

            <div className="detail-stats">
              <article><span className="material-symbols-outlined">schedule</span><div><small>Entrada</small><strong>{selected.entry}</strong></div></article>
              <article><span className="material-symbols-outlined">schedule</span><div><small>Saída</small><strong>{selected.exit}</strong></div></article>
              <article><span className="material-symbols-outlined">avg_time</span><div><small>Horas</small><strong>{selected.hours}h</strong></div></article>
              <article><span className="material-symbols-outlined">calendar_today</span><div><small>Atrasos</small><strong>{selected.delays}</strong></div></article>
              <article><span className="material-symbols-outlined">event_busy</span><div><small>Faltas</small><strong>{selected.absences}</strong></div></article>
              <article><span className="material-symbols-outlined">map</span><div><small>Setor</small><strong>{selected.sector}</strong></div></article>
            </div>

            <div className="last-activity">
              <span className="material-symbols-outlined" aria-hidden="true">deployed_code_history</span>
              <div><small>Última atividade</small><strong>{selected.lastActivity}</strong></div>
            </div>

            <div className="detail-performance-grid">
              <article className="productivity-card">
                <small>Produtividade pelas tarefas</small>
                <strong>{selected.productivity === null ? "--" : `${selected.productivity}%`}</strong>
                <p>{selected.productivity === null ? "Sem tarefas registradas" : "Tarefas concluídas no período"}</p>
                <div className="productivity-bars">
                  {[
                    ["Dia", selected.daily],
                    ["Semana", selected.weekly],
                    ["Mês", selected.monthly],
                  ].map(([label, value]) => (
                    <div key={label} title={value === null ? `${label}: sem dados` : `${label}: ${value}%`}>
                      <i style={{ height: value === null ? "0" : `${value}%` }}></i>
                    </div>
                  ))}
                </div>
              </article>
              <article className="drone-operation-card">
                <DroneIcon />
                <div>
                  <small>Drone utilizado</small>
                  <select
                    ref={droneSelectRef}
                    value={selected.droneModel}
                    onChange={(event) => updateDroneModel(event.target.value)}
                    aria-label={`Selecionar drone de ${selected.name}`}
                  >
                    <option value="">Selecionar modelo</option>
                    {selected.droneModel && !DRONE_MODELS.includes(selected.droneModel) && (
                      <option value={selected.droneModel}>{selected.droneModel}</option>
                    )}
                    {DRONE_MODELS.map((model) => <option key={model} value={model}>{model}</option>)}
                  </select>
                  <p>{selected.droneModel ? "Modelo salvo" : "Nenhum drone selecionado"}</p>
                </div>
              </article>
            </div>

            <div className="assign-task" id="nova-tarefa" ref={assignTaskRef}>
              <input
                ref={taskInputRef}
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Nova tarefa para este funcionário"
              />
              <button onClick={assignTask}>Atribuir tarefa</button>
            </div>

            <div className="detail-actions">
              <button><span className="material-symbols-outlined">edit_calendar</span> Editar prazo</button>
              <button><span className="material-symbols-outlined">notifications</span> Enviar aviso</button>
              <button><span className="material-symbols-outlined">description</span> Relatório</button>
            </div>
          </aside>
        )}
      </section>

      <MenuBar />
    </main>
  )
}
