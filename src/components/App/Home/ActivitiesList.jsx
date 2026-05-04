// components/Home/ActivitiesList.jsx
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export default function ActivitiesList({ hasFarm, onViewAll, onRegister }) {
  const navigate = useNavigate()
  const [recentDiagnostics, setRecentDiagnostics] = useState([])

  // Carregar histórico de diagnósticos
  useEffect(() => {
    const saved = localStorage.getItem("diagnosticHistory")
    if (saved) {
      const history = JSON.parse(saved)
      // Pegar os 3 diagnósticos mais recentes
      setRecentDiagnostics(history.slice(0, 3))
    }
  }, [])

  if (!hasFarm) {
    return (
      <div className="empty-state glass">
        <div className="empty-icon">
          <span className="material-symbols-outlined">inbox</span>
          <div className="empty-icon-ring"></div>
        </div>
        <h3>Nenhuma atividade registrada</h3>
        <p>Cadastre uma fazenda para começar a monitorar suas atividades em tempo real</p>
        <button className="empty-action-btn" onClick={onRegister}>
          <span className="material-symbols-outlined">add</span>
          <span>Cadastrar Fazenda</span>
          <div className="btn-glow"></div>
        </button>
      </div>
    )
  }

  // Função para navegar para a página de atividades
  const goToActivities = () => {
    navigate("/explore", { state: { activeTab: "atividades" } })
  }

  // Função para navegar para o histórico completo de diagnósticos
  const goToHistory = () => {
    navigate("/explore", { state: { activeTab: "diagnostico", showHistory: true } })
  }

  return (
    <div className="activities-list">
      {/* Último Diagnóstico - Agora vai para Atividades */}
      {recentDiagnostics.length > 0 && (
        <div className="activity-card glass" onClick={goToActivities}>
          <div className="activity-icon atividades">
            <span className="material-symbols-outlined">assignment</span>
            <div className="icon-pulse"></div>
          </div>
          <div className="activity-content">
            <div className="activity-header">
              <h4 className="activity-title">Atividades do Campo</h4>
              <span className="activity-time">Gerencie suas tarefas</span>
            </div>
            <p className="activity-description">
              Visualize e gerencie todas as atividades da sua fazenda
            </p>
            <div className="activity-metrics">
              <div className="metric">
                <span className="material-symbols-outlined">checklist</span>
                <span>Tarefas pendentes</span>
              </div>
              <div className="metric">
                <span className="material-symbols-outlined">chevron_right</span>
                <span>Clique para acessar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mais Diagnósticos - Vai para o histórico */}
      {recentDiagnostics.length > 1 && (
        <div className="activity-card glass" onClick={goToHistory}>
          <div className="activity-icon diagnosticos">
            <span className="material-symbols-outlined">history</span>
            <div className="icon-pulse"></div>
          </div>
          <div className="activity-content">
            <div className="activity-header">
              <h4 className="activity-title">Diagnósticos Recentes</h4>
              <span className="activity-time">Ver todos →</span>
            </div>
            <p className="activity-description">
              {recentDiagnostics.slice(0, 2).map((diag, idx) => (
                <span key={idx}>
                  {diag.disease} ({diag.confidence}%)
                  {idx < recentDiagnostics.slice(0, 2).length - 1 && " • "}
                </span>
              ))}
            </p>
            <div className="activity-metrics">
              <div className="metric">
                <span className="material-symbols-outlined">inventory</span>
                <span>{recentDiagnostics.length} diagnósticos salvos</span>
              </div>
              <div className="metric">
                <span className="material-symbols-outlined">trending_up</span>
                <span>Clique para ver todos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voo de Mapeamento - Vai para o mapa */}
      <div className="activity-card glass" onClick={() => navigate("/explore", { state: { activeTab: "mapa" } })}>
        <div className="activity-icon mapeamento">
          <span className="material-symbols-outlined">flight_takeoff</span>
          <div className="icon-pulse"></div>
        </div>
        <div className="activity-content">
          <div className="activity-header">
            <h4 className="activity-title">Voo de Mapeamento</h4>
            <span className="activity-time">2h atrás</span>
          </div>
          <p className="activity-description">Visualize áreas mapeadas no mapa interativo</p>
          <div className="activity-metrics">
            <div className="metric">
              <span className="material-symbols-outlined">map</span>
              <span>Ver no mapa</span>
            </div>
            <div className="metric">
              <span className="material-symbols-outlined">chevron_right</span>
              <span>Clique para acessar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}