import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { auth, db } from "../../services/firebase"
import MenuBar from "../../components/App/Global/MenuBar"
import { ACCOUNT_ROLES } from "../../services/accessControl"
import "../../styles/App/TeamAccess.css"

const fallbackTasks = [
  { id: "t1", title: "Inspecionar Setor A12", status: "andamento", due: "Hoje, 16:00", priority: "Alta" },
  { id: "t2", title: "Registrar umidade do solo", status: "pendente", due: "Hoje, 17:30", priority: "Media" },
  { id: "t3", title: "Enviar observacao do plantio", status: "concluida", due: "Ontem", priority: "Baixa" },
]

export default function EmployeeWork() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tasks, setTasks] = useState(fallbackTasks)
  const [workStatus, setWorkStatus] = useState("trabalhando")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login", { replace: true })
        return
      }

      setUser(currentUser)
      const userSnap = await getDoc(doc(db, "users", currentUser.uid))
      if (userSnap.exists()) {
        const data = userSnap.data()
        setProfile({ id: userSnap.id, ...data })
        setWorkStatus(data.status === "offline" ? "trabalhando" : data.status || "trabalhando")
      }

      const taskQuery = query(collection(db, "tasks"), where("employeeId", "==", currentUser.uid))
      const taskSnap = await getDocs(taskQuery)
      if (!taskSnap.empty) {
        setTasks(taskSnap.docs.map((taskDoc) => ({ id: taskDoc.id, ...taskDoc.data() })))
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const stats = useMemo(() => {
    const total = tasks.length || 1
    const done = tasks.filter((task) => task.status === "concluida").length

    return {
      pending: tasks.filter((task) => task.status === "pendente").length,
      active: tasks.filter((task) => task.status === "andamento").length,
      done,
      productivity: Math.round((done / total) * 100),
    }
  }, [tasks])

  const roleLabel = profile?.role === ACCOUNT_ROLES.COLLABORATOR ? "colaborador" : "funcionário"

  const updateTaskStatus = async (taskId, status) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status } : task))

    try {
      if (!String(taskId).startsWith("t")) {
        await updateDoc(doc(db, "tasks", taskId), {
          status,
          updatedAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error)
    }
  }

  const updateStatus = async (status) => {
    setWorkStatus(status)

    if (!user) return

    try {
      await updateDoc(doc(db, "users", user.uid), {
        status,
        lastActivityAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const submitNote = async () => {
    if (!note.trim() || !user) return

    setSaving(true)

    try {
      await addDoc(collection(db, "activities"), {
        employeeId: user.uid,
        employeeName: profile?.name || user.email,
        type: "observacao",
        note: note.trim(),
        createdAt: new Date().toISOString(),
      })
      setNote("")
    } catch (error) {
      console.error("Erro ao salvar observacao:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="team-page employee-page" data-system-bar-color="#f7f5f0">
      <section className="team-hero">
        <div>
          <span className="team-kicker">Area do {roleLabel}</span>
          <h1>Olá, {profile?.name?.split(" ")[0] || "Funcionário"}</h1>
          <p>Acompanhe suas tarefas, horários, observações e desempenho individual.</p>
        </div>

        <div className="employee-clock-card">
          <span>Entrada</span>
          <strong>07:30</strong>
          <span>Saída prevista</span>
          <strong>17:30</strong>
        </div>
      </section>

      <section className="status-grid">
        {["trabalhando", "pausa", "ausente", "offline"].map((status) => (
          <button
            key={status}
            className={`status-chip ${workStatus === status ? "active" : ""}`}
            onClick={() => updateStatus(status)}
          >
            {status}
          </button>
        ))}
      </section>

      <section className="team-metrics">
        <article><span>Pendentes</span><strong>{stats.pending}</strong></article>
        <article><span>Em andamento</span><strong>{stats.active}</strong></article>
        <article><span>Concluídas</span><strong>{stats.done}</strong></article>
        <article><span>Produtividade</span><strong>{stats.productivity}%</strong></article>
      </section>

      <section className="team-panel">
        <div className="team-section-header">
          <h2>Minhas tarefas</h2>
          <span>{tasks.length} registros</span>
        </div>

        <div className="task-list">
          {tasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <p>Prazo: {task.due || "Sem prazo"} • Prioridade: {task.priority || "Media"}</p>
              </div>
              <select value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)}>
                <option value="pendente">Pendente</option>
                <option value="andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="team-panel">
        <div className="team-section-header">
          <h2>Observações</h2>
          <span>Enviar atualização</span>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Descreva uma ocorrência, avanço ou necessidade no campo..."
        />
        <button className="team-primary-btn" onClick={submitNote} disabled={saving || !note.trim()}>
          {saving ? "Enviando..." : "Enviar observação"}
        </button>
      </section>

      <MenuBar />
    </main>
  )
}
